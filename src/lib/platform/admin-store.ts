import type { ActorContext } from "@/lib/platform/authorization";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";

export type AccountStatus = "active" | "frozen" | "disabled";
export interface AdminAccount { id: string; username: string; name: string; role: string; department: string; campus: string; status: AccountStatus; mfa: boolean; lastActive: string; version: number }
export interface OrganizationNode { id: string; name: string; type: "campus" | "college" | "major" | "class"; children?: OrganizationNode[] }
export interface AdminSession { id: string; accountId: string; user: string; role: string; ip: string; device: string; signedInAt: string; lastSeenAt: string; risk: "normal" | "attention"; status: "online" | "terminated"; version: number }
export interface PermissionConflict { id: string; severity: "high" | "medium" | "low"; subject: string; rule: string; detail: string; suggestion: string; status: "open" | "resolved"; detectedAt: string }
export interface WorkflowTemplate { id: string; name: string; versionName: string; nodes: string[]; timeoutHours: number; rollbackEnabled: boolean; status: "active" | "draft"; version: number }
export interface PlatformPolicy { mfaRequiredForAdmins: boolean; passwordValidityDays: number; idleSessionMinutes: number; draftRetentionDays: number; graduateArchiveYears: number; caseRetentionYears: number; logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; version: number }
export interface IntegrationHealth { id: string; name: string; protocol: string; auth: string; status: "healthy" | "degraded"; calls24h: number; successRate: number; latencyMs: number }
export interface PlatformAdminSnapshot { organizations: OrganizationNode[]; accounts: AdminAccount[]; sessions: AdminSession[]; conflicts: PermissionConflict[]; workflows: WorkflowTemplate[]; policy: PlatformPolicy; integrations: IntegrationHealth[]; auditEvents: Array<{ id: string; time: string; actor: string; action: string; result: string; ip: string }> }

type StoredResult = { success: true; code: string; message: string } | { success: false; code: string; message: string };
interface AdminStore extends PlatformAdminSnapshot { idempotency: Map<string, StoredResult> }
const stamp = "2026-08-03 09:30";
function createStore(): AdminStore {
  return {
    organizations: [{ id: "campus-baoding", name: "保定主校区", type: "campus", children: [
      { id: "college-agri", name: "农学院", type: "college", children: [{ id: "major-agri", name: "农学专业", type: "major", children: [{ id: "class-agri-01", name: "农学2401班", type: "class" }] }] },
      { id: "college-econ", name: "经济管理学院", type: "college", children: [{ id: "major-finance", name: "金融学专业", type: "major", children: [{ id: "class-finance-01", name: "金融2401班", type: "class" }] }] },
      { id: "college-it", name: "信息科学与技术学院", type: "college", children: [{ id: "major-cs", name: "计算机科学与技术", type: "major" }] },
    ] }, { id: "campus-binhai", name: "渤海校区", type: "campus", children: [{ id: "college-ocean", name: "海洋学院", type: "college" }] }],
    accounts: [
      { id: "u-sys", username: "sys_admin", name: "李平台", role: "系统管理员", department: "信息化中心", campus: "全校区", status: "active", mfa: true, lastActive: "刚刚", version: 3 },
      { id: "u-ai", username: "ai_ops", name: "周智能", role: "AI运维管理员", department: "信息化中心", campus: "全校区", status: "active", mfa: true, lastActive: "2分钟前", version: 2 },
      { id: "u-fund", username: "fund_admin", name: "孙管理员", role: "校级资助管理员", department: "学生资助中心", campus: "保定主校区", status: "active", mfa: true, lastActive: "8分钟前", version: 4 },
      { id: "u-finance", username: "finance", name: "钱会计", role: "校级财务", department: "财务处", campus: "保定主校区", status: "active", mfa: true, lastActive: "16分钟前", version: 1 },
      { id: "u-counselor", username: "counselor", name: "郑辅导员", role: "辅导员", department: "农学院", campus: "保定主校区", status: "active", mfa: false, lastActive: "23分钟前", version: 2 },
      { id: "u-temp", username: "temp_audit", name: "临时审计账号", role: "第三方审计", department: "外部机构", campus: "任务授权", status: "frozen", mfa: true, lastActive: "2天前", version: 5 },
    ],
    sessions: [
      { id: "sess-001", accountId: "u-sys", user: "李平台", role: "系统管理员", ip: "10.20.8.12", device: "Windows 11 · Edge", signedInAt: "08:36", lastSeenAt: "刚刚", risk: "normal", status: "online", version: 1 },
      { id: "sess-002", accountId: "u-ai", user: "周智能", role: "AI运维管理员", ip: "10.20.8.25", device: "macOS · Chrome", signedInAt: "08:41", lastSeenAt: "2分钟前", risk: "normal", status: "online", version: 1 },
      { id: "sess-003", accountId: "u-temp", user: "临时审计账号", role: "第三方审计", ip: "117.34.22.18", device: "Windows 10 · Chrome", signedInAt: "07:12", lastSeenAt: "48分钟前", risk: "attention", status: "online", version: 2 },
    ],
    conflicts: [
      { id: "conflict-001", severity: "high", subject: "临时审计账号", rule: "职责分离 SoD-07", detail: "同时持有“凭证查看”和“发放批次确认”能力。", suggestion: "移除发放确认能力，仅保留任务范围只读权限。", status: "open", detectedAt: stamp },
      { id: "conflict-002", severity: "medium", subject: "校级资助管理员", rule: "字段权限 P3-02", detail: "银行账号完整字段与申诉裁定权限存在组合暴露。", suggestion: "非发放流程阶段对银行卡字段执行脱敏。", status: "open", detectedAt: stamp },
      { id: "conflict-003", severity: "low", subject: "辅导员角色", rule: "时间策略 T-03", detail: "批量导出权限未限定工作时间。", suggestion: "增加工作日 08:00—18:00 条件。", status: "resolved", detectedAt: "2026-08-02 16:20" },
    ],
    workflows: [{ id: "wf-aid-standard", name: "标准资助申请审批流", versionName: "v6.2", nodes: ["申请", "辅导员初审", "院系复核", "校级复审", "公示", "申诉", "财务发放"], timeoutHours: 48, rollbackEnabled: true, status: "active", version: 6 }, { id: "wf-emergency", name: "临时困难绿色通道", versionName: "v2.1-draft", nodes: ["申请", "快速核验", "校级审批", "财务发放"], timeoutHours: 6, rollbackEnabled: true, status: "draft", version: 2 }],
    policy: { mfaRequiredForAdmins: true, passwordValidityDays: 90, idleSessionMinutes: 30, draftRetentionDays: 30, graduateArchiveYears: 5, caseRetentionYears: 50, logLevel: "INFO", version: 3 },
    integrations: [
      { id: "int-student", name: "统一教务与学籍平台", protocol: "MCP / REST", auth: "OAuth2 服务身份", status: "healthy", calls24h: 1284, successRate: 99.8, latencyMs: 82 },
      { id: "int-bank", name: "合作银行代发平台", protocol: "MCP / mTLS", auth: "双向证书 + IP白名单", status: "degraded", calls24h: 87, successRate: 96.2, latencyMs: 426 },
      { id: "int-province", name: "教育厅监管交换平台", protocol: "国密签名 API", auth: "机构证书", status: "healthy", calls24h: 56, successRate: 100, latencyMs: 138 },
    ],
    auditEvents: [
      { id: "audit-001", time: "09:22:18", actor: "李平台", action: "查看全量操作日志", result: "允许", ip: "10.20.8.12" },
      { id: "audit-002", time: "09:15:06", actor: "周智能", action: "运行核心AI回归集", result: "通过", ip: "10.20.8.25" },
      { id: "audit-003", time: "08:58:42", actor: "系统护栏", action: "阻断越权敏感数据导出", result: "已阻断", ip: "10.20.16.33" },
    ],
    idempotency: new Map(),
  };
}
type GlobalStore = typeof globalThis & { __jhxtPlatformAdmin?: AdminStore };
const root = globalThis as GlobalStore;
const store = root.__jhxtPlatformAdmin ?? createStore();
root.__jhxtPlatformAdmin = store;

function cloneSnapshot(): PlatformAdminSnapshot { return { organizations: structuredClone(store.organizations), accounts: store.accounts.map(item => ({ ...item })), sessions: store.sessions.map(item => ({ ...item })), conflicts: store.conflicts.map(item => ({ ...item })), workflows: store.workflows.map(item => ({ ...item, nodes: [...item.nodes] })), policy: { ...store.policy }, integrations: store.integrations.map(item => ({ ...item })), auditEvents: store.auditEvents.map(item => ({ ...item })) }; }
export function getPlatformAdminSnapshot(actor: ActorContext) { return actor.role === "SYS_ADMIN" ? cloneSnapshot() : null; }

export type PlatformAdminAction =
  | { action: "set_account_status"; accountId: string; status: AccountStatus; expectedVersion: number; reason: string }
  | { action: "terminate_session"; sessionId: string; expectedVersion: number; reason: string }
  | { action: "run_conflict_scan"; reason: string }
  | { action: "resolve_conflict"; conflictId: string; reason: string }
  | { action: "update_mfa_policy"; required: boolean; expectedVersion: number; reason: string }
  | { action: "activate_workflow"; workflowId: string; expectedVersion: number; reason: string };

export function processPlatformAdminAction(actor: ActorContext, input: PlatformAdminAction, idempotencyKey: string): StoredResult {
  if (actor.role !== "SYS_ADMIN") return { success: false, code: "ROLE_DENIED", message: "仅系统管理员可执行平台治理操作。" };
  if (!idempotencyKey) return { success: false, code: "IDEMPOTENCY_REQUIRED", message: "缺少幂等键，操作已拒绝。" };
  if (input.reason.trim().length < 4) return { success: false, code: "REASON_REQUIRED", message: "请填写至少4个字的变更原因。" };
  const scope = `${actor.userId}:${idempotencyKey}`; const replay = store.idempotency.get(scope); if (replay) return replay;
  let message = "平台配置已更新";
  if (input.action === "set_account_status") {
    const account = store.accounts.find(item => item.id === input.accountId); if (!account) return { success: false, code: "NOT_FOUND", message: "账号不存在。" }; if (account.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "账号状态已变化，请刷新后重试。" }; if (account.id === "u-sys" && input.status !== "active") return { success: false, code: "SELF_PROTECTION", message: "当前唯一平台管理员账号不能被停用或冻结。" }; account.status = input.status; account.version += 1; message = `${account.name} 已更新为${input.status === "active" ? "启用" : input.status === "frozen" ? "冻结" : "停用"}状态`;
  } else if (input.action === "terminate_session") {
    const session = store.sessions.find(item => item.id === input.sessionId); if (!session) return { success: false, code: "NOT_FOUND", message: "会话不存在。" }; if (session.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "会话已变化，请刷新后重试。" }; if (session.accountId === "u-sys") return { success: false, code: "SELF_SESSION_PROTECTED", message: "不能在当前工作台强制终止平台管理员自身会话。" }; session.status = "terminated"; session.version += 1; message = `${session.user} 的在线会话已强制终止`;
  } else if (input.action === "run_conflict_scan") {
    store.conflicts.forEach(item => { if (item.status === "open") item.detectedAt = new Date().toLocaleString("zh-CN", { hour12: false }); }); message = `权限冲突扫描完成，发现 ${store.conflicts.filter(item => item.status === "open").length} 项待处理冲突`;
  } else if (input.action === "resolve_conflict") {
    const conflict = store.conflicts.find(item => item.id === input.conflictId); if (!conflict) return { success: false, code: "NOT_FOUND", message: "冲突记录不存在。" }; conflict.status = "resolved"; message = `${conflict.subject} 的权限冲突已完成处置`;
  } else if (input.action === "update_mfa_policy") {
    if (store.policy.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "安全策略已变化，请刷新后重试。" }; store.policy.mfaRequiredForAdmins = input.required; store.policy.version += 1; message = input.required ? "管理岗位强制MFA策略已启用" : "管理岗位强制MFA策略已关闭";
  } else {
    const workflow = store.workflows.find(item => item.id === input.workflowId); if (!workflow) return { success: false, code: "NOT_FOUND", message: "流程模板不存在。" }; if (workflow.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "流程模板已变化，请刷新后重试。" }; store.workflows.forEach(item => { if (item.id !== workflow.id) item.status = "draft"; }); workflow.status = "active"; workflow.version += 1; message = `${workflow.name} 已发布为当前生效流程`;
  }
  const result: StoredResult = { success: true, code: "ACTION_COMPLETED", message }; store.idempotency.set(scope, result);
  store.auditEvents.unshift({ id: `audit-${Date.now()}`, time: new Date().toLocaleTimeString("zh-CN", { hour12: false }), actor: "李平台", action: input.action, result: "成功", ip: "10.20.8.12" });
  writeAuditSnapshot({ taskId: `platform-${Date.now()}`, actorId: actor.userId, actorRole: actor.role, action: `platform:${input.action}`, outcome: "success", evidenceSummary: `${message}；原因：${input.reason.slice(0, 120)}` });
  return result;
}
