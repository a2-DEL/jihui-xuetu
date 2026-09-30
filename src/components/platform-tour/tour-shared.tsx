"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, CircleDot, Film, Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import type { TourTone } from "@/lib/platform/platform-tour";

export const TONE_STYLES: Record<TourTone, { soft: string; icon: string; line: string; dark: string }> = {
  blue: { soft: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/25 dark:text-blue-200", icon: "bg-blue-600 text-white", line: "bg-blue-500", dark: "from-blue-600 to-blue-500" },
  cyan: { soft: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/25 dark:text-cyan-200", icon: "bg-cyan-600 text-white", line: "bg-cyan-500", dark: "from-cyan-600 to-cyan-500" },
  emerald: { soft: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-200", icon: "bg-emerald-600 text-white", line: "bg-emerald-500", dark: "from-emerald-600 to-emerald-500" },
  amber: { soft: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100", icon: "bg-amber-500 text-slate-950", line: "bg-amber-500", dark: "from-amber-500 to-orange-500" },
  violet: { soft: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/25 dark:text-violet-200", icon: "bg-violet-600 text-white", line: "bg-violet-500", dark: "from-violet-600 to-violet-500" },
  rose: { soft: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-200", icon: "bg-rose-600 text-white", line: "bg-rose-500", dark: "from-rose-600 to-rose-500" },
};

const TOUR_TABS = [
  { path: "/platform-tour", label: "资助体系总览", short: "01" },
  { path: "/platform-tour/roles", label: "17角色协作全景", short: "02" },
  { path: "/platform-tour/process", label: "核心流程全景", short: "03" },
] as const;

export function TourNavigation({ current }: { current: "overview" | "roles" | "process" }) {
  const pathname = usePathname();
  const activePath = current === "overview" ? "/platform-tour" : current === "roles" ? "/platform-tour/roles" : "/platform-tour/process";
  return <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
    <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:pb-0">{TOUR_TABS.map(tab => {
      const active = activePath === tab.path || pathname === tab.path;
      return <Link key={tab.path} href={tab.path} className={`group flex min-w-max items-center gap-3 rounded-xl border px-4 py-2.5 transition ${active ? "border-blue-600 bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,.22)]" : "border-transparent bg-muted/55 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"}`}>
        <span className={`font-mono text-[10px] font-bold ${active ? "text-cyan-200" : "text-blue-600"}`}>{tab.short}</span><span className="text-sm font-semibold">{tab.label}</span>{active && <Check className="h-3.5 w-3.5" />}
      </Link>;
    })}</div>
    <div className="flex shrink-0 items-center gap-2 px-2 text-[11px] text-muted-foreground"><CircleDot className="h-3.5 w-3.5 text-emerald-500" /><span>原系统正式模块</span><span className="text-border">·</span><span>统一数据源</span><span className="text-border">·</span><span>可演示模式</span></div>
  </div>;
}

export function useProgressiveReveal(total: number) {
  const [presentation, setPresentation] = useState(false);
  const [step, setStep] = useState(total);
  const [autoPlaying, setAutoPlaying] = useState(false);

  useEffect(() => {
    if (!autoPlaying || !presentation) return;
    if (step >= total) { setAutoPlaying(false); return; }
    const timer = window.setTimeout(() => setStep(value => Math.min(total, value + 1)), 1150);
    return () => window.clearTimeout(timer);
  }, [autoPlaying, presentation, step, total]);

  const progress = useMemo(() => Math.round((Math.min(step, total) / total) * 100), [step, total]);
  const enter = () => { setPresentation(true); setStep(1); setAutoPlaying(false); };
  const exit = () => { setPresentation(false); setStep(total); setAutoPlaying(false); };
  const reset = () => { setStep(1); setAutoPlaying(false); };
  return { presentation, step, autoPlaying, progress, enter, exit, reset, setAutoPlaying, previous: () => setStep(value => Math.max(1, value - 1)), next: () => setStep(value => Math.min(total, value + 1)) };
}

export function PresentationControls({ total, state, label }: { total: number; label: string; state: ReturnType<typeof useProgressiveReveal> }) {
  if (!state.presentation) return <button type="button" onClick={state.enter} className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><Film className="h-4 w-4" />进入逐项演示</button>;
  return <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-white shadow-xl">
    <div className="mr-1 hidden min-w-28 sm:block"><div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400"><span>{label}</span><span>{state.step}/{total}</span></div><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800"><span className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-[width] duration-500" style={{ width: `${state.progress}%` }} /></div></div>
    <button type="button" onClick={state.reset} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="重新开始"><RotateCcw className="h-3.5 w-3.5" /></button>
    <button type="button" onClick={state.previous} disabled={state.step <= 1} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-30" aria-label="上一步"><ChevronLeft className="h-3.5 w-3.5" /></button>
    <button type="button" onClick={() => state.setAutoPlaying(value => !value)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold hover:bg-blue-500">{state.autoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{state.autoPlaying ? "暂停" : "自动播放"}</button>
    <button type="button" onClick={state.next} disabled={state.step >= total} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-30" aria-label="下一步"><ChevronRight className="h-3.5 w-3.5" /></button>
    <button type="button" onClick={state.exit} className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-slate-300 transition hover:bg-white/10">全部展开</button>
  </div>;
}

export function Reveal({ show, children, className = "" }: { show: boolean; children: React.ReactNode; className?: string }) {
  if (!show) return null;
  return <div className={`tour-reveal ${className}`}>{children}</div>;
}

export function SimulationNotice({ statement, compact = false }: { statement: string; compact?: boolean }) {
  return <section className={`relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/25 ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
    <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
    <div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><ShieldCheck className="h-4 w-4" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">模拟数据安全声明</h2><span className="rounded-full border border-emerald-300 bg-white/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">SIMULATED DATA · REAL ENGINE</span></div><p className={`mt-1.5 leading-5 text-emerald-900/75 dark:text-emerald-200/75 ${compact ? "text-[11px]" : "text-xs"}`}>{statement}</p></div></div>
  </section>;
}

export function TourHero({ eyebrow, title, description, icon: Icon, metrics, actions }: { eyebrow: string; title: string; description: string; icon: LucideIcon; metrics: ReadonlyArray<{ value: string; label: string }>; actions?: React.ReactNode }) {
  return <section className="relative overflow-hidden rounded-[26px] border border-slate-800 bg-[#081425] px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,.18)] lg:px-8 lg:py-8">
    <div className="pointer-events-none absolute inset-0 opacity-45" style={{ backgroundImage: "linear-gradient(rgba(96,165,250,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,.07) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
    <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-600/25 blur-[100px]" />
    <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/15 text-blue-100"><Icon className="h-5 w-5" /></span><p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-300">{eyebrow}</p></div><h1 className="mt-5 text-2xl font-bold tracking-[-.025em] sm:text-3xl">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/80">{description}</p></div><div className="flex shrink-0 flex-col items-start gap-4 xl:items-end">{actions}<div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">{metrics.map(metric => <div key={metric.label} className="min-w-24 bg-slate-950/65 px-4 py-3 text-center"><p className="text-lg font-bold text-white">{metric.value}</p><p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500">{metric.label}</p></div>)}</div></div></div>
  </section>;
}

export function TourFooterNav({ previous, next }: { previous?: { href: string; label: string }; next?: { href: string; label: string } }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div>{previous ? <Link href={previous.href} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-blue-700"><ArrowLeft className="h-4 w-4" />{previous.label}</Link> : <span className="text-xs text-muted-foreground">第一阶段 · 平台认知导览</span>}</div>{next && <Link href={next.href} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,.18)] transition hover:bg-blue-500">{next.label}<ArrowRight className="h-4 w-4" /></Link>}</div>;
}
