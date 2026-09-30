"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Bot, CheckCircle2, Database, Eye, EyeOff, Fingerprint, GraduationCap, Landmark, LockKeyhole, Network, ShieldCheck, Sparkles, UsersRound, Workflow } from "lucide-react";

const ROLES = [
  { role: "系统管理员", username: "sys_admin", group: "平台" }, { role: "AI运维", username: "ai_ops", group: "平台" },
  { role: "校领导", username: "school_leader", group: "校级" }, { role: "资助领导", username: "fund_leader", group: "校级" },
  { role: "学工部", username: "stu_affairs", group: "校级" }, { role: "资助中心", username: "fund_admin", group: "校级" },
  { role: "校级财务", username: "finance", group: "校级" }, { role: "院系管理员", username: "dept_admin", group: "院系" },
  { role: "辅导员", username: "counselor", group: "院系" }, { role: "学生", username: "student", group: "服务" },
  { role: "银行", username: "bank_staff", group: "协同" }, { role: "第三方审计", username: "audit_external", group: "监督" },
  { role: "教育厅监管", username: "edu_bureau", group: "监督" }, { role: "审计人员", username: "auditor", group: "监督" },
  { role: "纪检人员", username: "discipline", group: "监督" }, { role: "数据管理员", username: "data_admin", group: "治理" },
  { role: "舆情管理员", username: "public_opinion", group: "治理" },
] as const;

const CAPABILITIES = [
  { icon: Bot, title: "角色专属 Agent 团队", text: "总调度、专业Agent与人机回环协同" },
  { icon: ShieldCheck, title: "九维权限与确定性护栏", text: "组织、数据、流程、字段、AI风险联合判定" },
  { icon: Network, title: "资助全流程协同", text: "申请、认定、公示、发放、银行、监管全链路" },
  { icon: Database, title: "可追溯知识与审计", text: "RAG引用、证据快照与不可抵赖操作留痕" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewTarget, setPreviewTarget] = useState("");

  const authenticate = async (loginUsername: string, loginPassword: string, targetPath?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setPreviewTarget(targetPath ?? "");
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }) });
      const data = await response.json() as { success?: boolean; data?: { token: string; user: { id?: string; landingPath?: string } }; error?: string; message?: string };
      if (!response.ok || !data.success || !data.data) throw new Error(data.error ?? data.message ?? "登录失败");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      window.dispatchEvent(new Event("jhxt:auth-changed"));
      let preferredHome = "";
      try {
        const saved = JSON.parse(localStorage.getItem(`jhxt-interface-preferences:${data.data.user.id ?? ""}`) ?? "null") as { homepage?: string } | null;
        if (saved?.homepage && ["/dashboard/overview", "/application/all", "/student/portal"].includes(saved.homepage)) preferredHome = saved.homepage;
      } catch { preferredHome = ""; }
      router.replace(targetPath || preferredHome || data.data.user.landingPath || "/dashboard/overview");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "网络异常，请稍后重试");
      setPreviewTarget("");
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await authenticate(username, password);
  };

  const startGuidedPreview = async (path: string) => {
    setUsername("fund_admin");
    setPassword("Demo@123");
    await authenticate("fund_admin", "Demo@123", path);
  };
  // Never expose demo account selectors or guided login in a production client bundle.
  // Remain unavailable until a real IdP login page and server-managed session are integrated.
  if (process.env.NODE_ENV === "production") return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><section className="max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8" role="alert"><h1 className="text-xl font-bold">生产身份认证尚未配置</h1><p className="mt-4 text-sm leading-7 text-slate-300">当前环境不提供演示账号登录；请先对接学校统一身份认证和服务端会话，再开放业务访问。不要使用真实学生信息或真实资金执行演示操作。</p></section></main>;
  return <main className="relative min-h-screen overflow-x-hidden bg-[#07111f] text-white">
    <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(rgba(94,160,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(94,160,255,.06) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
    <div className="pointer-events-none absolute -left-40 top-[-260px] h-[720px] w-[720px] rounded-full bg-blue-600/20 blur-[140px]" />
    <div className="pointer-events-none absolute bottom-[-320px] right-[-120px] h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[150px]" />

    <div className="relative mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[minmax(0,1.35fr)_minmax(440px,.65fr)]">
      <section className="hidden min-h-screen flex-col justify-between border-r border-white/8 px-12 py-10 lg:flex xl:px-20 xl:py-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-300/25 bg-blue-500/15 text-lg font-bold shadow-[0_0_35px_rgba(37,99,235,.28)]">冀</span><div><p className="text-base font-semibold tracking-wide">冀慧学途</p><p className="text-[11px] uppercase tracking-[.25em] text-blue-200/55">JIHUI STUDENT AID OS</p></div></div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/8 px-3 py-1.5 text-xs text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />模拟数据 · 真实机制</div>
        </div>

        <div className="max-w-4xl py-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/8 px-4 py-2 text-xs font-medium text-blue-100"><Sparkles className="h-3.5 w-3.5" />人工决策 · AI协同 · 全程可审计</div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.18] tracking-[-.03em] xl:text-[56px]">校园资助数智化<br /><span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">协同护航平台</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300/75">面向学校、院系、学生、银行与监管机构的企业级资助业务操作系统。让AI技术隐于业务背后，让每次判断、流转和资金操作都有权限、有依据、可回溯。</p>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">{CAPABILITIES.map(({ icon: Icon, title, text }) => <div key={title} className="group rounded-2xl border border-white/8 bg-white/[.035] p-4 backdrop-blur transition hover:border-blue-300/20 hover:bg-blue-400/[.06]"><div className="flex items-start gap-3"><span className="rounded-xl border border-blue-300/10 bg-blue-400/10 p-2 text-blue-200"><Icon className="h-4 w-4" /></span><div><h2 className="text-sm font-medium text-slate-100">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div></div></div>)}</div>

          <div className="mt-9 grid max-w-3xl grid-cols-4 divide-x divide-white/8 rounded-2xl border border-white/8 bg-black/10 py-4 backdrop-blur">
            <Stat value="17" label="独立角色" /><Stat value="9维" label="授权判定" /><Stat value="L0-L5" label="AI风险分级" /><Stat value="P0-P5" label="数据分级" />
          </div>
          <div className="mt-4 grid max-w-3xl gap-2 sm:grid-cols-3">
            <PreviewButton icon={GraduationCap} title="资助体系总览" path="/platform-tour" loading={isLoading && previewTarget === "/platform-tour"} onOpen={startGuidedPreview} />
            <PreviewButton icon={UsersRound} title="17角色协作全景" path="/platform-tour/roles" loading={isLoading && previewTarget === "/platform-tour/roles"} onOpen={startGuidedPreview} />
            <PreviewButton icon={Workflow} title="核心流程全景" path="/platform-tour/process" loading={isLoading && previewTarget === "/platform-tour/process"} onOpen={startGuidedPreview} />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500"><span>冀慧学途 · 校园资助数智化协同护航平台</span><div className="flex gap-5"><span className="flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" />传输加密</span><span className="flex items-center gap-1.5"><Fingerprint className="h-3 w-3" />身份鉴别</span><span className="flex items-center gap-1.5"><Activity className="h-3 w-3" />操作审计</span></div></div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12">
        <div className="w-full max-w-[520px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">冀</span><div><p className="font-semibold">冀慧学途</p><p className="text-xs text-slate-400">校园资助数智化协同护航平台</p></div></div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 shadow-[0_30px_100px_rgba(0,0,0,.4)] backdrop-blur-2xl sm:p-8">
            <div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-[.2em] text-blue-300/70">Secure Workspace</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">登录业务工作台</h2><p className="mt-2 text-sm text-slate-400">系统将按岗位自动加载菜单、Agent团队与数据范围。</p></div><span className="rounded-xl border border-blue-300/10 bg-blue-500/10 p-3 text-blue-200"><Landmark className="h-5 w-5" /></span></div>

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">账号</span><div className="flex items-center rounded-xl border border-white/10 bg-white/[.045] px-3 transition focus-within:border-blue-400/70 focus-within:ring-4 focus-within:ring-blue-500/10"><UsersRound className="h-4 w-4 text-slate-500" /><input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="请输入岗位账号" className="h-12 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600" /></div></label>
              <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">密码</span><div className="flex items-center rounded-xl border border-white/10 bg-white/[.045] px-3 transition focus-within:border-blue-400/70 focus-within:ring-4 focus-within:ring-blue-500/10"><LockKeyhole className="h-4 w-4 text-slate-500" /><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="请输入密码" className="h-12 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600" /><button type="button" onClick={() => setShowPassword(value => !value)} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200" aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/8 px-3 py-2.5 text-xs text-rose-200">{error}</div>}
              <button type="submit" disabled={isLoading || !username || !password} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-semibold shadow-[0_12px_35px_rgba(37,99,235,.28)] transition hover:from-blue-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />正在建立安全会话…</> : <>进入工作台<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}</button>
            </form>

            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-white/8" /><span className="text-[11px] text-slate-500">演示岗位快速选择</span><span className="h-px flex-1 bg-white/8" /></div>
            <div className="max-h-[220px] overflow-y-auto pr-1"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{ROLES.map(item => <button key={item.username} type="button" onClick={() => { setUsername(item.username); setPassword("Demo@123"); setError(""); }} className={`rounded-xl border px-3 py-2.5 text-left transition ${username === item.username ? "border-blue-400/60 bg-blue-500/15 text-blue-100" : "border-white/7 bg-white/[.025] text-slate-400 hover:border-white/15 hover:bg-white/[.05] hover:text-slate-200"}`}><span className="block truncate text-xs font-medium">{item.role}</span><span className="mt-1 block text-[9px] uppercase tracking-wider text-slate-600">{item.group}</span></button>)}</div></div>
            <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[.045] px-3 py-2.5"><div className="flex items-center justify-between text-[10px] text-emerald-200/80"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" />服务运行正常</span><span>演示密码：Demo@123</span></div><p className="mt-2 border-t border-emerald-400/10 pt-2 text-[9px] leading-4 text-emerald-100/55">仅使用脱敏构造的模拟数据；业务流转、Agent调用、权限校验与审计机制真实运行。</p></div>
            <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden"><PreviewButton icon={GraduationCap} title="资助总览" path="/platform-tour" loading={isLoading && previewTarget === "/platform-tour"} onOpen={startGuidedPreview} compact /><PreviewButton icon={UsersRound} title="角色全景" path="/platform-tour/roles" loading={isLoading && previewTarget === "/platform-tour/roles"} onOpen={startGuidedPreview} compact /><PreviewButton icon={Workflow} title="流程全景" path="/platform-tour/process" loading={isLoading && previewTarget === "/platform-tour/process"} onOpen={startGuidedPreview} compact /></div>
          </div>
          <p className="mt-5 text-center text-[10px] leading-5 text-slate-600">本演示环境不承载任何真实学生敏感数据。正式部署须接入统一身份认证、MFA与企业密钥管理。</p>
        </div>
      </section>
    </div>
  </main>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="px-4 text-center"><p className="text-lg font-semibold text-slate-100">{value}</p><p className="mt-1 text-[10px] tracking-wide text-slate-500">{label}</p></div>; }

function PreviewButton({ icon: Icon, title, path, loading, onOpen, compact = false }: { icon: typeof GraduationCap; title: string; path: string; loading: boolean; onOpen: (path: string) => Promise<void>; compact?: boolean }) {
  return <button type="button" disabled={loading} onClick={() => void onOpen(path)} className={`group flex items-center rounded-xl border border-white/8 bg-white/[.035] text-left text-slate-300 transition hover:border-blue-300/25 hover:bg-blue-400/[.08] hover:text-white disabled:opacity-60 ${compact ? "flex-col justify-center gap-1.5 px-2 py-2" : "gap-3 px-3.5 py-3"}`}><span className={`flex shrink-0 items-center justify-center rounded-lg bg-blue-500/12 text-blue-200 ${compact ? "h-7 w-7" : "h-8 w-8"}`}>{loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200/30 border-t-blue-200" /> : <Icon className="h-3.5 w-3.5" />}</span><span className={`${compact ? "text-[9px] text-center" : "text-xs"} font-semibold`}>{title}</span>{!compact && <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-200" />}</button>;
}

