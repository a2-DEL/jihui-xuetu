"use client";

import Link from "next/link";
import { ArrowRight, Award, BookOpenCheck, Bot, BriefcaseBusiness, CheckCircle2, CircleDollarSign, GraduationCap, HandCoins, Landmark, Network, Route, Scale, ShieldCheck, Sparkles, UserRoundCheck, WalletCards } from "lucide-react";
import type { PlatformTourSnapshot, TourTone } from "@/lib/platform/platform-tour";
import { PresentationControls, Reveal, SimulationNotice, TONE_STYLES, TourFooterNav, TourHero, TourNavigation, useProgressiveReveal } from "./tour-shared";

const BRANCH_ICONS = { SCHOLARSHIP: Award, GRANT: HandCoins, LOAN: Landmark, MILITARY: ShieldCheck, COMPENSATION: BriefcaseBusiness, WORK_STUDY: WalletCards, GREEN_CHANNEL: GraduationCap, CAMPUS_AID: CircleDollarSign } as const;
const LIFECYCLE_ICONS = [BookOpenCheck, Sparkles, UserRoundCheck, Scale, WalletCards, ShieldCheck] as const;
const LAYERS: ReadonlyArray<{ index: string; title: string; text: string; tone: TourTone; icon: typeof Bot }> = [
  { index: "L1", title: "政策与业务对象", text: "将资助政策、项目、学生、材料、审批、资金和证据统一建模。", tone: "blue", icon: BookOpenCheck },
  { index: "L2", title: "17角色协同", text: "按岗位职责、组织范围和数据边界组织人工作业与跨部门流转。", tone: "cyan", icon: Network },
  { index: "L3", title: "Agent执行网络", text: "小海豚调度角色Agent、Skill、模型和MCP工具执行可控任务。", tone: "violet", icon: Bot },
  { index: "L4", title: "安全与审计底座", text: "九维权限、确定性护栏、人机回环与证据链约束每一次行动。", tone: "emerald", icon: ShieldCheck },
];

export function AidSystemOverview({ data }: { data: PlatformTourSnapshot }) {
  const reveal = useProgressiveReveal(5);
  return <div className="space-y-5">
    <TourNavigation current="overview" />
    <TourHero eyebrow="HIGHER EDUCATION STUDENT AID · CHAPTER 01" title="高校学生资助体系总览" description="先理解高校资助“资助谁、用什么方式资助、如何规范运行”，再进入17角色协作与完整业务链。该页面来自原系统统一业务模型，可直接作为视频第一章的正式画面。" icon={GraduationCap} metrics={[
      { value: data.metrics.aidBranches.toString(), label: "资助类型" }, { value: data.metrics.roles.toString(), label: "协同角色" }, { value: data.metrics.agents.toString(), label: "注册Agent" }, { value: data.metrics.processSteps.toString(), label: "核心节点" },
    ]} actions={<PresentationControls total={5} label="资助体系" state={reveal} />} />

    <Reveal show={reveal.step >= 2}>
      <SimulationNotice statement={data.simulationStatement} />
      <section className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_28px_rgba(37,99,235,.2)]"><GraduationCap className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">WHAT IS STUDENT AID</p><h2 className="mt-1.5 text-xl font-bold text-foreground">高校资助不是一次“发钱”，而是一套保障与育人体系</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">它以“不让一个学生因家庭经济困难而失学”为底线，综合运用奖、助、贷、勤、补、免等政策工具，在入学、在校、毕业与就业衔接阶段提供保障，并通过规范认定、公开监督和发展型服务促进学生成长。</p></div></div></div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-[0_18px_45px_rgba(37,99,235,.18)]"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-200">CORE PRINCIPLES</p><div className="mt-4 grid grid-cols-2 gap-3">{["保障公平", "精准识别", "规范执行", "资助育人"].map((item, index) => <div key={item} className="rounded-xl border border-white/10 bg-white/8 p-3"><span className="font-mono text-[10px] text-cyan-200">0{index + 1}</span><p className="mt-1 text-sm font-semibold">{item}</p></div>)}</div></div>
      </section>
    </Reveal>

    <Reveal show={reveal.step >= 3}>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">POLICY TOOLBOX</p><h2 className="mt-1.5 text-xl font-bold text-foreground">八类资助工具覆盖学生关键阶段</h2><p className="mt-2 text-sm text-muted-foreground">每张卡片都是系统中的正式项目类型，可继续承载资格规则、材料模板、审批流与预算。</p></div><span className="rounded-full border border-border bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">奖 · 助 · 贷 · 勤 · 补 · 免 · 绿色通道</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.aidBranches.map(branch => {
          const Icon = BRANCH_ICONS[branch.code as keyof typeof BRANCH_ICONS] ?? HandCoins;
          const tone = TONE_STYLES[branch.tone];
          return <article key={branch.code} className="group relative overflow-hidden rounded-2xl border border-border bg-background/60 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"><span className={`absolute inset-x-0 top-0 h-0.5 ${tone.line}`} /><div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.icon}`}><Icon className="h-4 w-4" /></span><span className="font-mono text-[9px] text-muted-foreground">{branch.code}</span></div><h3 className="mt-4 text-base font-bold text-foreground">{branch.name}</h3><p className="mt-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">{branch.subtitle}</p><p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{branch.coverage}</p><div className="mt-3 flex flex-wrap gap-1.5">{branch.examples.map(example => <span key={example} className="rounded-lg border border-border bg-card px-2 py-1 text-[9px] text-muted-foreground">{example}</span>)}</div></article>;
        })}</div>
      </section>
    </Reveal>

    <Reveal show={reveal.step >= 4}>
      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">FULL LIFECYCLE</p><h2 className="mt-1.5 text-xl font-bold text-foreground">从政策到育人的六段闭环</h2></div><Route className="h-6 w-6 text-blue-600" /></div><div className="relative mt-6 grid gap-3 lg:grid-cols-3">{data.lifecycle.map((item, index) => { const Icon = LIFECYCLE_ICONS[index] ?? CheckCircle2; return <div key={item.stage} className="relative rounded-2xl border border-border bg-muted/35 p-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-blue-600"><Icon className="h-4 w-4" /></span><div><span className="font-mono text-[9px] text-blue-600">0{index + 1}</span><h3 className="text-sm font-bold text-foreground">{item.stage}</h3></div></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{item.description}</p></div>; })}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">SYSTEM BOUNDARY</p><h2 className="mt-2 text-lg font-bold">AI参与，但不越权</h2><div className="mt-5 space-y-3">{["确定性规则先于模型判断", "AI建议与人工决定明确分离", "敏感数据按身份与任务最小披露", "资金与高风险动作必须人工授权", "每次调用形成可验证审计证据"].map((item, index) => <div key={item} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[.035] px-3 py-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-3 w-3" /></span><div><p className="text-xs font-medium text-slate-200">{item}</p><p className="mt-0.5 font-mono text-[8px] text-slate-600">CONTROL-{String(index + 1).padStart(2, "0")}</p></div></div>)}</div></div>
      </section>
    </Reveal>

    <Reveal show={reveal.step >= 5}>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">PLATFORM LOGIC</p><h2 className="mt-1.5 text-xl font-bold text-foreground">业务、角色、Agent与安全底座一体化</h2><p className="mt-2 text-sm text-muted-foreground">不是把聊天框贴在业务系统上，而是让AI能力在业务对象、权限与证据约束中运行。</p></div><Link href="/platform-tour/roles" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300">查看17角色如何协作<ArrowRight className="h-4 w-4" /></Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{LAYERS.map(layer => { const Icon = layer.icon; const tone = TONE_STYLES[layer.tone]; return <div key={layer.index} className="relative overflow-hidden rounded-2xl border border-border bg-muted/25 p-4"><span className={`absolute inset-x-0 top-0 h-0.5 ${tone.line}`} /><div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.icon}`}><Icon className="h-4 w-4" /></span><span className="font-mono text-[10px] font-bold text-muted-foreground">{layer.index}</span></div><h3 className="mt-4 text-sm font-bold text-foreground">{layer.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{layer.text}</p></div>; })}</div></section>
      <TourFooterNav next={{ href: "/platform-tour/roles", label: "下一章：17角色协作全景" }} />
    </Reveal>
  </div>;
}



