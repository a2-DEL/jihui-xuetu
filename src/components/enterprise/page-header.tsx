import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  actions?: Array<{ label: string; icon?: LucideIcon; onClick: () => void; variant?: "default" | "outline" | "secondary"; disabled?: boolean }>;
}

export function EnterprisePageHeader({ eyebrow = "ENTERPRISE WORKSPACE", title, description, icon: Icon, badge, actions = [] }: PageHeaderProps) {
  return <section className="relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,.06)] lg:px-7">
    <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_60%_30%,rgba(37,99,235,.10),transparent_60%)]" />
    <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_10px_28px_rgba(15,23,42,.2)]"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold tracking-[.18em] text-blue-700">{eyebrow}</p>{badge && <Badge className="border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-50">{badge}</Badge>}</div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {actions.length > 0 && <div className="flex shrink-0 flex-wrap gap-2">{actions.map(action => { const ActionIcon = action.icon; return <Button key={action.label} variant={action.variant ?? "default"} disabled={action.disabled} onClick={action.onClick} className="rounded-xl"><>{ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}{action.label}</></Button>; })}</div>}
    </div>
  </section>;
}
