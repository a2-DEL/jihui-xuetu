"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Bot, ChevronDown, Command, LifeBuoy, LogOut, Search, Settings, ShieldCheck, User, X } from "lucide-react";

interface StoredUser { username?: string; realName?: string; position?: string; roles?: Array<{ code?: string; name?: string }> }
const pageNames: Record<string, string> = { dashboard: "角色驾驶舱", "role-workbench": "岗位功能全景", "data-governance": "数据治理", "access-control": "九维权限控制", funding: "资助业务中枢", application: "资助申请", approval: "审核审批", "bank-cooperation": "银校协同", auditor: "监督审计", governance: "监管治理", agent: "AI运行治理", knowledge: "知识与RAG", student: "学生服务", system: "平台运维", "platform-governance": "平台治理", "student-affairs": "资助育人", finance: "资金执行", "ai-control-plane": "AI安全控制平面", "decision-center": "校级决策中心", "frontline-center": "资助协同作战室", "user-management": "组织与权限", report: "报表分析", notification: "消息中心", settings: "设置" };

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [search, setSearch] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => { try { const raw = localStorage.getItem("user"); setUser(raw ? JSON.parse(raw) as StoredUser : null); } catch { setUser(null); } }, []);
  useEffect(() => { const close = (event: MouseEvent) => { if (!containerRef.current?.contains(event.target as Node)) { setUserOpen(false); setNoticeOpen(false); } }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);

  const currentSection = useMemo(() => pageNames[pathname.split("/").filter(Boolean)[0] ?? ""] ?? "业务工作台", [pathname]);
  const roleName = user?.roles?.[0]?.name ?? user?.position ?? "未识别岗位";
  const submitSearch = () => { const value = search.trim(); if (value) router.push(`/search?keyword=${encodeURIComponent(value)}`); };
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.dispatchEvent(new Event("jhxt:auth-changed")); router.replace("/login"); };

  return <header ref={containerRef} className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-card/90 px-5 backdrop-blur-xl dark:bg-card/90 lg:px-7">
    <div className="min-w-0 pl-12 lg:pl-0"><div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.16em] text-slate-400"><span>冀慧学途</span><span className="text-slate-300">/</span><span>{currentSection}</span></div><h1 className="mt-1 truncate text-[15px] font-semibold text-foreground">{currentSection}</h1></div>

    <div className="flex items-center gap-2.5">
      <div className="hidden h-10 w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 xl:flex"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === "Enter" && submitSearch()} placeholder="搜索申请、学生、政策或任务" className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" /><span className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400"><Command className="h-2.5 w-2.5" />K</span></div>

      <button onClick={() => router.push("/ai-assistant/chat")} className="hidden h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 md:flex"><Bot className="h-4 w-4 text-cyan-300" />小海豚助手</button>
      <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-700 lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />模拟环境</div>

      <div className="relative"><button onClick={() => { setNoticeOpen(value => !value); setUserOpen(false); }} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" aria-label="消息通知"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></button>{noticeOpen && <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.18)]"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-sm font-semibold text-slate-800">待办与通知</p><p className="text-[10px] text-slate-400">按当前岗位授权范围</p></div><button onClick={() => setNoticeOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button></div><div className="p-2"><Notice tone="amber" title="3项业务待办即将超时" text="建议进入岗位工作台核查处理时限" /><Notice tone="blue" title="资助政策版本已更新" text="知识库索引与引用版本已同步" /><Notice tone="emerald" title="昨日银行回盘对账完成" text="应发、实发金额及人次一致" /></div><button onClick={() => router.push("/notification/center")} className="w-full border-t border-slate-100 py-3 text-xs font-medium text-blue-700 hover:bg-blue-50">进入消息中心</button></div>}</div>

      <div className="relative"><button onClick={() => { setUserOpen(value => !value); setNoticeOpen(false); }} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 pr-3 transition hover:border-blue-200 hover:bg-blue-50"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white"><User className="h-3.5 w-3.5" /></span><span className="hidden max-w-28 text-left lg:block"><span className="block truncate text-[11px] font-semibold text-slate-700">{user?.realName ?? "用户"}</span><span className="block truncate text-[9px] text-slate-400">{roleName}</span></span><ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 lg:block" /></button>{userOpen && <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.18)]"><div className="border-b border-slate-100 bg-slate-50/70 p-4"><p className="text-sm font-semibold text-slate-800">{user?.realName}</p><p className="mt-1 text-[10px] text-slate-400">{user?.username} · {roleName}</p><div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-700"><ShieldCheck className="h-3 w-3" />安全会话有效</div></div><div className="p-1.5"><MenuButton icon={User} label="个人中心" onClick={() => router.push("/profile")} /><MenuButton icon={Settings} label="账号与偏好" onClick={() => router.push("/settings")} /><MenuButton icon={LifeBuoy} label="帮助与反馈" onClick={() => router.push("/ai-assistant/chat")} /></div><div className="border-t border-slate-100 p-1.5"><MenuButton icon={LogOut} label="安全退出" danger onClick={logout} /></div></div>}</div>
    </div>
  </header>;
}

function Notice({ tone, title, text }: { tone: "amber" | "blue" | "emerald"; title: string; text: string }) { const colors = { amber: "bg-amber-500", blue: "bg-blue-500", emerald: "bg-emerald-500" }; return <div className="flex gap-3 rounded-xl p-3 transition hover:bg-slate-50"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[tone]}`} /><div><p className="text-xs font-medium text-slate-700">{title}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{text}</p></div></div>; }
function MenuButton({ icon: Icon, label, danger = false, onClick }: { icon: typeof User; label: string; danger?: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition ${danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</button>; }




