"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { EnterprisePageHeader } from "@/components/enterprise/page-header";
import { MetricCard, SectionHeading, StatusPill } from "@/components/enterprise/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Row { record: { id: string; scenarioName: string; actorRole: string; operation: string; resourceType: string; resourceId: string; sensitiveLevel: string; geographicLevel: string; createdAt: string; decision: { status: string } }; dimension: { code: string; name: string; status: string; reason: string; evidence: string[]; policyRef: string } }
interface Payload { definition: { code: string; name: string; category: string; description: string; rules: string[]; policyRef: string }; summary: { total: number; allowed: number; denied: number; pending: number }; decisions: Row[] }
interface Envelope<T> { success: boolean; data?: T; error?: string }
const LABELS: Record<string, string> = { ALLOW: "允许", DENY: "拒绝", PENDING_APPROVAL: "待审批", ESCALATE: "升级处置" };
function headers(): HeadersInit { const token = localStorage.getItem("token"); return token ? { Authorization: `Bearer ${token}` } : {}; }
function tone(status: string): "healthy" | "danger" | "warning" { return status === "ALLOW" ? "healthy" : status === "DENY" ? "danger" : "warning"; }

export default function DimensionDetailPage() {
  const params = useParams<{ dimension: string }>(); const code = params.dimension;
  const [data, setData] = useState<Payload | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [status, setStatus] = useState("all");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const response = await fetch(`/api/access-control/dimensions/${encodeURIComponent(code)}`, { headers: headers(), cache: "no-store" }); const body = await response.json() as Envelope<Payload>; if (!response.ok || !body.success || !body.data) throw new Error(body.error ?? "维度详情加载失败"); setData(body.data); } catch (reason) { setError(reason instanceof Error ? reason.message : "维度详情加载失败"); } finally { setLoading(false); } }, [code]);
  useEffect(() => { void load(); }, [load]);
  const rows = data?.decisions.filter(item => status === "all" || item.dimension.status === status) ?? [];
  return <div className="space-y-6"><EnterprisePageHeader eyebrow="DIMENSION POLICY DETAIL" title={data?.definition.name ?? "权限维度详情"} description={data?.definition.description ?? "加载确定性策略、命中统计和决策证据。"} icon={ShieldCheck} badge={data ? `${data.definition.category} · ${data.definition.policyRef}` : "LOADING"} actions={[{ label: "刷新详情", icon: RefreshCw, variant: "outline", onClick: () => void load(), disabled: loading }]} />
    <Link href="/access-control"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />返回权限控制中心</Button></Link>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
    {loading && !data && <div className="flex min-h-[340px] items-center justify-center text-sm text-muted-foreground"><RefreshCw className="mr-2 h-5 w-5 animate-spin" />正在读取维度规则和命中证据…</div>}
    {data && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><button className="text-left" onClick={() => setStatus("all")}><MetricCard label="判定总数" value={data.summary.total.toString()} detail="本维度全部评估记录" icon={ShieldCheck} tone="blue" /></button><button className="text-left" onClick={() => setStatus("ALLOW")}><MetricCard label="允许" value={data.summary.allowed.toString()} detail="本维度条件满足" icon={CheckCircle2} tone="emerald" /></button><button className="text-left" onClick={() => setStatus("DENY")}><MetricCard label="拒绝" value={data.summary.denied.toString()} detail="点击筛选拒绝记录" icon={XCircle} tone="amber" /></button><button className="text-left" onClick={() => setStatus("PENDING_APPROVAL")}><MetricCard label="待审批" value={data.summary.pending.toString()} detail="条件待补充或会签" icon={Clock3} tone="cyan" /></button></div>
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.7fr]"><Card className="h-fit border-border shadow-sm"><CardHeader><SectionHeading title="生效策略规则" description="来自v2规范并由服务器确定性程序执行" /></CardHeader><CardContent className="space-y-3">{data.definition.rules.map((rule, index) => <div key={rule} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{index + 1}</span><p className="text-xs leading-5 text-foreground/80">{rule}</p></div>)}<div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">策略引用：{data.definition.policyRef}。前端不能修改判定结果，所有结果来自服务端权限引擎。</div></CardContent></Card>
        <Card className="overflow-hidden border-border shadow-sm"><CardHeader><SectionHeading title="本维度命中记录" description={`${rows.length} 条记录；每条均可下钻完整九维证据`} /></CardHeader><CardContent className="p-0">{rows.length ? <div className="divide-y divide-border">{rows.map(item => <div key={item.record.id} className="p-5 hover:bg-muted/25"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{item.record.scenarioName}</p><StatusPill status={tone(item.dimension.status)} label={LABELS[item.dimension.status]} /><Badge variant="outline">{item.record.actorRole}</Badge></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.dimension.reason}</p><div className="mt-2 flex flex-wrap gap-1.5">{item.dimension.evidence.map(evidence => <code key={evidence} className="rounded bg-muted px-2 py-1 text-[9px] text-muted-foreground">{evidence}</code>)}</div><p className="mt-2 font-mono text-[9px] text-muted-foreground">{item.record.operation} · {item.record.resourceType} · {item.record.resourceId}</p></div><Link href={`/access-control/decisions/${item.record.id}`}><Button variant="outline" size="sm">完整证据<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></Link></div></div>)}</div> : <div className="py-16 text-center text-sm text-muted-foreground">当前筛选条件下没有命中记录。</div>}</CardContent></Card></div>
    </>}
  </div>;
}
