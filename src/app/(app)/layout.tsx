"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AIBubble } from "@/components/ai/ai-bubble";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const fullScreen = pathname?.includes("/dashboard/screen");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    let valid = Boolean(token && raw);
    if (valid) { try { const user = JSON.parse(raw!) as { roles?: unknown[]; role?: string }; valid = Boolean(user.role || user.roles?.length); } catch { valid = false; } }
    if (!valid) { localStorage.removeItem("token"); localStorage.removeItem("user"); window.dispatchEvent(new Event("jhxt:auth-changed")); router.replace("/login"); return; }
    setCollapsed(localStorage.getItem("jhxt-sidebar-collapsed") === "true");
    setSessionReady(true);
  }, [router]);

  const toggleSidebar = useCallback(() => setCollapsed(value => { const next = !value; localStorage.setItem("jhxt-sidebar-collapsed", String(next)); return next; }), []);
  if (!sessionReady) return <AppShellSkeleton />;
  if (fullScreen) return <>{children}</>;

  return <div className="flex min-h-screen bg-background text-foreground">
    <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
    <div className="relative flex min-w-0 flex-1 flex-col">
      <Header />
      <div role="status" data-mode="DEMO" className="border-b-2 border-red-600 bg-red-100 px-4 py-2 text-center text-sm font-bold tracking-wide text-red-950">
        模拟演示，无真实资金划转 · 当前数据与身份仅用于开发验证，禁止接入真实学生资料
      </div>
      <main className="relative flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50/70 to-transparent dark:from-blue-950/25" />
        <div key={pathname} className="relative mx-auto w-full max-w-[1680px] animate-page-enter">{children}</div>
      </main>
    </div>
    <AIBubble />
  </div>;
}

function AppShellSkeleton() { return <div className="flex min-h-screen bg-background"><div className="hidden w-[272px] border-r border-sidebar-border bg-sidebar lg:block"><div className="h-[72px] border-b border-sidebar-border" /><div className="space-y-3 p-4">{[1,2,3,4,5,6].map(item => <div key={item} className="h-10 animate-pulse rounded-xl bg-sidebar-accent" />)}</div></div><div className="flex-1"><div className="h-[72px] border-b border-border bg-card" /><div className="grid gap-4 p-7 md:grid-cols-4">{[1,2,3,4].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-card" />)}</div></div></div>; }
