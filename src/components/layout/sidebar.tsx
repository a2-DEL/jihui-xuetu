"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, AlertTriangle, BarChart3, Bell, BookOpen, Bot, Brain, Calculator, CheckCircle, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, Clock, Database, FileSearch, FileStack, FileText, Files, FolderOpen, Gauge, Gift, GitBranch, History, Landmark, LayoutDashboard, ListTodo, LogOut, Menu, Monitor, Network, Plug, RefreshCw, ScrollText, Search, Settings, Shield, Sparkles, Star, Upload, User, UserCheck, Users, Workflow, X, Zap } from "lucide-react";

type IconComponent = typeof LayoutDashboard;
interface MenuItem { id: string; name: string; code: string; icon?: string; path?: string; badge?: string; children?: MenuItem[] }
interface StoredUser { id?: string; realName?: string; position?: string; roles?: Array<{ code?: string; name?: string }> }

const iconMap: Record<string, IconComponent> = { LayoutDashboard, AlertTriangle, Gauge, BarChart3, Monitor, FileText, Files, Clock, CheckCircle, CheckSquare, ListTodo, History, Users, User, Brain, Database, BookOpen, FolderOpen, Upload, Search, Workflow, GitBranch, Bell, Settings, Shield, Activity, Bot, Sparkles, UserCheck, ScrollText, Star, Gift, FileSearch, Landmark, Plug, RefreshCw, Calculator, Zap, Network, FileStack };
const fallbackMenus: MenuItem[] = [
  { id: "fallback-dashboard", name: "工作台", code: "fallback-dashboard", icon: "LayoutDashboard", path: "/dashboard/overview" },
  { id: "fallback-workbench", name: "岗位功能全景", code: "fallback-workbench", icon: "Workflow", path: "/role-workbench" },
  { id: "fallback-assistant", name: "小海豚智能助手", code: "fallback-assistant", icon: "Brain", path: "/ai-assistant/chat" },
];

export default function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuQuery, setMenuQuery] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isNavigating, startNavigation] = useTransition();
  const warmedPathsRef = useRef(new Set<string>());
  const prefetchTimerRef = useRef<number | null>(null);
  const prefetchTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const raw = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    let stored: StoredUser | null = null;
    try { stored = raw ? JSON.parse(raw) as StoredUser : null; } catch { stored = null; }
    setUser(stored);
    const cacheKey = `jhxt-menu-cache:${stored?.id ?? stored?.roles?.[0]?.code ?? "anonymous"}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null") as MenuItem[] | null;
      if (cached?.length) {
        setMenus(cached);
        setExpanded([cached[0]?.id].filter(Boolean));
        setMenuLoading(false);
      }
    } catch { sessionStorage.removeItem(cacheKey); }

    fetch("/api/menus", { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const payload = await response.json() as { success?: boolean; data?: MenuItem[] };
        if (!response.ok || !payload.success || !payload.data?.length) throw new Error("MENU_LOAD_FAILED");
        return payload.data;
      })
      .then(items => {
        setMenus(items);
        setExpanded(current => current.length ? current : [items[0]?.id].filter(Boolean));
        sessionStorage.setItem(cacheKey, JSON.stringify(items));
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMenus(current => current.length ? current : fallbackMenus);
      })
      .finally(() => setMenuLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const active = menus.find(item => item.children?.some(child => isPathActive(pathname, child.path)))?.id;
    if (active) setExpanded(current => current.includes(active) ? current : [...current, active]);
  }, [menus, pathname]);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => () => { if (prefetchTimerRef.current !== null) window.clearTimeout(prefetchTimerRef.current); }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const role = user?.roles?.[0]?.name ?? user?.position ?? "岗位工作台";
  const allMenus = menus.length ? menus : fallbackMenus;
  const normalizedQuery = menuQuery.trim().toLocaleLowerCase();
  const visibleMenus = useMemo(() => {
    if (!normalizedQuery) return allMenus;
    return allMenus.flatMap(menu => {
      if (menu.name.toLocaleLowerCase().includes(normalizedQuery)) return [menu];
      const children = menu.children?.filter(child => child.name.toLocaleLowerCase().includes(normalizedQuery));
      return children?.length ? [{ ...menu, children }] : [];
    });
  }, [allMenus, normalizedQuery]);
  const activeRoot = useMemo(() => allMenus.find(item => isPathActive(pathname, item.path) || item.children?.some(child => isPathActive(pathname, child.path)))?.id, [allMenus, pathname]);

  const queuePrefetch = useCallback((path?: string) => {
    if (!path || warmedPathsRef.current.has(path)) return;
    if (prefetchTimerRef.current !== null) window.clearTimeout(prefetchTimerRef.current);
    prefetchTargetRef.current = path;
    prefetchTimerRef.current = window.setTimeout(() => {
      router.prefetch(path);
      warmedPathsRef.current.add(path);
      prefetchTimerRef.current = null;
      prefetchTargetRef.current = null;
    }, 120);
  }, [router]);

  const cancelPrefetch = useCallback((path?: string) => {
    if (!path || prefetchTargetRef.current !== path || prefetchTimerRef.current === null) return;
    window.clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = null;
    prefetchTargetRef.current = null;
  }, []);

  const navigate = useCallback((path?: string) => {
    if (!path) return;
    setMobileOpen(false);
    if (prefetchTimerRef.current !== null) window.clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = null;
    prefetchTargetRef.current = null;
    startNavigation(() => router.push(path));
  }, [router]);

  const toggle = (id: string) => setExpanded(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); sessionStorage.clear(); window.dispatchEvent(new Event("jhxt:auth-changed")); router.replace("/login"); };

  function renderContent(isCollapsed: boolean, mobile = false) {
    return <div className="relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_30%_0%,rgba(37,99,235,.12),transparent_68%)]" />
      <div className={`relative flex h-[72px] shrink-0 items-center border-b border-sidebar-border ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
        <button type="button" onClick={() => navigate("/dashboard/overview")} onPointerEnter={() => queuePrefetch("/dashboard/overview")} onPointerLeave={() => cancelPrefetch("/dashboard/overview")} className="flex min-w-0 items-center gap-3 text-left" aria-label="返回工作台">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-base font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,.28)] ring-1 ring-white/20">冀</span>
          {!isCollapsed && <span className="min-w-0"><span className="block truncate text-base font-semibold tracking-wide text-sidebar-foreground">冀慧学途</span><span className="mt-0.5 block truncate text-[0.625rem] font-medium uppercase tracking-[.2em] text-muted-foreground">Student Aid OS</span></span>}
        </button>
        {!isCollapsed && (mobile
          ? <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="关闭导航"><X className="h-4 w-4" /></button>
          : <button type="button" onClick={onToggle} className="rounded-xl border border-transparent p-2 text-muted-foreground transition hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="收起导航"><ChevronLeft className="h-4 w-4" /></button>)}
      </div>

      {!isCollapsed && <div className="relative mx-3 mt-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/65 px-3.5 py-3 shadow-sm"><div className="flex items-center gap-2.5"><span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-300"><Shield className="h-4 w-4" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-500" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-sidebar-foreground">{role}</p><p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">权限与数据范围已安全加载</p></div></div></div>}

      {!isCollapsed && <div className="relative px-3 pb-1 pt-3"><div className="flex h-10 items-center gap-2 rounded-xl border border-sidebar-border bg-background/65 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input value={menuQuery} onChange={event => setMenuQuery(event.target.value)} placeholder="搜索菜单" className="min-w-0 flex-1 bg-transparent text-sm text-sidebar-foreground outline-none placeholder:text-muted-foreground" aria-label="搜索菜单" />{menuQuery && <button type="button" onClick={() => setMenuQuery("")} className="rounded-md p-0.5 text-muted-foreground hover:text-sidebar-foreground" aria-label="清空搜索"><X className="h-3.5 w-3.5" /></button>}</div></div>}

      <nav className="relative mt-1 flex-1 overflow-y-auto px-3 pb-4" aria-label="主导航">
        {!isCollapsed && <div className="flex items-center justify-between px-2 pb-2 pt-2"><p className="text-[0.6875rem] font-semibold uppercase tracking-[.16em] text-muted-foreground">业务导航</p><span className="text-[0.625rem] text-muted-foreground">{visibleMenus.length}组</span></div>}
        {menuLoading && menus.length === 0 ? <div className="space-y-2 px-0.5 py-2">{[1,2,3,4,5].map(item => <div key={item} className="h-11 animate-pulse rounded-xl bg-sidebar-accent" />)}</div> : visibleMenus.length === 0 ? <div className="rounded-xl border border-dashed border-sidebar-border px-3 py-8 text-center text-sm text-muted-foreground">未找到匹配菜单</div> : visibleMenus.map(menu => {
          const hasChildren = Boolean(menu.children?.length);
          const isExpanded = expanded.includes(menu.id) || Boolean(normalizedQuery);
          const active = activeRoot === menu.id;
          const Icon = iconMap[menu.icon ?? ""] ?? FileText;
          return <div key={menu.id} className="mb-1.5">
            <button type="button" onPointerEnter={() => queuePrefetch(menu.path)} onPointerLeave={() => cancelPrefetch(menu.path)} onFocus={() => queuePrefetch(menu.path)} onClick={() => hasChildren ? toggle(menu.id) : navigate(menu.path)} title={isCollapsed ? menu.name : undefined} aria-expanded={hasChildren ? isExpanded : undefined} aria-current={active ? "page" : undefined} className={`group relative flex w-full items-center rounded-xl transition-all duration-150 ${isCollapsed ? "h-12 justify-center" : "min-h-11 gap-3 px-3 py-2.5"} ${active ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_9px_24px_rgba(37,99,235,.22)]" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-cyan-200" />}
              <Icon className={`h-5 w-5 shrink-0 transition ${active ? "text-white" : "text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-300"}`} />
              {!isCollapsed && <><span className="min-w-0 flex-1 truncate text-left text-[0.9375rem] font-medium leading-5">{menu.name}</span>{menu.badge && <span className={`rounded-lg px-2 py-0.5 text-[0.6875rem] font-semibold ${active ? "bg-white/15 text-white" : "bg-sidebar-accent text-muted-foreground"}`}>{menu.badge}</span>}{hasChildren && (isExpanded ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronRight className="h-4 w-4 opacity-70" />)}</>}
            </button>
            {!isCollapsed && hasChildren && isExpanded && <div className="relative ml-[22px] mt-1.5 space-y-1 border-l border-sidebar-border pl-3">{menu.children!.map(child => {
              const childActive = isPathActive(pathname, child.path);
              const ChildIcon = iconMap[child.icon ?? ""] ?? FileText;
              const childPath = child.path || "#";
              return <Link key={child.id} href={childPath} prefetch={false} onPointerEnter={() => queuePrefetch(child.path)} onPointerLeave={() => cancelPrefetch(child.path)} onFocus={() => queuePrefetch(child.path)} onClick={event => { event.preventDefault(); navigate(child.path); }} aria-current={childActive ? "page" : undefined} className={`group/child relative flex min-h-9 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${childActive ? "bg-blue-500/10 font-semibold text-blue-700 dark:text-blue-300" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                {childActive && <span className="absolute -left-[15px] h-4 w-0.5 rounded-full bg-blue-500" />}
                <ChildIcon className={`h-4 w-4 shrink-0 ${childActive ? "text-blue-600 dark:text-blue-300" : "text-muted-foreground group-hover/child:text-blue-600"}`} /><span className="min-w-0 flex-1 truncate">{child.name}</span>{child.badge && <span className="rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">{child.badge}</span>}
              </Link>;
            })}</div>}
          </div>;
        })}
      </nav>

      <div className="relative border-t border-sidebar-border bg-sidebar/80 p-3 backdrop-blur">
        {isCollapsed && <button type="button" onClick={onToggle} className="mb-1 flex h-11 w-full items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" title="展开导航" aria-label="展开导航"><ChevronRight className="h-5 w-5" /></button>}
        <button type="button" onClick={logout} className={`flex w-full items-center rounded-xl text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 ${isCollapsed ? "h-11 justify-center" : "min-h-11 gap-3 px-3 py-2.5"}`} title={isCollapsed ? "退出登录" : undefined}><LogOut className="h-[18px] w-[18px]" />{!isCollapsed && <span className="text-sm font-medium">安全退出</span>}</button>
      </div>
    </div>;
  }

  return <>
    {isNavigating && <div className="fixed inset-x-0 top-0 z-[110] h-0.5 overflow-hidden bg-blue-100 dark:bg-blue-950"><span className="navigation-progress-bar block h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" /></div>}
    {mobileOpen && <button type="button" className="fixed inset-0 z-40 cursor-default bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="关闭导航遮罩" />}
    <aside id="mobile-navigation" aria-hidden={!mobileOpen} className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,304px)] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-200 ease-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>{renderContent(false, true)}</aside>
    <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[4px_0_24px_rgba(15,23,42,.035)] transition-[width] duration-200 ease-out lg:block ${collapsed ? "w-[76px]" : "w-[292px]"}`}>{renderContent(collapsed)}</aside>
    <button type="button" onClick={() => setMobileOpen(current => !current)} className="fixed left-4 top-4 z-[70] flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_10px_30px_rgba(2,6,23,.22)] transition active:scale-95 lg:hidden" aria-label={mobileOpen ? "关闭导航" : "打开导航"} aria-expanded={mobileOpen} aria-controls="mobile-navigation">{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
  </>;
}

function isPathActive(pathname: string, path?: string) {
  if (!path) return false;
  const base = path.split("?")[0].split("#")[0];
  return pathname === base || (base !== "/" && pathname.startsWith(`${base}/`));
}
