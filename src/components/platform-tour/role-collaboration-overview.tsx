"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, BrainCircuit, Building2, CheckCircle2, ChevronRight, Database, ExternalLink, GraduationCap, Landmark, LockKeyhole, Network, Scale, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import type { PlatformTourSnapshot, TourRole, TourTone } from "@/lib/platform/platform-tour";
import { PresentationControls, Reveal, SimulationNotice, TONE_STYLES, TourFooterNav, TourHero, TourNavigation, useProgressiveReveal } from "./tour-shared";

const GROUP_META: Record<string, { code: string; tone: TourTone; icon: typeof UsersRound }> = {
  "技术与平台": { code: "PLATFORM", tone: "violet", icon: BrainCircuit },
  "学校管理·业务决策层": { code: "DECISION", tone: "amber", icon: Scale },
  "学校管理·业务执行层": { code: "SCHOOL OPS", tone: "blue", icon: Building2 },
  "院系执行": { code: "DEPARTMENT", tone: "cyan", icon: UsersRound },
  "学生服务": { code: "STUDENT", tone: "emerald", icon: GraduationCap },
  "外部协作": { code: "EXTERNAL", tone: "cyan", icon: Landmark },
  "监管与监督": { code: "SUPERVISION", tone: "rose", icon: ShieldCheck },
  "数据与内容管理": { code: "GOVERNANCE", tone: "violet", icon: Database },
};
const SCOPE_NAMES: Record<string, string> = { platform: "平台全域", school: "本校范围", department: "所属院系", class: "所带班级", self: "仅本人", assigned: "授权任务", "external-task": "外部委托" };

export function RoleCollaborationOverview({ data }: { data: PlatformTourSnapshot }) {
  const total = data.roleGroups.length + 3;
  const reveal = useProgressiveReveal(total);
  const [selectedCode, setSelectedCode] = useState("FUND_ADMIN");
  const selected = useMemo(() => data.roles.find(role => role.code === selectedCode) ?? data.roles[0], [data.roles, selectedCode]);
  const chain = useMemo(() => data.mainScenario.map(step => ({ step: step.sequence, phase: step.phase, role: step.owner, code: step.ownerCode })), [data.mainScenario]);
  return <div className="space-y-5">
    <TourNavigation current="roles" />
    <TourHero eyebrow="ROLE COLLABORATION NETWORK · CHAPTER 02" title="17角色 × 17团队 × 68 Agent 协作全景" description="每个岗位都拥有独立RBAC身份、数据边界、AI风险上限和专属Agent团队。角色并非菜单皮肤，而是参与同一资助业务链的责任主体。点击任意角色即可下钻查看真实注册信息。" icon={Network} metrics={[
      { value: data.metrics.roles.toString(), label: "RBAC角色" }, { value: data.metrics.teams.toString(), label: "Agent团队" }, { value: data.metrics.agents.toString(), label: "专业Agent" }, { value: "9D", label: "权限交集" },
    ]} actions={<PresentationControls total={total} label="角色协作" state={reveal} />} />

    <Reveal show={reveal.step >= 2}>
      <SimulationNotice statement={data.simulationStatement} compact />
      <section className="mt-5 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">GOVERNANCE FORMULA</p><h2 className="mt-1.5 text-lg font-bold text-foreground">人和Agent都必须通过同一套权限交集</h2></div><div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold"><Formula value="角色" /><span className="text-muted-foreground">∩</span><Formula value="组织" /><span className="text-muted-foreground">∩</span><Formula value="数据" /><span className="text-muted-foreground">∩</span><Formula value="流程" /><span className="text-muted-foreground">∩</span><Formula value="AI风险" /></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{data.safeguards.map((item, index) => <div key={item} className="rounded-xl border border-border bg-muted/35 p-3"><span className="font-mono text-[9px] text-blue-600">G-{String(index + 1).padStart(2, "0")}</span><p className="mt-1 text-[11px] font-semibold leading-4 text-foreground">{item}</p></div>)}</div></div>
        <RoleInspector role={selected} />
      </section>
    </Reveal>

    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">{data.roleGroups.map((group, groupIndex) => {
        const show = reveal.step >= groupIndex + 3;
        if (!show) return null;
        const meta = GROUP_META[group.category] ?? { code: "ROLE GROUP", tone: "blue" as const, icon: UsersRound };
        const Icon = meta.icon;
        const tone = TONE_STYLES[meta.tone];
        return <section key={group.category} className="tour-reveal overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b border-border bg-muted/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}><Icon className="h-4 w-4" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-bold text-foreground">{group.category}</h2><span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[9px] text-muted-foreground">{meta.code}</span></div><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{group.description}</p></div></div><span className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold text-muted-foreground">{group.roles.length} 个角色 · {group.roles.length * 4} Agent</span></div><div className={`grid gap-px bg-border ${group.roles.length === 1 ? "grid-cols-1" : group.roles.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 2xl:grid-cols-3"}`}>{group.roles.map(role => <button type="button" key={role.code} onClick={() => { setSelectedCode(role.code); document.getElementById("role-inspector-mobile")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className={`group bg-card p-4 text-left transition hover:bg-blue-50/60 dark:hover:bg-blue-950/20 ${selected?.code === role.code ? "ring-2 ring-inset ring-blue-500" : ""}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{role.name}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{role.code}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></div><p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{role.responsibility}</p><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">{SCOPE_NAMES[role.dataScope] ?? role.dataScope}</span><span className="rounded-lg bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700 dark:bg-violet-950/35 dark:text-violet-300">AI {role.maxAiLevel}</span><span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">DATA {role.maxDataSensitivity}</span><span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">4 Agent</span></div></button>)}</div></section>;
      })}</div>
      <div id="role-inspector-mobile" className="hidden xl:block"><div className="sticky top-24"><RoleInspector role={selected} expanded /></div></div>
    </div>

    <Reveal show={reveal.step >= total}>
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl lg:p-6"><div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-blue-600/20 blur-[90px]" /><div className="relative"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">TEMPORARY HARDSHIP GRANT</p><h2 className="mt-1.5 text-xl font-bold">一条业务链上的角色交接</h2><p className="mt-2 text-sm text-slate-400">同一角色可在不同节点承担不同责任；每次交接都携带任务、最小数据和审计证据。</p></div><Link href="/platform-tour/process" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">查看10节点执行细节<ArrowRight className="h-4 w-4" /></Link></div><div className="mt-6 overflow-x-auto pb-2"><div className="flex min-w-max items-center">{chain.map((item, index) => <div key={`${item.step}-${item.code}`} className="flex items-center"><div className="w-36 rounded-2xl border border-white/10 bg-white/[.045] p-3"><div className="flex items-center justify-between"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 font-mono text-[9px] font-bold text-blue-200">{String(item.step).padStart(2, "0")}</span><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /></div><p className="mt-3 truncate text-xs font-semibold text-slate-100">{item.role}</p><p className="mt-1 text-[9px] text-slate-500">{item.phase}</p></div>{index < chain.length - 1 && <div className="relative h-px w-8 bg-slate-700"><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400" /></div>}</div>)}</div></div><div className="mt-4 flex flex-wrap gap-2">{["角色边界不丢失", "任务状态实时同步", "Agent交接可观测", "人工闸门不可绕过", "全过程证据可追溯"].map(item => <span key={item} className="rounded-full border border-emerald-400/15 bg-emerald-400/8 px-3 py-1.5 text-[10px] text-emerald-200"><CheckCircle2 className="mr-1 inline h-3 w-3" />{item}</span>)}</div></div></section>
      <TourFooterNav previous={{ href: "/platform-tour", label: "上一章：资助体系总览" }} next={{ href: "/platform-tour/process", label: "下一章：核心流程全景" }} />
    </Reveal>
  </div>;
}

function Formula({ value }: { value: string }) { return <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 dark:border-blue-900 dark:bg-blue-950/25 dark:text-blue-300">{value}</span>; }

function RoleInspector({ role, expanded = false }: { role: TourRole | undefined; expanded?: boolean }) {
  if (!role) return null;
  return <aside className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl ${expanded ? "" : "xl:hidden"}`}><div className="border-b border-white/8 bg-gradient-to-br from-blue-600/20 to-transparent p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300">LIVE ROLE REGISTRY</p><h3 className="mt-2 text-lg font-bold">{role.name}</h3><p className="mt-1 font-mono text-[9px] text-slate-500">{role.code} · {role.dashboard}</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">已注册</span></div></div><div className="space-y-4 p-5"><InspectorRow icon={UserRound} label="核心业务" value={role.coreBusiness} /><InspectorRow icon={Database} label="数据边界" value={role.dataPolicy} /><InspectorRow icon={LockKeyhole} label="决策边界" value={role.decisionBoundary} danger /><div><div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">专属Agent团队</p><span className="font-mono text-[9px] text-emerald-300">4 / 4 ONLINE</span></div><div className="mt-2 space-y-2">{role.agentTeam.map(agent => <div key={agent.code} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[.035] px-3 py-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><Bot className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-slate-200">{agent.name}</p><p className="mt-0.5 truncate font-mono text-[8px] text-slate-600">{agent.code}</p></div><span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /></div>)}</div></div><div className="grid grid-cols-3 gap-2"><Tiny label="AI上限" value={role.maxAiLevel} /><Tiny label="数据上限" value={role.maxDataSensitivity} /><Tiny label="数据范围" value={SCOPE_NAMES[role.dataScope] ?? role.dataScope} /></div><Link href={`/user-management/roles/${role.code}`} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-3 py-2.5 text-[11px] font-semibold text-slate-200 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white">进入角色注册详情<ExternalLink className="h-3.5 w-3.5" /></Link></div></aside>;
}
function InspectorRow({ icon: Icon, label, value, danger = false }: { icon: typeof UserRound; label: string; value: string; danger?: boolean }) { return <div className="flex items-start gap-3"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${danger ? "bg-rose-500/10 text-rose-300" : "bg-white/[.05] text-slate-400"}`}><Icon className="h-3.5 w-3.5" /></span><div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className={`mt-1 text-[11px] leading-5 ${danger ? "text-rose-200" : "text-slate-300"}`}>{value}</p></div></div>; }
function Tiny({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/8 bg-white/[.035] p-2.5 text-center"><p className="truncate text-xs font-bold text-white">{value}</p><p className="mt-1 text-[8px] text-slate-600">{label}</p></div>; }

