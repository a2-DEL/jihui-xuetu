import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ActorContext } from "@/lib/platform/authorization";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";

export interface UserSettings {
  version: number;
  updatedAt: string;
  interface: {
    theme: "light" | "dark" | "system";
    language: "zh-CN" | "en-US";
    fontSize: "small" | "standard" | "large";
    homepage: "/dashboard/overview" | "/application/all" | "/student/portal";
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    approvalReminder: boolean;
    deadlineReminder: boolean;
    systemAnnouncement: boolean;
  };
  security: {
    loginReminder: boolean;
    sessionTimeoutMinutes: 15 | 30 | 60;
    mfaStatus: "not_enrolled" | "enabled";
  };
}

type SettingsGlobal = typeof globalThis & { __jhxtUserSettings?: Map<string, UserSettings> };
const settingsFile = path.join(process.cwd(), ".runtime", "user-settings.json");
function loadSettings() {
  try {
    const rows = JSON.parse(readFileSync(settingsFile, "utf8")) as Record<string, UserSettings>;
    return new Map(Object.entries(rows));
  } catch { return new Map<string, UserSettings>(); }
}
const settingsRoot = globalThis as SettingsGlobal;
const settingsByUser = settingsRoot.__jhxtUserSettings ?? loadSettings();
settingsRoot.__jhxtUserSettings = settingsByUser;
function persistSettings() {
  try {
    mkdirSync(path.dirname(settingsFile), { recursive: true });
    const temporary = `${settingsFile}.tmp`;
    writeFileSync(temporary, JSON.stringify(Object.fromEntries(settingsByUser), null, 2), "utf8");
    renameSync(temporary, settingsFile);
  } catch { /* Local persistence is best-effort; the in-memory adapter remains available. */ }
}

function defaults(): UserSettings {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    interface: { theme: "system", language: "zh-CN", fontSize: "standard", homepage: "/dashboard/overview" },
    notifications: { email: true, sms: false, inApp: true, approvalReminder: true, deadlineReminder: true, systemAnnouncement: true },
    security: { loginReminder: true, sessionTimeoutMinutes: 30, mfaStatus: "not_enrolled" },
  };
}

function clone(settings: UserSettings): UserSettings {
  return structuredClone(settings);
}

export function getUserSettings(actor: ActorContext): UserSettings {
  const current = settingsByUser.get(actor.userId) ?? defaults();
  if (!settingsByUser.has(actor.userId)) settingsByUser.set(actor.userId, current);
  return clone(current);
}

export function updateUserSettings(actor: ActorContext, input: { expectedVersion: number; patch: Partial<Pick<UserSettings, "interface" | "notifications" | "security">> }) {
  const current = settingsByUser.get(actor.userId) ?? defaults();
  if (input.expectedVersion !== current.version) return { success: false as const, code: "VERSION_CONFLICT", message: "设置已在其他会话更新，请刷新后重试。", settings: clone(current) };
  const next: UserSettings = {
    ...current,
    interface: input.patch.interface ? { ...current.interface, ...input.patch.interface } : current.interface,
    notifications: input.patch.notifications ? { ...current.notifications, ...input.patch.notifications } : current.notifications,
    security: input.patch.security ? { ...current.security, ...input.patch.security, mfaStatus: current.security.mfaStatus } : current.security,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };
  settingsByUser.set(actor.userId, next);
  persistSettings();
  writeAuditSnapshot({ taskId: `settings-${actor.userId}-${next.version}`, actorId: actor.userId, actorRole: actor.role, action: "account_settings:update", outcome: "success", evidenceSummary: `用户设置已更新至版本 ${next.version}；包含 ${Object.keys(input.patch).join("、")}。` });
  return { success: true as const, code: "SETTINGS_UPDATED", message: "设置已保存并立即生效。", settings: clone(next) };
}

export function updateInterfacePreferences(actor: ActorContext, interfacePreferences: UserSettings["interface"]) {
  const current = settingsByUser.get(actor.userId) ?? defaults();
  const next: UserSettings = {
    ...current,
    interface: { ...interfacePreferences },
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };
  settingsByUser.set(actor.userId, next);
  persistSettings();
  writeAuditSnapshot({ taskId: `preferences-${actor.userId}-${next.version}`, actorId: actor.userId, actorRole: actor.role, action: "account_preferences:sync", outcome: "success", evidenceSummary: `界面偏好已跨设备同步至版本 ${next.version}；主题 ${next.interface.theme}，字号 ${next.interface.fontSize}。` });
  return clone(next);
}

export function enableDemoMfa(actor: ActorContext) {
  const current = settingsByUser.get(actor.userId) ?? defaults();
  const next: UserSettings = { ...current, security: { ...current.security, mfaStatus: "enabled" }, version: current.version + 1, updatedAt: new Date().toISOString() };
  settingsByUser.set(actor.userId, next);
  persistSettings();
  writeAuditSnapshot({ taskId: `mfa-${actor.userId}-${next.version}`, actorId: actor.userId, actorRole: actor.role, action: "account_security:mfa_enroll", outcome: "success", evidenceSummary: "演示身份已完成 MFA 模拟注册；生产环境必须对接统一身份认证平台。" });
  return clone(next);
}