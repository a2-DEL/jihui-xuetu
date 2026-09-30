"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowLeft, Bot, BrainCircuit, CircleDollarSign, Clock3, Database, FileStack, Gauge, RefreshCw, ShieldCheck, Sparkles, Users2, Workflow } from "lucide-react";
import type { ECharts, EChartsOption } from "echarts";

interface ScreenData {
  scope: { roleCode: string; roleName: string; dataScope: string; label: string; source: string };
  realtime: { totalApplications: number; todayApplications: number; pendingReview: number; overdue: number; totalAppliedAmount: number; totalApprovedAmount: number; activeUsers: number; highRisk: number };
  trend: Array<{ date: string; applications: number; approvals: number; rejections: number }>;
  weeklyApproval: Array<{ day: string; value: number }>;
  collegeDistribution: Array<{ name: string; value: number; color: string }>;
  typeDistribution: Array<{ name: string; value: number; color: string }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  finance: { batches: number; paidAmount: number; exceptionBatches: number; reconciliationRate: number };
  ai: { agents: { total: number; active: number; degraded: number; successRate: number; executions24h: number }; skills: { total: number; published: number; elite: number }; models: { configured: number; total: number; requests24h: number; tokens24h: number }; connectors: { healthy: number; total: number; calls24h: number }; guardrails: { active: number; hits24h: number }; evaluations: { latestAccuracy: number; blocked: number }; budget: { monthlyLimit: number; used: number } };
  risks: Array<{ level: "high" | "medium" | "low"; title: string; value: string; detail: string }>;
  activities: Array<{ id: string; type: string; actor: string; action: string; time: string }>;
  insights: string[];
  generatedAt: string;
}

const chartText = "#91a4be";
const chartGrid = "rgba(148,163,184,.12)";

export default function DataScreen() {
  const [data, setData] = useState<ScreenData | null>(null);
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/statistics/screen", { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
      const payload = await response.json() as { success?: boolean; data?: ScreenData; error?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "大屏数据加载失败");
      setData(payload.data); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "数据加载失败"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    const refreshTimer = window.setInterval(() => fetchData(true), 30000);
    return () => { window.clearInterval(clockTimer); window.clearInterval(refreshTimer); };
  }, [fetchData]);

  if (loading) return <ScreenLoading />;
  if (!data) return <ScreenError message={error} onRetry={() => fetchData()} />;

  return <main className="data-visualization-screen relative min-h-screen overflow-hidden bg-[#06111f] text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(14,116,244,.24),transparent_40%),radial-gradient(circle_at_90%_70%,rgba(6,182,212,.08),transparent_35%)]" />
    <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(125,211,252,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.7)_1px,transparent_1px)] [background-size:42px_42px]" />
    <div className="relative mx-auto max-w-[1920px] p-3 sm:p-4 xl:p-5">
      <header className="flex flex-col gap-4 border-b border-cyan-400/15 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard/overview" prefetch className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.05] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200" aria-label="返回工作台"><ArrowLeft className="h-4 w-4" /></Link>
          <span className="hidden h-11 w-px bg-white/10 sm:block" />
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-semibold tracking-[.22em] text-cyan-400">SMART FUNDING COMMAND CENTER</span><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] text-emerald-300">授权模拟数据</span></div><h1 className="mt-1 truncate text-lg font-semibold tracking-wide sm:text-xl">冀慧学途 · 校园资助数智化协同指挥中心</h1><p className="mt-1 truncate text-[10px] text-slate-500">{data.scope.label} · 数据按岗位权限实时裁剪</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <StatusPill label="业务链路" value="正常" tone="green" />
          <StatusPill label="AI 护栏" value={`${data.ai.guardrails.active} 条启用`} tone="cyan" />
          <div className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-right"><p className="font-mono text-sm font-semibold text-cyan-100 sm:text-base">{clock.toLocaleTimeString("zh-CN", { hour12: false })}</p><p className="text-[9px] text-slate-500">{clock.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })}</p></div>
          <button type="button" onClick={() => fetchData()} disabled={refreshing} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50" aria-label="刷新数据"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /></button>
        </div>
      </header>

      {error && <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">后台刷新未完成：{error}，当前继续展示最近一次有效快照。</div>}

      <section className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={FileStack} label="授权申请总量" value={formatNumber(data.realtime.totalApplications)} meta={`今日模拟流入 ${data.realtime.todayApplications}`} tone="blue" />
        <MetricCard icon={Workflow} label="流程处理中" value={formatNumber(data.realtime.pendingReview)} meta={`${data.realtime.overdue} 项超时`} tone={data.realtime.overdue ? "amber" : "green"} />
        <MetricCard icon={CircleDollarSign} label="申请金额" value={formatCurrency(data.realtime.totalAppliedAmount)} meta={`已回盘 ${formatCurrency(data.realtime.totalApprovedAmount)}`} tone="cyan" />
        <MetricCard icon={AlertTriangle} label="高风险待核" value={formatNumber(data.realtime.highRisk)} meta="只提示，不代替人工结论" tone={data.realtime.highRisk ? "rose" : "green"} />
        <MetricCard icon={Bot} label="Agent 执行 / 24h" value={formatNumber(data.ai.agents.executions24h)} meta={`成功率 ${data.ai.agents.successRate}%`} tone="violet" />
        <MetricCard icon={ShieldCheck} label="护栏命中 / 24h" value={formatNumber(data.ai.guardrails.hits24h)} meta={`${data.ai.agents.degraded} 个 Agent 降级`} tone="green" />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-7" title="资助申请与审批趋势" subtitle="近 14 日 · 授权范围确定性模拟基线" icon={Activity}>
          <TrendChart data={data.trend} />
        </Panel>
        <Panel className="xl:col-span-3" title="项目结构" subtitle="按资助类型聚合" icon={Database}>
          <DonutChart data={data.typeDistribution} />
        </Panel>
        <Panel className="xl:col-span-2" title="AI 运行矩阵" subtitle="模型、Skill、MCP" icon={BrainCircuit}>
          <div className="grid grid-cols-2 gap-2 pt-2 xl:grid-cols-1">
            <MiniGauge label="Agent 在线" value={data.ai.agents.active} total={data.ai.agents.total} color="#38bdf8" />
            <MiniGauge label="Skill 已发布" value={data.ai.skills.published} total={data.ai.skills.total} color="#a78bfa" />
            <MiniGauge label="模型已配置" value={data.ai.models.configured} total={data.ai.models.total} color="#34d399" />
            <MiniGauge label="MCP 健康" value={data.ai.connectors.healthy} total={data.ai.connectors.total} color="#22d3ee" />
          </div>
        </Panel>
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-3" title="院系分布" subtitle="数据范围已按组织权限裁剪" icon={Users2}><DonutChart data={data.collegeDistribution} /></Panel>
        <Panel className="xl:col-span-4" title="本周审核吞吐" subtitle="按日汇总的人工审批完成量" icon={Gauge}><BarChart data={data.weeklyApproval} /></Panel>
        <Panel className="xl:col-span-5" title="流程状态与资金执行" subtitle="申请状态、批次回盘和对账闭环" icon={CircleDollarSign}>
          <div className="grid min-h-[240px] gap-4 sm:grid-cols-[1.15fr_.85fr]"><StatusBars data={data.statusDistribution} /><div className="grid grid-cols-2 gap-2 self-center"><CompactMetric label="发放批次" value={`${data.finance.batches}`} /><CompactMetric label="异常批次" value={`${data.finance.exceptionBatches}`} alert={data.finance.exceptionBatches > 0} /><CompactMetric label="对账完成率" value={`${data.finance.reconciliationRate}%`} /><CompactMetric label="已发放金额" value={formatCurrency(data.finance.paidAmount)} /></div></div>
        </Panel>
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-4" title="AI 风险洞察" subtitle="建议必须经岗位人员确认后处理" icon={Sparkles}>
          <div className="space-y-2.5">{data.insights.map((insight, index) => <div key={insight} className="flex gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[.035] p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-[10px] font-bold text-cyan-300">{index + 1}</span><p className="text-[11px] leading-5 text-slate-300">{insight}</p></div>)}</div>
        </Panel>
        <Panel className="xl:col-span-4" title="风险与整改雷达" subtitle="业务、监督、资金与 AI 联合监测" icon={AlertTriangle}>
          <div className="grid gap-2 sm:grid-cols-2">{data.risks.map(item => <RiskCard key={item.title} {...item} />)}</div>
        </Panel>
        <Panel className="xl:col-span-4" title="可审计活动流" subtitle="最近授权范围内的业务与 AI 证据" icon={Clock3}>
          <div className="max-h-[248px] space-y-1 overflow-y-auto pr-1">{data.activities.length ? data.activities.map(item => <div key={item.id} className="flex gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[.035]"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.type === "blocked" ? "bg-rose-400" : item.type === "ai" ? "bg-violet-400" : "bg-cyan-400"}`} /><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[10px] font-semibold text-slate-300">{item.actor}</span><span className="text-[9px] text-slate-600">{formatTime(item.time)}</span></div><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{item.action}</p></div></div>) : <p className="py-12 text-center text-xs text-slate-600">当前岗位暂无可见审计活动</p>}</div>
        </Panel>
      </section>
      <footer className="mt-3 flex flex-col gap-1 border-t border-white/5 py-3 text-[9px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>数据来源：业务内存适配器、AI 治理运行时、权限裁剪层 · 模拟数据不用于真实决策</span><span>最近刷新 {new Date(data.generatedAt).toLocaleString("zh-CN")}</span></footer>
    </div>
  </main>;
}

function Panel({ title, subtitle, icon: Icon, className = "", children }: { title: string; subtitle: string; icon: typeof Activity; className?: string; children: React.ReactNode }) {
  return <section className={`rounded-2xl border border-cyan-300/10 bg-[#0a192a]/85 p-4 shadow-[inset_0_1px_rgba(255,255,255,.025),0_14px_44px_rgba(0,0,0,.15)] backdrop-blur ${className}`}><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon className="h-4 w-4" /></span><div><h2 className="text-xs font-semibold tracking-wide text-slate-100">{title}</h2><p className="mt-0.5 text-[9px] text-slate-600">{subtitle}</p></div></div><div className="mt-3">{children}</div></section>;
}

function MetricCard({ icon: Icon, label, value, meta, tone }: { icon: typeof Activity; label: string; value: string; meta: string; tone: "blue" | "cyan" | "amber" | "rose" | "violet" | "green" }) {
  const colors = { blue: "from-blue-500/20 text-blue-300", cyan: "from-cyan-500/20 text-cyan-300", amber: "from-amber-500/20 text-amber-300", rose: "from-rose-500/20 text-rose-300", violet: "from-violet-500/20 text-violet-300", green: "from-emerald-500/20 text-emerald-300" };
  return <article className="relative overflow-hidden rounded-2xl border border-white/[.07] bg-[#0b1b2e]/90 p-3.5"><div className={`pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r ${colors[tone]} to-transparent opacity-25`} /><div className="relative flex items-start justify-between gap-2"><div><p className="text-[9px] tracking-wide text-slate-500">{label}</p><p className="mt-2 font-mono text-xl font-semibold tracking-tight text-white 2xl:text-2xl">{value}</p><p className="mt-1.5 truncate text-[9px] text-slate-500">{meta}</p></div><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors[tone]}`}><Icon className="h-4 w-4" /></span></div></article>;
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: "green" | "cyan" }) { return <div className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] sm:flex ${tone === "green" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"}`}><span className={`h-1.5 w-1.5 animate-pulse rounded-full ${tone === "green" ? "bg-emerald-400" : "bg-cyan-400"}`} />{label} · {value}</div>; }
function MiniGauge({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percent = total ? Math.round(value / total * 100) : 0; return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-500">{label}</span><span className="font-mono text-xs text-slate-200">{value}/{total}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} /></div></div>; }
function CompactMetric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) { return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-slate-600">{label}</p><p className={`mt-1.5 font-mono text-sm font-semibold ${alert ? "text-rose-300" : "text-slate-200"}`}>{value}</p></div>; }
function RiskCard({ level, title, value, detail }: ScreenData["risks"][number]) { const colors = { high: "border-rose-400/15 bg-rose-400/[.05] text-rose-300", medium: "border-amber-400/15 bg-amber-400/[.05] text-amber-300", low: "border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300" }; return <div className={`rounded-xl border p-3 ${colors[level]}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold">{title}</span><span className="font-mono text-[10px]">{value}</span></div><p className="mt-2 text-[9px] leading-4 text-slate-500">{detail}</p></div>; }

function TrendChart({ data }: { data: ScreenData["trend"] }) {
  const option = useMemo<EChartsOption>(() => ({ animationDuration: 500, tooltip: { trigger: "axis", backgroundColor: "rgba(5,15,28,.96)", borderColor: "rgba(56,189,248,.2)", textStyle: { color: "#dbeafe", fontSize: 10 } }, legend: { top: 0, right: 4, textStyle: { color: chartText, fontSize: 9 }, itemWidth: 12, itemHeight: 6 }, grid: { left: 38, right: 14, top: 36, bottom: 26 }, xAxis: { type: "category", boundaryGap: false, data: data.map(item => item.date.slice(5)), axisLine: { lineStyle: { color: chartGrid } }, axisTick: { show: false }, axisLabel: { color: chartText, fontSize: 9 } }, yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: chartText, fontSize: 9 }, splitLine: { lineStyle: { color: chartGrid } } }, series: [{ name: "申请", type: "line", smooth: true, symbol: "none", data: data.map(item => item.applications), lineStyle: { width: 2, color: "#38bdf8" }, areaStyle: { color: "rgba(56,189,248,.12)" } }, { name: "审批通过", type: "line", smooth: true, symbol: "none", data: data.map(item => item.approvals), lineStyle: { width: 2, color: "#34d399" } }, { name: "驳回", type: "line", smooth: true, symbol: "none", data: data.map(item => item.rejections), lineStyle: { width: 1.5, color: "#fb7185" } }] }), [data]);
  return <EChart option={option} className="h-[260px]" />;
}
function DonutChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const option = useMemo<EChartsOption>(() => ({ tooltip: { trigger: "item", backgroundColor: "rgba(5,15,28,.96)", borderColor: "rgba(56,189,248,.2)", textStyle: { color: "#dbeafe", fontSize: 10 } }, legend: { bottom: 0, left: "center", textStyle: { color: chartText, fontSize: 8 }, itemWidth: 8, itemHeight: 6 }, series: [{ type: "pie", radius: ["46%", "70%"], center: ["50%", "43%"], avoidLabelOverlap: true, itemStyle: { borderColor: "#0a192a", borderWidth: 2, borderRadius: 4 }, label: { show: false }, data: data.map(item => ({ name: item.name, value: item.value, itemStyle: { color: item.color } })) }] }), [data]);
  return data.length ? <EChart option={option} className="h-[240px]" /> : <EmptyChart />;
}
function BarChart({ data }: { data: ScreenData["weeklyApproval"] }) {
  const option = useMemo<EChartsOption>(() => ({ tooltip: { trigger: "axis", backgroundColor: "rgba(5,15,28,.96)", borderColor: "rgba(56,189,248,.2)", textStyle: { color: "#dbeafe", fontSize: 10 } }, grid: { left: 34, right: 10, top: 10, bottom: 24 }, xAxis: { type: "category", data: data.map(item => item.day), axisLine: { lineStyle: { color: chartGrid } }, axisTick: { show: false }, axisLabel: { color: chartText, fontSize: 9 } }, yAxis: { type: "value", splitLine: { lineStyle: { color: chartGrid } }, axisLabel: { color: chartText, fontSize: 9 } }, series: [{ type: "bar", data: data.map(item => item.value), barMaxWidth: 24, itemStyle: { borderRadius: [5, 5, 0, 0], color: "#38bdf8" } }] }), [data]);
  return <EChart option={option} className="h-[240px]" />;
}
function StatusBars({ data }: { data: ScreenData["statusDistribution"] }) { const max = Math.max(1, ...data.map(item => item.value)); return <div className="space-y-2 self-center">{data.slice(0, 7).map(item => <div key={item.name}><div className="flex items-center justify-between text-[9px]"><span className="truncate text-slate-500">{item.name}</span><span className="font-mono text-slate-300">{item.value}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${Math.max(8, item.value / max * 100)}%`, backgroundColor: item.color }} /></div></div>)}</div>; }
function EChart({ option, className }: { option: EChartsOption; className: string }) { const nodeRef = useRef<HTMLDivElement>(null); const instanceRef = useRef<ECharts | null>(null); const [ready, setReady] = useState(false); useEffect(() => { let cancelled = false; let observer: ResizeObserver | null = null; import("echarts").then(echarts => { if (cancelled || !nodeRef.current) return; const instance = echarts.init(nodeRef.current, undefined, { renderer: "canvas" }); instanceRef.current = instance; observer = new ResizeObserver(() => instance.resize()); observer.observe(nodeRef.current); setReady(true); }); return () => { cancelled = true; observer?.disconnect(); instanceRef.current?.dispose(); instanceRef.current = null; }; }, []); useEffect(() => { if (ready) instanceRef.current?.setOption(option, { notMerge: true }); }, [option, ready]); return <div ref={nodeRef} className={className} />; }
function EmptyChart() { return <div className="flex h-[240px] items-center justify-center text-xs text-slate-600">当前授权范围暂无分布数据</div>; }
function ScreenLoading() { return <div className="data-visualization-screen flex min-h-screen items-center justify-center bg-[#06111f] text-cyan-300"><div className="text-center"><RefreshCw className="mx-auto h-8 w-8 animate-spin" /><p className="mt-3 text-xs text-slate-500">正在装载授权数据与可视化引擎...</p></div></div>; }
function ScreenError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="data-visualization-screen flex min-h-screen items-center justify-center bg-[#06111f] p-5 text-white"><div className="max-w-md rounded-2xl border border-rose-400/20 bg-rose-400/[.06] p-6 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-rose-300" /><h1 className="mt-3 text-lg font-semibold">大屏数据暂不可用</h1><p className="mt-2 text-xs leading-5 text-slate-400">{message}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950">重新加载</button></div></div>; }
function formatNumber(value: number) { return value.toLocaleString("zh-CN"); }
function formatCurrency(value: number) { if (Math.abs(value) >= 10000) return `¥${(value / 10000).toFixed(1)}万`; return `¥${value.toLocaleString("zh-CN")}`; }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }