"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Bot, CheckCircle2, ChevronRight, CircleDashed, Layers3, RefreshCw, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeatureItem { row: number; level1: string; level2: string; level3: string; scope: string; ai: string; status: DeliveryStatus; route: string }
interface FeatureGroup { name: string; status: DeliveryStatus; route: string; items: FeatureItem[] }
type DeliveryStatus = "available" | "deepening" | "planned";
interface WorkbenchPayload {
  role: { code: string; name: string; category: string; dataScope: string; dashboard: string; permissions: string[]; capabilities: string[] };
  summary: { groups: number; functions: number; available: number; deepening: number; planned: number };
  groups: FeatureGroup[];
  context: {
    governance: { responsibility: string; dataPolicy: string; decisionBoundary: string; maxAiLevel: string; maxDataSensitivity: string; agentTeam: Array<{ code: string; name: string; lifecycle: string; permissionMode: string }> };
    effectiveScope: { type: string; campusIds: string[]; departmentIds: string[]; classIds: string[]; assignedTaskIds: string[]; ownerId: string | null };
    registry: { roleCount: number; teamCount: number; agentCount: number; version: string };
  };
  baseline: { name: string; policy: string };
}
interface Envelope<T> { success: boolean; data?: T; error?: string }

const STATUS_META: Record<DeliveryStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  available: { label: "已接入可用", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  deepening: { label: "深化开发中", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Wrench },
  planned: { label: "规划排期", className: "border-slate-200 bg-slate-50 text-slate-600", icon: CircleDashed },
};

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function RoleWorkbenchPage() {
  const [payload, setPayload] = useState<WorkbenchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/roles/functions", { headers: authHeaders(), cache: "no-store" });
      const body = await response.json() as Envelope<WorkbenchPayload>;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error ?? "岗位功能基线加载失败");
      setPayload(body.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "岗位功能基线加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const moduleName = new URLSearchParams(window.location.search).get("module");
    if (moduleName) setKeyword(moduleName);
    void load();
  }, [load]);

  const filteredGroups = useMemo(() => {
    if (!payload) return [];
    const term = keyword.trim().toLocaleLowerCase();
    return payload.groups.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const matchesText = !term || `${group.name}${item.level2}${item.level3}${item.ai}${item.scope}`.toLocaleLowerCase().includes(term);
        return matchesText && (status === "all" || item.status === status);
      }),
    })).filter((group) => group.items.length > 0);
  }, [keyword, payload, status]);

  const completion = payload?.summary.functions ? Math.round((payload.summary.available / payload.summary.functions) * 100) : 0;

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-5 w-5 animate-spin text-blue-600" />正在核对角色功能规划表 v6…</div>;

  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-xl">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="border-white/20 bg-white/10 text-white">{payload?.baseline.name ?? "岗位功能基线"}</Badge><Badge className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100">权限驱动 · 数据隔离</Badge></div>
          <h1 className="text-2xl font-bold tracking-tight">{payload?.role.name ?? "岗位"} · 功能全景工作台</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">完整呈现规划表中的一级板块与子功能，并明确区分已落地、深化中和规划排期，避免“有菜单、无能力”。</p>
        </div>
        {payload && <div className="grid grid-cols-3 gap-3 text-center"><HeaderMetric value={payload.summary.groups} label="功能板块" /><HeaderMetric value={payload.summary.functions} label="子功能" /><HeaderMetric value={`${completion}%`} label="已接入" /></div>}
      </div>
    </div>

    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

    {payload && <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Layers3} label="规划子功能" value={payload.summary.functions} detail={`${payload.summary.groups} 个一级板块`} tone="slate" />
        <SummaryCard icon={CheckCircle2} label="已接入可用" value={payload.summary.available} detail="已有真实页面或受控流程" tone="emerald" />
        <SummaryCard icon={Wrench} label="深化开发中" value={payload.summary.deepening} detail="本阶段持续落地" tone="blue" />
        <SummaryCard icon={CircleDashed} label="规划排期" value={payload.summary.planned} detail="不会伪装成已完成" tone="amber" />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
            <div><div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><Bot className="h-5 w-5" /></span><div><p className="font-semibold text-foreground">专属Agent团队</p><p className="mt-1 text-xs text-muted-foreground">4个Agent已注册，权限始终取角色与工具权限交集</p></div></div><p className="mt-4 text-xs leading-5 text-muted-foreground">{payload.context.governance.responsibility}</p><div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-5 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">边界：{payload.context.governance.decisionBoundary}</div></div>
            <div className="grid gap-2 sm:grid-cols-2">{payload.context.governance.agentTeam.map(agent => <div key={agent.code} className="rounded-xl border border-border bg-muted/20 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-foreground">{agent.name}</p><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">已注册</Badge></div><p className="mt-2 font-mono text-[9px] text-muted-foreground">{agent.code}</p></div>)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><ShieldCheck className="h-5 w-5" /></span><div><p className="font-semibold text-slate-900">{payload.role.category}</p><p className="mt-1 text-xs text-slate-500">数据范围：{payload.role.dataScope} · 权限点 {payload.role.permissions.length} 个{payload.role.capabilities.length ? ` · 叠加能力包 ${payload.role.capabilities.join("、")}` : ""}</p></div></div>
            <div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="检索板块、功能或AI能力" className="w-full pl-9 sm:w-72" /></div><Select value={status} onValueChange={(value) => setStatus(value as DeliveryStatus | "all")}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部交付状态</SelectItem><SelectItem value="available">已接入可用</SelectItem><SelectItem value="deepening">深化开发中</SelectItem><SelectItem value="planned">规划排期</SelectItem></SelectContent></Select><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button></div>
          </div>
          <div className="mt-4 flex items-center gap-3"><Progress value={completion} className="h-2" /><span className="whitespace-nowrap text-xs font-medium text-slate-500">真实接入率 {completion}%</span></div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {filteredGroups.map((group, index) => <FeatureGroupCard key={`${group.name}-${index}`} group={group} />)}
      </div>
      {filteredGroups.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">没有符合筛选条件的功能。</div>}

      <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-800"><BookOpenCheck className="mr-2 inline h-4 w-4" />{payload.baseline.policy} 当前清单直接来源于角色功能规划表 v6，后续每个模块验收后再切换交付状态。</div>
    </>}
  </div>;
}

function HeaderMetric({ value, label }: { value: number | string; label: string }) {
  return <div className="min-w-20 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-[11px] text-blue-100">{label}</p></div>;
}

function SummaryCard({ icon: Icon, label, value, detail, tone }: { icon: typeof Layers3; label: string; value: number; detail: string; tone: "slate" | "emerald" | "blue" | "amber" }) {
  const colors = { slate: "bg-slate-100 text-slate-700", emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700" };
  return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className={`rounded-xl p-3 ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div></CardContent></Card>;
}

function FeatureGroupCard({ group }: { group: FeatureGroup }) {
  const counts = group.items.reduce<Record<DeliveryStatus, number>>((result, item) => { result[item.status] += 1; return result; }, { available: 0, deepening: 0, planned: 0 });
  return <Card className="overflow-hidden border-slate-200 shadow-sm">
    <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4"><div className="flex items-start justify-between gap-4"><div><CardTitle className="text-base text-slate-900">{group.name}</CardTitle><p className="mt-1 text-xs text-slate-500">共 {group.items.length} 项 · 已接入 {counts.available} · 深化 {counts.deepening} · 排期 {counts.planned}</p></div><Link href={group.route}><Button size="sm" variant="outline">进入板块<ChevronRight className="ml-1 h-4 w-4" /></Button></Link></div></CardHeader>
    <CardContent className="divide-y divide-slate-100 p-0">{group.items.map((item) => { const meta = STATUS_META[item.status]; const Icon = meta.icon; return <div key={item.row} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-blue-50/30"><div className="min-w-0"><p className="text-sm font-medium text-slate-800">{item.level2 || item.level3 || group.name}</p>{item.level3 && <p className="mt-1 text-xs leading-5 text-slate-500">{item.level3}</p>}{item.ai && <p className="mt-1 flex items-start gap-1 text-xs leading-5 text-violet-600"><Sparkles className="mt-0.5 h-3 w-3 shrink-0" />{item.ai}</p>}</div><Badge variant="outline" className={`shrink-0 ${meta.className}`}><Icon className="mr-1 h-3 w-3" />{meta.label}</Badge></div>; })}</CardContent>
  </Card>;
}



