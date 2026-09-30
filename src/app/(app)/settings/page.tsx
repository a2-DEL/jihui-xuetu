"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Eye, EyeOff, Globe2, Home, KeyRound, Languages, Lock, MonitorCog, Palette, Save, ShieldCheck, Smartphone, TextCursorInput, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PREFERENCES_SYNCED_EVENT, useAppPreferences, type FontSizePreference, type HomePagePreference, type InterfaceLanguage } from "@/components/providers/preferences-provider";
import { useToast } from "@/hooks/use-toast";
import type { UserSettings } from "@/lib/platform/user-settings-store";

const themeOptions = [
  { value: "light", label: "浅色模式", description: "明亮、清晰的日间工作环境", preview: "bg-[#f4f7fb]" },
  { value: "dark", label: "深色模式", description: "降低暗光环境下的视觉疲劳", preview: "bg-[#111d2e]" },
  { value: "system", label: "跟随系统", description: "自动匹配设备外观设置", preview: "bg-gradient-to-br from-[#f4f7fb] via-[#f4f7fb] to-[#111d2e]" },
] as const;

const homepageOptions: Array<{ value: HomePagePreference; label: string; description: string }> = [
  { value: "/dashboard/overview", label: "总览驾驶舱", description: "登录后先查看本岗位指标、风险和待办" },
  { value: "/application/all", label: "待审批与申请列表", description: "适合高频处理审核任务的业务岗位" },
  { value: "/student/portal", label: "我的申请", description: "适合学生或关注个人事项的账号" },
];

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const { preferences, resolvedTheme, syncStatus, updatePreferences, replacePreferences, syncPreferences } = useAppPreferences();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const authHeaders = useMemo(() => {
    if (typeof window === "undefined") return { "Content-Type": "application/json" };
    const token = localStorage.getItem("token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings/preferences", { headers: authHeaders, signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const payload = await response.json() as { success?: boolean; data?: UserSettings; error?: string };
        if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "设置加载失败");
        return payload.data;
      })
      .then(data => {
        setSettings(data);
        replacePreferences(data.interface);
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast({ title: "设置加载失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [authHeaders, replacePreferences, toast]);

  useEffect(() => {
    const handleSyncedPreferences = (event: Event) => {
      const synced = (event as CustomEvent<UserSettings>).detail;
      if (!synced) return;
      setSettings(current => current ? { ...current, version: synced.version, updatedAt: synced.updatedAt, interface: synced.interface } : synced);
    };
    window.addEventListener(PREFERENCES_SYNCED_EVENT, handleSyncedPreferences);
    return () => window.removeEventListener(PREFERENCES_SYNCED_EVENT, handleSyncedPreferences);
  }, []);

  async function savePatch(section: string, patch: Partial<Pick<UserSettings, "interface" | "notifications" | "security">>) {
    if (!settings) return;
    setSaving(section);
    try {
      const send = (expectedVersion: number) => fetch("/api/settings/preferences", { method: "PUT", headers: authHeaders, body: JSON.stringify({ expectedVersion, patch }) });
      let response = await send(settings.version);
      let payload = await response.json() as { success?: boolean; data?: UserSettings; error?: string; message?: string };
      if (response.status === 409) {
        const latestResponse = await fetch("/api/settings/preferences", { headers: authHeaders, cache: "no-store" });
        const latestPayload = await latestResponse.json() as { success?: boolean; data?: UserSettings; error?: string };
        if (!latestResponse.ok || !latestPayload.success || !latestPayload.data) throw new Error(latestPayload.error ?? "Unable to refresh settings version");
        response = await send(latestPayload.data.version);
        payload = await response.json() as typeof payload;
      }
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "保存失败");
      setSettings(payload.data);
      toast({ title: "设置已生效", description: payload.message ?? "偏好已同步到当前账号。" });
    } catch (error) {
      toast({ title: "保存失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    } finally { setSaving(null); }
  }

  async function changePassword() {
    if (!passwordForm.currentPassword) return toast({ title: "请输入当前密码", variant: "destructive" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast({ title: "两次输入的新密码不一致", variant: "destructive" });
    setSaving("password");
    try {
      const response = await fetch("/api/settings/password", { method: "POST", headers: authHeaders, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
      const payload = await response.json() as { success?: boolean; error?: string; message?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "密码修改失败");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "密码已修改", description: payload.message });
    } catch (error) { toast({ title: "密码修改失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" }); }
    finally { setSaving(null); }
  }

  async function enrollMfa() {
    setSaving("mfa");
    try {
      const response = await fetch("/api/settings/mfa", { method: "POST", headers: authHeaders });
      const payload = await response.json() as { success?: boolean; data?: UserSettings; error?: string; message?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "MFA 配置失败");
      setSettings(payload.data);
      toast({ title: "MFA 已启用", description: "演示身份注册完成；生产部署将对接学校统一身份平台。" });
    } catch (error) { toast({ title: "MFA 配置失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" }); }
    finally { setSaving(null); }
  }

  const selectedTheme = preferences.theme;
  const notifications = settings?.notifications;
  const security = settings?.security;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-card px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,.06)] sm:px-7 lg:px-8 dark:border-slate-700">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,.13),transparent_58%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-blue-600"><UserCog className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-semibold tracking-[.18em] text-blue-600">ACCOUNT & EXPERIENCE</p><h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">账号与工作台设置</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">设置会按账号保存并即时应用。安全类变更写入审计日志，界面偏好在当前设备保留离线副本。</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-amber-500" : settings ? "bg-emerald-500" : "bg-rose-500"}`} />{loading ? "正在同步设置" : settings ? `已同步 · 版本 ${settings.version}` : "使用本地设置"}</div>
        </div>
      </section>

      <Tabs defaultValue="preference" className="gap-5">
        <div className="overflow-x-auto pb-1"><TabsList className="h-12 min-w-max gap-1 rounded-2xl border border-slate-200 bg-card p-1 shadow-sm dark:border-slate-700">
          <TabsTrigger value="preference" className="h-10 rounded-xl px-4"><Palette />个性设置</TabsTrigger>
          <TabsTrigger value="notification" className="h-10 rounded-xl px-4"><Bell />通知设置</TabsTrigger>
          <TabsTrigger value="security" className="h-10 rounded-xl px-4"><ShieldCheck />安全设置</TabsTrigger>
          <TabsTrigger value="password" className="h-10 rounded-xl px-4"><Lock />修改密码</TabsTrigger>
        </TabsList></div>

        <TabsContent value="preference">
          <Card className="gap-0 rounded-[24px] border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,.05)] dark:border-slate-700">
            <CardHeader className="border-b border-slate-100 pb-5 dark:border-slate-700"><CardTitle className="text-lg">个性化设置</CardTitle><CardDescription>主题、语言、字号和登录首页均可点击选择；界面即时生效并自动同步到账号。</CardDescription></CardHeader>
            <CardContent className="space-y-8 px-5 pt-6 sm:px-7 lg:px-8">
              <SettingSection icon={MonitorCog} title="界面主题" description="选择适合当前工作环境的显示方式">
                <div className="grid gap-3 sm:grid-cols-3">
                  {themeOptions.map(option => <button type="button" key={option.value} aria-pressed={selectedTheme === option.value} onClick={() => updatePreferences({ theme: option.value })} className={`group rounded-2xl border p-3 text-left transition-all ${selectedTheme === option.value ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/15 dark:bg-blue-500/10" : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700"}`}>
                    <div className={`relative h-24 overflow-hidden rounded-xl border border-black/5 ${option.preview}`}><div className="absolute inset-x-3 top-3 h-2 rounded bg-blue-500/70" /><div className="absolute bottom-3 left-3 top-8 w-1/4 rounded bg-slate-400/20" /><div className="absolute bottom-3 left-[34%] right-3 top-8 rounded bg-white/50 shadow-sm" />{selectedTheme === option.value && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"><Check className="h-3.5 w-3.5" /></span>}</div>
                    <p className="mt-3 text-sm font-semibold text-foreground">{option.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                  </button>)}
                </div>
                {selectedTheme === "system" && <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground dark:border-slate-700"><MonitorCog className="h-4 w-4 text-blue-600" />已检测当前设备为<strong className="text-foreground">{resolvedTheme === "dark" ? "深色外观" : "浅色外观"}</strong>，设备主题变化时系统会自动跟随。</div>}
              </SettingSection>
              <Separator />
              <div className="grid gap-8 xl:grid-cols-2">
                <SettingSection icon={Languages} title="语言设置" description="切换后立即更新界面语言偏好">
                  <div className="flex flex-wrap gap-2">{([{"value":"zh-CN","label":"简体中文"},{"value":"en-US","label":"English"}] as const).map(option => <Button type="button" key={option.value} variant={preferences.language === option.value ? "default" : "outline"} onClick={() => updatePreferences({ language: option.value as InterfaceLanguage })} className="rounded-xl">{preferences.language === option.value && <Check className="h-4 w-4" />}{option.label}</Button>)}</div>
                </SettingSection>
                <SettingSection icon={TextCursorInput} title="字号选择" description="适配高密度办公或大字阅读场景">
                  <div className="grid grid-cols-3 gap-2">{([{"value":"small","label":"较小","sample":"Aa 14"},{"value":"standard","label":"标准","sample":"Aa 16"},{"value":"large","label":"较大","sample":"Aa 18"}] as const).map(option => <button type="button" key={option.value} onClick={() => updatePreferences({ fontSize: option.value as FontSizePreference })} className={`rounded-xl border px-3 py-3 text-left transition ${preferences.fontSize === option.value ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/10 dark:bg-blue-500/10 dark:text-blue-300" : "border-slate-200 hover:border-blue-300 dark:border-slate-700"}`}><span className="block text-sm font-semibold">{option.label}</span><span className="mt-1 block text-[10px] opacity-60">{option.sample}</span></button>)}</div>
                </SettingSection>
              </div>
              <Separator />
              <SettingSection icon={Home} title="首页偏好" description="登录成功后优先进入的业务空间">
                <RadioGroup value={preferences.homepage} onValueChange={value => updatePreferences({ homepage: value as HomePagePreference })} className="grid gap-3 md:grid-cols-3">
                  {homepageOptions.map(option => <Label key={option.value} htmlFor={`home-${option.value}`} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${preferences.homepage === option.value ? "border-blue-500 bg-blue-50/60 dark:bg-blue-500/10" : "border-slate-200 hover:border-blue-300 dark:border-slate-700"}`}><RadioGroupItem value={option.value} id={`home-${option.value}`} className="mt-0.5" /><span><span className="block text-sm font-semibold text-foreground">{option.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span></Label>)}
                </RadioGroup>
              </SettingSection>
              <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900 dark:bg-blue-950/30"><div><p className="text-xs font-medium leading-5 text-blue-900 dark:text-blue-100">选择后即时应用、自动保存，刷新页面不会丢失；同一账号在其他设备登录后会自动加载。</p><p className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-300/80">{syncStatus === "syncing" ? "正在同步到账号…" : syncStatus === "synced" ? "已同步到账号并写入配置审计" : syncStatus === "offline" ? "当前离线，设置已保存在本机，联网后自动同步" : syncStatus === "error" ? "同步暂未完成，可点击重新同步" : "当前使用本地偏好"}</p></div><Button variant="outline" disabled={syncStatus === "syncing"} onClick={() => void syncPreferences()} className="shrink-0 rounded-xl"><Save className="h-4 w-4" />{syncStatus === "syncing" ? "同步中..." : "立即同步"}</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification">
          <Card className="max-w-5xl rounded-[24px] border-slate-200/80 shadow-sm dark:border-slate-700"><CardHeader><CardTitle>通知策略</CardTitle><CardDescription>每项开关均会随账号保存；短信渠道在生产环境需要接入消息供应商。</CardDescription></CardHeader><CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">{notifications && <>
              <ToggleRow title="邮件通知" description="接收审批结果和重要业务提醒" checked={notifications.email} onChange={email => setSettings({ ...settings!, notifications: { ...notifications, email } })} />
              <ToggleRow title="短信通知" description="接收超时、资金异常等紧急提醒" checked={notifications.sms} onChange={sms => setSettings({ ...settings!, notifications: { ...notifications, sms } })} />
              <ToggleRow title="站内通知" description="在消息中心接收全部授权范围内通知" checked={notifications.inApp} onChange={inApp => setSettings({ ...settings!, notifications: { ...notifications, inApp } })} />
              <ToggleRow title="审批提醒" description="有新待办进入当前处理节点时提醒" checked={notifications.approvalReminder} onChange={approvalReminder => setSettings({ ...settings!, notifications: { ...notifications, approvalReminder } })} />
              <ToggleRow title="截止日期提醒" description="项目和申请即将截止时提前提醒" checked={notifications.deadlineReminder} onChange={deadlineReminder => setSettings({ ...settings!, notifications: { ...notifications, deadlineReminder } })} />
              <ToggleRow title="系统公告" description="接收政策、运维和版本变更公告" checked={notifications.systemAnnouncement} onChange={systemAnnouncement => setSettings({ ...settings!, notifications: { ...notifications, systemAnnouncement } })} />
            </>}</div>
            <Button disabled={!notifications || saving === "notification"} onClick={() => notifications && savePatch("notification", { notifications })} className="rounded-xl"><Save />{saving === "notification" ? "保存中..." : "保存通知设置"}</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <Card className="rounded-[24px] border-slate-200/80 dark:border-slate-700"><CardHeader><CardTitle>会话安全</CardTitle><CardDescription>关键配置变更会写入不可忽略的操作审计。</CardDescription></CardHeader><CardContent className="space-y-5">
              {security && <><ToggleRow title="异常登录提醒" description="检测到新设备或异常位置时发送安全提醒" checked={security.loginReminder} onChange={loginReminder => setSettings({ ...settings!, security: { ...security, loginReminder } })} />
              <div><Label className="text-sm font-semibold">无操作会话超时</Label><p className="mt-1 text-xs text-muted-foreground">超过设定时间将要求重新验证身份。</p><div className="mt-3 flex flex-wrap gap-2">{([15,30,60] as const).map(minutes => <Button key={minutes} variant={security.sessionTimeoutMinutes === minutes ? "default" : "outline"} onClick={() => setSettings({ ...settings!, security: { ...security, sessionTimeoutMinutes: minutes } })} className="rounded-xl">{minutes === 60 ? "1 小时" : `${minutes} 分钟`}</Button>)}</div></div>
              <Button disabled={saving === "security"} onClick={() => savePatch("security", { security })} className="rounded-xl"><Save />{saving === "security" ? "保存中..." : "保存安全设置"}</Button></>}
            </CardContent></Card>
            <Card className="rounded-[24px] border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-900 dark:from-blue-950/50 dark:to-card"><CardHeader><span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white"><Smartphone /></span><CardTitle>多因素认证 MFA</CardTitle><CardDescription>在密码之外增加第二重身份验证。</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between rounded-xl border bg-card p-3"><span className="text-sm">注册状态</span><Badge variant={security?.mfaStatus === "enabled" ? "default" : "secondary"}>{security?.mfaStatus === "enabled" ? "已启用" : "未启用"}</Badge></div><Button disabled={!security || security.mfaStatus === "enabled" || saving === "mfa"} onClick={enrollMfa} className="mt-4 w-full rounded-xl" variant={security?.mfaStatus === "enabled" ? "outline" : "default"}>{security?.mfaStatus === "enabled" ? "认证器已绑定" : saving === "mfa" ? "配置中..." : "开始配置 MFA"}</Button><p className="mt-3 text-[11px] leading-5 text-muted-foreground">当前为可审计演示注册。生产环境将通过统一身份平台完成二维码绑定和恢复码托管。</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="password">
          <Card className="max-w-2xl rounded-[24px] border-slate-200/80 dark:border-slate-700"><CardHeader><CardTitle>修改登录密码</CardTitle><CardDescription>密码只参与校验，不写入日志；修改后使用安全派生哈希保存在当前演示运行时。</CardDescription></CardHeader><CardContent className="space-y-5">
            <PasswordField id="current-password" label="当前密码" value={passwordForm.currentPassword} visible={showCurrentPassword} onVisible={() => setShowCurrentPassword(value => !value)} onChange={currentPassword => setPasswordForm({ ...passwordForm, currentPassword })} />
            <PasswordField id="new-password" label="新密码" value={passwordForm.newPassword} visible={showNewPassword} onVisible={() => setShowNewPassword(value => !value)} onChange={newPassword => setPasswordForm({ ...passwordForm, newPassword })} />
            <div className="space-y-2"><Label htmlFor="confirm-password">确认新密码</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={event => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></div>
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-muted-foreground dark:bg-slate-900">至少 10 位，并同时包含大写字母、小写字母、数字和特殊字符。</p>
            <Button disabled={saving === "password"} onClick={changePassword} className="w-full rounded-xl"><KeyRound />{saving === "password" ? "修改中..." : "确认修改密码"}</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingSection({ icon: Icon, title, description, children }: { icon: typeof Globe2; title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Icon className="h-4 w-4" /></span><div><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>{children}</section>;
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>;
}

function PasswordField({ id, label, value, visible, onVisible, onChange }: { id: string; label: string; value: string; visible: boolean; onVisible: () => void; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="relative"><Input id={id} type={visible ? "text" : "password"} autoComplete={id === "current-password" ? "current-password" : "new-password"} value={value} onChange={event => onChange(event.target.value)} className="pr-11" /><button type="button" onClick={onVisible} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={visible ? "隐藏密码" : "显示密码"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>;
}