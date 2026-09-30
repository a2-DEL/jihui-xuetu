"use client";

import Link from "next/link";
import { Activity, ArrowRight, Bot, CheckCircle2, ClipboardCheck, Database, FileCheck2, FileInput, GitBranch, Landmark, LockKeyhole, MessageSquareText, Network, ScanText, Send, ShieldCheck, Sparkles, UserCheck, UsersRound, WalletCards, Workflow } from "lucide-react";
import type { PlatformTourSnapshot, ProcessStep } from "@/lib/platform/platform-tour";
import { PresentationControls, Reveal, SimulationNotice, TONE_STYLES, TourFooterNav, TourHero, TourNavigation, useProgressiveReveal } from "./tour-shared";

const STEP_ICONS = [Send, MessageSquareText, FileInput, ScanText, UserCheck, UsersRound, ClipboardCheck, ShieldCheck, WalletCards, Landmark] as const;
const TECH_BADGES: ReadonlyArray<readonly string[]> = [
  ["政策RAG", "通知生成Skill", "受众权限过滤"],
  ["意图路由", "角色记忆", "引用可追溯"],
  ["OCR", "版面分析", "实体抽取", "SHA256"],
  ["确定性规则", "DeepSeek模型", "Guardrails", "HITL"],
  ["多Agent协作", "证据整理Skill", "班级数据边界"],
  ["工作流编排", "批量校验Skill", "交接消息队列"],
  ["本体映射", "一致性检查", "九维权限"],
  ["决策摘要Agent", "XAI解释", "人工审批闸门"],
  ["预算规则", "双人复核", "幂等校验"],
  ["银行MCP", "回盘解析Skill", "对账Agent", "审计链"],
];

export function CoreProcessOverview({ data }: { data: PlatformTourSnapshot }) {
  const total = data.mainScenario.length + 2;
  const reveal = useProgressiveReveal(total);
  return <div className="space-y-5">
    <TourNavigation current="process" />
    <TourHero eyebrow="END-TO-END ORCHESTRATION · CHAPTER 03" title="临时困难补助 · 核心流程全景" description="以一笔模拟临时困难补助为主线，把通知、申请、初审、院系汇总、校级审核、领导审批、财务发放、银行回盘和审计归档连接成一条可运行工作流。每个节点均明确Agent动作、人工闸门与证据输出。" icon={Workflow} metrics={[
      { value: data.metrics.processSteps.toString(), label: "流程节点" }, { value: "7", label: "核心岗位" }, { value: "5", label: "人工闸门" }, { value: "100%", label: "审计留痕" },
    ]} actions={<PresentationControls total={total} label="业务流程" state={reveal} />} />

    <Reveal show={reveal.step >= 2}>
      <SimulationNotice statement={data.simulationStatement} compact />
      <section className="relative mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f] p-5 text-white shadow-xl lg:p-6"><div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(94,160,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(94,160,255,.055) 1px,transparent 1px)", backgroundSize: "32px 32px" }} /><div className="relative"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">WORKFLOW INSTANCE · LKBZ-2026-001</p><h2 className="mt-1.5 text-xl font-bold">总调度Agent正在等待任务启动</h2><p className="mt-2 text-sm text-slate-400">进入演示模式后，节点将按真实交接顺序逐一激活。</p></div><div className="flex flex-wrap gap-2">{["Workflow 已发布", "Skill 版本锁定", "MCP 连接健康", "审计链已开启"].map(item => <span key={item} className="rounded-full border border-emerald-400/15 bg-emerald-400/8 px-3 py-1.5 text-[9px] font-semibold text-emerald-200"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />{item}</span>)}</div></div><div className="mt-6 overflow-x-auto pb-2"><div className="flex min-w-max items-center">{data.mainScenario.map((step, index) => { const active = reveal.step >= index + 3; return <div key={step.id} className="flex items-center"><div className={`w-32 rounded-2xl border p-3 transition-all duration-500 ${active ? "border-blue-400/35 bg-blue-500/12 shadow-[0_0_28px_rgba(37,99,235,.13)]" : "border-white/8 bg-white/[.025] opacity-45"}`}><div className="flex items-center justify-between"><span className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[9px] font-bold ${active ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-500"}`}>{String(step.sequence).padStart(2, "0")}</span>{active ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <span className="h-2 w-2 rounded-full border border-slate-600" />}</div><p className={`mt-3 truncate text-xs font-semibold ${active ? "text-slate-100" : "text-slate-500"}`}>{step.phase}</p><p className="mt-1 truncate text-[9px] text-slate-600">{step.owner}</p></div>{index < data.mainScenario.length - 1 && <div className={`relative h-px w-7 transition-colors duration-500 ${reveal.step >= index + 4 ? "bg-cyan-400/70" : "bg-slate-800"}`}><span className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${reveal.step >= index + 4 ? "bg-cyan-300" : "bg-slate-700"}`} /></div>}</div>; })}</div></div></div></section>
    </Reveal>

    <section className="relative"><div className="absolute bottom-0 left-[27px] top-0 hidden w-px bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-500 lg:block" />
      <div className="space-y-4">{data.mainScenario.map((step, index) => <Reveal key={step.id} show={reveal.step >= index + 3}><ProcessStepCard step={step} index={index} /></Reveal>)}</div>
    </section>

    <Reveal show={reveal.step >= total}>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">CONTROLLED AUTOMATION</p><h2 className="mt-1.5 text-lg font-bold text-foreground">自动化边界清晰可验证</h2></div><LockKeyhole className="h-5 w-5 text-blue-600" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[
          { icon: Bot, title: "Agent可执行", text: "检索、解析、核验、汇总、生成草稿、发起受控工具调用。" },
          { icon: UserCheck, title: "人类必须决定", text: "资格例外、审核结论、领导审批、资金授权与审计结论。" },
          { icon: ShieldCheck, title: "程序强制阻断", text: "越权访问、重复发放、金额不平、缺少双签和敏感字段外泄。" },
          { icon: Database, title: "证据自动沉淀", text: "输入输出、模型版本、工具参数、审批签名、回盘和差异闭环。" },
        ].map(item => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-border bg-muted/25 p-4"><Icon className="h-5 w-5 text-blue-600" /><h3 className="mt-3 text-sm font-bold text-foreground">{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.text}</p></div>; })}</div></div>
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl lg:p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">LIVE AGENT COLLABORATION</p><h2 className="mt-2 text-lg font-bold">多Agent协作实况已接入原系统运行时</h2><p className="mt-2 text-xs leading-6 text-slate-400">点击进入正式协作指挥台，可新建持久化运行实例，查看小海豚任务拆解、成员分工、执行汇报、交接、人工确认与最终汇总。</p><div className="mt-5 space-y-2">{["多Agent协作群聊与任务图", "真实Skill / 模型 / MCP调用状态", "业务状态与工作流实例双向同步", "权限判定和审计事件实时侧栏"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.035] px-3 py-2.5"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 font-mono text-[9px] text-blue-200">0{index + 1}</span><p className="text-xs text-slate-300">{item}</p></div>)}</div><div className="mt-5 grid grid-cols-2 gap-2"><Link href="/agent/studio?view=workflows" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-[11px] font-semibold hover:bg-blue-500">工作流工作室<GitBranch className="h-3.5 w-3.5" /></Link><Link href="/agent/monitor/collaboration" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-white/[.08]">打开协作实况<Network className="h-3.5 w-3.5" /></Link></div></div>
      </section>
      <TourFooterNav previous={{ href: "/platform-tour/roles", label: "上一章：17角色协作全景" }} />
    </Reveal>
  </div>;
}

function ProcessStepCard({ step, index }: { step: ProcessStep; index: number }) {
  const Icon = STEP_ICONS[index] ?? Activity;
  const tone = TONE_STYLES[step.tone];
  return <article className="relative lg:pl-20"><span className={`absolute left-0 top-5 z-10 hidden h-14 w-14 items-center justify-center rounded-2xl border-4 border-background shadow-lg lg:flex ${tone.icon}`}><Icon className="h-5 w-5" /></span><div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="grid xl:grid-cols-[250px_1fr]"><div className={`relative overflow-hidden bg-gradient-to-br ${tone.dark} p-5 text-white`}><div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/15 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold text-white/65">STEP {String(step.sequence).padStart(2, "0")}</span><span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold">{step.phase}</span></div><h2 className="mt-5 text-lg font-bold leading-7">{step.title}</h2><div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-3 py-2.5"><UserCheck className="h-4 w-4 text-white/70" /><div><p className="text-[9px] text-white/60">责任角色</p><p className="mt-0.5 text-xs font-semibold">{step.owner}</p></div></div><p className="mt-4 text-[10px] leading-5 text-white/70"><Sparkles className="mr-1 inline h-3 w-3" />解决：{step.painSolved}</p></div></div><div className="p-5"><div className="grid gap-3 md:grid-cols-3"><DetailBlock icon={Bot} title="Agent执行" text={step.aiAction} tone="blue" /><DetailBlock icon={UserCheck} title="人工闸门" text={step.humanGate} tone="amber" /><DetailBlock icon={FileCheck2} title="审计证据" text={step.evidence} tone="emerald" /></div><div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-1.5">{TECH_BADGES[index]?.map(item => <span key={item} className="rounded-lg border border-border bg-muted/45 px-2 py-1 text-[9px] font-semibold text-muted-foreground">{item}</span>)}</div><Link href={step.route} className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">进入真实业务页面<ArrowRight className="h-3.5 w-3.5" /></Link></div></div></div></div></article>;
}
function DetailBlock({ icon: Icon, title, text, tone }: { icon: typeof Bot; title: string; text: string; tone: "blue" | "amber" | "emerald" }) {
  const styles = tone === "blue" ? "border-blue-200 bg-blue-50/70 text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300" : tone === "amber" ? "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300" : "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300";
  return <div className={`rounded-xl border p-3.5 ${styles}`}><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><h3 className="text-[10px] font-bold uppercase tracking-wider">{title}</h3></div><p className="mt-2 text-[11px] leading-5 text-foreground/75">{text}</p></div>;
}



