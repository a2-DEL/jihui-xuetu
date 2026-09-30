"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Database, LockKeyhole, RefreshCw, Search, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { EnterprisePageHeader } from "@/components/enterprise/page-header";
import { MetricCard, SectionHeading, StatusPill } from "@/components/enterprise/dashboard";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgentItem { code: string; name: string; registered: true; lifecycle: string; permissionMode: string }
interface RoleItem {
  code: string; name: string; category: string; dataScope: string; dashboard: string; assistantName: string; permissions: string[]; userCount: number;
  governance: { responsibility: string; coreBusiness: string; dataPolicy: string; maxAiLevel: string; maxDataSensitivity: string; decisionBoundary: string; agentTeam: AgentItem[] };
}
interface RegistryPayload { version: string; generatedAt: string; model: string; roles: RoleItem[]; summary: { roles: number; teams: number; agents: number; activeDemoIdentities: number }; safeguards: string[] }
interface Envelope<T> { success: boolean; data?: T; error?: string }

const SCOPE_NAMES: Record<string, string> = { platform: "平台全域", school: "本校范围", department: "所属院系", class: "所带班级", self: "仅本人", assigned: "授权任务", "external-task": "外部委托任务" };
function authHeaders(): HeadersInit { const token = window.localStorage.getItem("token"); return token ? { Authorization: `Bearer ${token}` } : {}; }

export default function RoleRegistryPage() {
  const [data, setData] = useState<RegistryPayload | null>(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/roles/registry", { headers: authHeaders(), cache: "no-store" });
      const body = await response.json() as Envelope<RegistryPayload>;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error ?? "角色注册表加载失败");
      setData(body.data); setSelectedCode(current => current || body.data?.roles[0]?.code || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "角色注册表加载失败"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => data ? Array.from(new Set(data.roles.map(item => item.category))) : [], [data]);
  const roles = useMemo(() => {
    const term = keyword.trim().toLocaleLowerCase();
    return data?.roles.filter(item => (category === "all" || item.category === category) && (!term || `${item.code}${item.name}${item.category}${item.governance.responsibility}`.toLocaleLowerCase().includes(term))) ?? [];
  }, [category, data, keyword]);
  const selected = data?.roles.find(item => item.code === selectedCode) ?? roles[0] ?? null;

  return <div className="space-y-6">
    <EnterprisePageHeader eyebrow="ROLE & AGENT REGISTRY" title="17角色与Agent团队注册中心" description="角色、数据范围、字段敏感级别、AI风险上限、决策边界和专属Agent团队使用同一份后端注册表。当前页面只读，避免前端模拟角色与实际鉴权规则不一致。" icon={UserRoundCog} badge="17 ROLE · 68 AGENT" actions={[{ label: "刷新注册表", icon: RefreshCw, variant: "outline", onClick: () => void load(), disabled: loading }]} />

    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
    {loading && !data && <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground"><RefreshCw className="mr-2 h-5 w-5 animate-spin text-blue-600" />正在核验角色、权限与Agent注册关系…</div>}

    {data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="独立RBAC角色" value={data.summary.roles.toString()} detail="数据管理员为正式第17角色" icon={UsersRound} tone="blue" />
        <MetricCard label="角色Agent团队" value={data.summary.teams.toString()} detail="每个角色固定一支专属团队" icon={Bot} tone="cyan" />
        <MetricCard label="注册Agent总数" value={data.summary.agents.toString()} detail="17角色 × 4个专业Agent" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="演示身份覆盖" value={data.summary.activeDemoIdentities.toString()} detail="每个角色均有可验证登录身份" icon={ShieldCheck} tone="amber" />
      </div>

      <Card className="border-border shadow-sm"><CardContent className="p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-xl flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="检索角色编码、名称、职责或类别" className="pl-9" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full lg:w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部角色类别</SelectItem>{categories.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="mt-4 flex flex-wrap gap-2">{data.safeguards.map(item => <Badge key={item} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"><LockKeyhole className="mr-1 h-3 w-3" />{item}</Badge>)}</div></CardContent></Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.95fr]">
        <Card className="overflow-hidden border-border shadow-sm"><CardHeader><SectionHeading title="统一角色目录" description={`显示 ${roles.length} / ${data.roles.length} 个角色；点击角色查看生效边界`} /></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-y border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">角色</th><th className="px-4 py-3">类别</th><th className="px-4 py-3">数据范围</th><th className="px-4 py-3">AI / 数据</th><th className="px-5 py-3 text-right">团队</th></tr></thead><tbody>{roles.map(role => <tr key={role.code} onClick={() => setSelectedCode(role.code)} className={`cursor-pointer border-b border-border transition-colors last:border-0 ${selected?.code === role.code ? "bg-blue-50/70 dark:bg-blue-950/25" : "hover:bg-muted/40"}`}><td className="px-5 py-4"><p className="font-semibold text-foreground">{role.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{role.code}</p></td><td className="px-4 py-4 text-muted-foreground">{role.category}</td><td className="px-4 py-4"><Badge variant="outline">{SCOPE_NAMES[role.dataScope] ?? role.dataScope}</Badge></td><td className="px-4 py-4"><span className="font-semibold text-blue-700 dark:text-blue-300">{role.governance.maxAiLevel}</span><span className="mx-1.5 text-border">/</span><span className="font-semibold text-violet-700 dark:text-violet-300">{role.governance.maxDataSensitivity}</span></td><td className="px-5 py-4 text-right"><Link href={`/user-management/roles/${role.code}`} onClick={event=>event.stopPropagation()} className="inline-flex items-center font-semibold text-blue-700 hover:underline">{role.governance.agentTeam.length} Agent<ArrowRight className="ml-1 h-3.5 w-3.5"/></Link></td></tr>)}</tbody></table>{roles.length === 0 && <div className="py-14 text-center text-sm text-muted-foreground">没有符合条件的角色。</div>}</div></CardContent></Card>

        {selected && <Card className="h-fit border-border shadow-sm xl:sticky xl:top-24"><CardHeader className="border-b border-border bg-muted/25"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-bold text-foreground">{selected.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selected.code} · {selected.dashboard}</p></div><StatusPill status="healthy" label="已注册" /></div></CardHeader><CardContent className="space-y-5 p-5"><Detail label="岗位职责" text={selected.governance.responsibility} /><Detail label="核心业务" text={selected.governance.coreBusiness} /><Detail label="数据范围" text={selected.governance.dataPolicy} /><Detail label="确定性决策边界" text={selected.governance.decisionBoundary} danger />
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">生效权限点</p><div className="mt-2 flex flex-wrap gap-1.5">{selected.permissions.map(permission => <Badge key={permission} variant="secondary" className="font-mono text-[9px]">{permission}</Badge>)}</div></div>
          <div><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">专属Agent团队</p><Badge variant="outline">4 / 4 已注册</Badge></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{selected.governance.agentTeam.map(agent => <Link key={agent.code} href={`/user-management/roles/${selected.code}/agents/${agent.code}`} className="group rounded-xl border border-border bg-muted/20 p-3 transition hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-blue-600" /><p className="text-xs font-semibold text-foreground">{agent.name}</p><ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-blue-600"/></div><p className="mt-2 font-mono text-[9px] text-muted-foreground">{agent.code}</p><p className="mt-1 text-[9px] text-muted-foreground">查看权限公式与运行证据</p></Link>)}</div></div>
          <div className="grid grid-cols-2 gap-3"><Tiny label="演示身份" value={`${selected.userCount} 个`} icon={UsersRound} /><Tiny label="数据边界" value={SCOPE_NAMES[selected.dataScope] ?? selected.dataScope} icon={Database} /></div>
        </CardContent></Card>}
      </div>
      <p className="text-right text-[10px] text-muted-foreground">注册表 {data.version} · {new Date(data.generatedAt).toLocaleString("zh-CN")}</p>
    </>}
  </div>;
}

function Detail({ label, text, danger = false }: { label: string; text: string; danger?: boolean }) { return <div><p className={`text-[10px] font-semibold uppercase tracking-wider ${danger ? "text-rose-600 dark:text-rose-300" : "text-muted-foreground"}`}>{label}</p><p className="mt-1.5 text-xs leading-5 text-foreground/80">{text}</p></div>; }
function Tiny({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Database }) { return <div className="rounded-xl border border-border bg-muted/25 p-3"><Icon className="h-4 w-4 text-blue-600" /><p className="mt-2 text-xs font-semibold text-foreground">{value}</p><p className="mt-1 text-[9px] text-muted-foreground">{label}</p></div>; }



