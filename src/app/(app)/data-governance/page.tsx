"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArchiveRestore, ArrowRight, Bot, CheckCircle2, Database, FileWarning, RefreshCw, ShieldCheck, TableProperties } from "lucide-react";
import { EnterprisePageHeader } from "@/components/enterprise/page-header";
import { MetricCard, SectionHeading, StatusPill } from "@/components/enterprise/dashboard";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHashTab } from "@/hooks/use-hash-tab";

interface QualityIssue { id: string; objectRef: string; type: string; severity: "high" | "medium"; value: string; status: string }
interface AgentItem { code: string; name: string; lifecycle: string; permissionMode: string; health: string; lastCheck: string; operationMode: string }
interface GovernancePayload {
  generatedAt: string;
  roleBoundary: { responsibility: string; dataPolicy: string; decisionBoundary: string; aiLevel: string; sensitivity: string };
  quality: { score: number; recordsScanned: number; averageCompleteness: number; issueTotal: number; incomplete: number; duplicateGroups: number; missingOrganization: number; issues: QualityIssue[] };
  security: { auditEvents: number; auditIntegrityRate: number; maskingPolicyCoverage: number; pendingDataRightRequests: number; highRiskDataRightRequests: number; secretExposure: number; deterministicGuardrail: boolean };
  standards: { coverage: number; catalog: Array<{ code: string; name: string; coverage: number; status: string }> };
  backup: { adapter: string; persistent: boolean; productionReady: boolean; currentState: string; targetRpo: string; targetRto: string; lastVerifiedRecovery: string | null; blockers: string[] };
  agentTeam: AgentItem[];
}
interface Envelope<T> { success: boolean; data?: T; error?: string }

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DataGovernancePage() {
  const [tab, setTab] = useHashTab(["quality", "security", "backup", "agents"] as const, "quality");
  const [data, setData] = useState<GovernancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/data-governance", { headers: authHeaders(), cache: "no-store" });
      const body = await response.json() as Envelope<GovernancePayload>;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error ?? "数据治理状态加载失败");
      setData(body.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "数据治理状态加载失败");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <div className="space-y-6">
    <EnterprisePageHeader eyebrow="DATA GOVERNANCE CONTROL PLANE" title="数据治理与可信数据控制中心" description="第17个独立角色工作台。基于当前业务数据执行质量扫描、安全审计、标准覆盖核验与灾备就绪检查；仅治理数据，不参与资助认定、审批或资金决策。" icon={Database} badge="DATA_ADMIN · L4 · 平台治理范围" actions={[{ label: "重新扫描", icon: RefreshCw, variant: "outline", onClick: () => void load(), disabled: loading }]} />

    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
    {loading && !data && <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground"><RefreshCw className="mr-2 h-5 w-5 animate-spin text-blue-600" />正在扫描真实业务数据与治理状态…</div>}

    {data && <>
      <Card className="border-blue-200 bg-blue-50/60 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/20"><CardContent className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_1fr]"><Boundary label="岗位职责" text={data.roleBoundary.responsibility} /><Boundary label="数据边界" text={data.roleBoundary.dataPolicy} /><Boundary label="决策禁区" text={data.roleBoundary.decisionBoundary} danger /></CardContent></Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button className="text-left" onClick={()=>setTab("quality")}><MetricCard label="数据质量评分" value={`${data.quality.score}%`} detail={`${data.quality.recordsScanned} 条业务记录实时扫描`} icon={CheckCircle2} tone={data.quality.score >= 98 ? "emerald" : "amber"} /></button>
        <button className="text-left" onClick={()=>setTab("quality")}><MetricCard label="待治理问题" value={data.quality.issueTotal.toString()} detail={`材料 ${data.quality.incomplete} · 重复组 ${data.quality.duplicateGroups}`} icon={FileWarning} tone={data.quality.issueTotal ? "amber" : "emerald"} /></button>
        <button className="text-left" onClick={()=>setTab("security")}><MetricCard label="审计证据完整率" value={`${data.security.auditIntegrityRate}%`} detail={`${data.security.auditEvents} 条可追溯审计事件`} icon={ShieldCheck} tone="blue" /></button>
        <button className="text-left" onClick={()=>setTab("quality")}><MetricCard label="标准覆盖率" value={`${data.standards.coverage}%`} detail={`${data.standards.catalog.length} 套有效数据标准`} icon={TableProperties} tone="cyan" /></button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="h-auto flex-wrap rounded-xl border border-border bg-card p-1 shadow-sm"><TabsTrigger value="quality">质量与标准</TabsTrigger><TabsTrigger value="security">安全与权利</TabsTrigger><TabsTrigger value="backup">备份恢复</TabsTrigger><TabsTrigger value="agents">专属Agent团队</TabsTrigger></TabsList>

        <TabsContent value="quality" className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Card className="border-border shadow-sm"><CardHeader><SectionHeading title="数据质量问题队列" description="扫描结果只展示业务对象引用，不暴露学生姓名、证件号和银行卡号" /></CardHeader><CardContent className="p-0">
            {data.quality.issues.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-y border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">问题编号</th><th className="px-4 py-3">对象引用</th><th className="px-4 py-3">问题类型</th><th className="px-4 py-3">检测值</th><th className="px-5 py-3">级别</th></tr></thead><tbody>{data.quality.issues.map(issue => <tr key={issue.id} className="border-b border-border last:border-0"><td className="px-5 py-4"><Link href={`/data-governance/issues/${issue.id}`} className="inline-flex items-center font-mono text-[11px] font-semibold text-blue-700 hover:underline">{issue.id}<ArrowRight className="ml-1 h-3.5 w-3.5"/></Link></td><td className="px-4 py-4 font-medium text-foreground">{issue.objectRef}</td><td className="px-4 py-4 text-muted-foreground">{issue.type}</td><td className="px-4 py-4 text-muted-foreground">{issue.value}</td><td className="px-5 py-4"><StatusPill status={issue.severity === "high" ? "danger" : "warning"} label={issue.severity === "high" ? "高" : "中"} /></td></tr>)}</tbody></table></div> : <div className="py-16 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />当前扫描未发现数据质量问题</div>}
          </CardContent></Card>
          <Card className="border-border shadow-sm"><CardHeader><SectionHeading title="数据标准目录" description="标准覆盖从当前有效目录实时汇总" /></CardHeader><CardContent className="space-y-3">{data.standards.catalog.map(item => <div key={item.code} className="rounded-xl border border-border bg-muted/25 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">{item.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{item.code}</p></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">有效</Badge></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.coverage}%` }} /></div><p className="mt-2 text-right text-[10px] text-muted-foreground">覆盖 {item.coverage}%</p></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="security" className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <SecurityItem icon={ShieldCheck} title="确定性安全护栏" value={data.security.deterministicGuardrail ? "已启用" : "未启用"} detail="敏感字段与高风险操作由程序规则校验，不交给模型自行判断" good={data.security.deterministicGuardrail} />
          <SecurityItem icon={Activity} title="字段脱敏策略覆盖" value={`${data.security.maskingPolicyCoverage}%`} detail="治理结果仅保留对象引用，不下发学生个人敏感明细" good={data.security.maskingPolicyCoverage === 100} />
          <SecurityItem icon={Database} title="敏感密钥暴露" value={data.security.secretExposure.toString()} detail="页面与API不返回数据库连接串、模型密钥和凭据" good={data.security.secretExposure === 0} />
          <SecurityItem icon={FileWarning} title="待处理数据权利请求" value={data.security.pendingDataRightRequests.toString()} detail={`其中 L5 高风险请求 ${data.security.highRiskDataRightRequests} 条，必须审批`} good={data.security.pendingDataRightRequests === 0} />
          <SecurityItem icon={Activity} title="可追溯审计事件" value={data.security.auditEvents.toString()} detail="业务动作、AI动作与治理操作统一进入证据链" good={data.security.auditEvents > 0} />
          <SecurityItem icon={ShieldCheck} title="审计证据完整率" value={`${data.security.auditIntegrityRate}%`} detail="基于审计主体、动作、时间、结果和证据摘要完整性动态计算" good={data.security.auditIntegrityRate >= 98} />
        </TabsContent>

        <TabsContent value="backup" className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Card className="border-amber-200 bg-amber-50/45 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20"><CardHeader><SectionHeading title="当前持久化与灾备状态" description="不伪造生产就绪结果：开发适配器尚不能替代企业级数据库与异地灾备" /></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-card p-4 dark:border-amber-900"><ArchiveRestore className="mt-0.5 h-5 w-5 text-amber-600" /><div><p className="font-semibold text-foreground">{data.backup.persistent ? "已启用持久化" : "尚未启用生产持久化"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{data.backup.currentState}</p><p className="mt-2 font-mono text-[10px] text-muted-foreground">adapter: {data.backup.adapter}</p></div></div><div className="grid grid-cols-2 gap-3"><MiniMetric label="目标 RPO" value={data.backup.targetRpo} /><MiniMetric label="目标 RTO" value={data.backup.targetRto} /></div></CardContent></Card>
          <Card className="border-border shadow-sm"><CardHeader><SectionHeading title="生产落地阻断项" description="完成后才能执行真实备份与恢复演练验收" /></CardHeader><CardContent className="space-y-3">{data.backup.blockers.map((item, index) => <div key={item} className="flex items-start gap-3 rounded-xl border border-border p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">{index + 1}</span><p className="text-xs leading-5 text-muted-foreground">{item}</p></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="agents" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.agentTeam.map((agent, index) => <Link key={agent.code} href={`/user-management/roles/DATA_ADMIN/agents/${agent.code}`} className="group block"><Card className="h-full border-border shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-blue-300 group-hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Bot className="h-5 w-5" /></span><StatusPill status="healthy" label="已注册" /></div><p className="mt-5 text-sm font-semibold text-foreground">{agent.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{agent.code}</p><div className="mt-4 space-y-2 border-t border-border pt-4 text-[11px] text-muted-foreground"><p>权限：角色权限与工具权限取交集</p><p>模式：{agent.operationMode === "approval-required" ? "敏感操作需审批" : "只读分析"}</p><p>最近检查：{new Date(agent.lastCheck).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p></div><div className="mt-4 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-blue-500" style={{ width: `${88 + index * 3}%` }} /></div><p className="mt-3 flex items-center justify-end text-[10px] font-medium text-blue-700">运行详情<ArrowRight className="ml-1 h-3.5 w-3.5"/></p></CardContent></Card></Link>)}</TabsContent>
      </Tabs>

      <p className="text-right text-[10px] text-muted-foreground">最后扫描：{new Date(data.generatedAt).toLocaleString("zh-CN")}</p>
    </>}
  </div>;
}

function Boundary({ label, text, danger = false }: { label: string; text: string; danger?: boolean }) { return <div><p className={`text-[10px] font-semibold uppercase tracking-wider ${danger ? "text-rose-600 dark:text-rose-300" : "text-blue-700 dark:text-blue-300"}`}>{label}</p><p className="mt-2 text-xs leading-5 text-foreground/80">{text}</p></div>; }
function SecurityItem({ icon: Icon, title, value, detail, good }: { icon: typeof ShieldCheck; title: string; value: string; detail: string; good: boolean }) { return <Card className="border-border shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><span className={`rounded-xl p-3 ${good ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}><Icon className="h-5 w-5" /></span><span className="text-2xl font-bold text-foreground">{value}</span></div><p className="mt-4 text-sm font-semibold text-foreground">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></CardContent></Card>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-lg font-bold text-foreground">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div>; }




