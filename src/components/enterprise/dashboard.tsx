import type { LucideIcon } from "lucide-react";

const tones = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
} as const;

export function MetricCard({ label, value, detail, icon: Icon, tone = "blue", trend }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: keyof typeof tones; trend?: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,.08)]">
    <div className="flex items-start justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}><Icon className="h-4.5 w-4.5" /></span>{trend && <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">{trend}</span>}</div>
    <p className="mt-5 text-[11px] font-medium text-slate-500">{label}</p><p className="mt-1 text-[26px] font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1.5 text-[11px] leading-4 text-slate-400">{detail}</p>
  </div>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div><h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>{description && <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>}</div>{action}</div>;
}

export function StatusPill({ status, label }: { status: "healthy" | "warning" | "danger" | "neutral" | "info"; label: string }) {
  const colors = { healthy: "border-emerald-200 bg-emerald-50 text-emerald-700", warning: "border-amber-200 bg-amber-50 text-amber-700", danger: "border-rose-200 bg-rose-50 text-rose-700", neutral: "border-slate-200 bg-slate-50 text-slate-600", info: "border-blue-200 bg-blue-50 text-blue-700" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${colors[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{label}</span>;
}
