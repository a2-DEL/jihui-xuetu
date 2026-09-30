"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpenCheck, Bot, CalendarClock, CheckCircle2, FileText, FolderKanban, Plus, RefreshCw, Scale, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type PolicyStatus = "draft" | "pending_approval" | "published" | "rejected" | "retired";
type ProjectStatus = "draft" | "pending_approval" | "active" | "rejected" | "suspended" | "closed";
type PolicyAction = "submit" | "approve" | "reject" | "retire";
type ProjectAction = "submit" | "approve" | "reject" | "suspend" | "reopen" | "close" | "adjust_quota";

interface Policy { id: string; code: string; name: string; category: string; authority: string; versionNo: string; status: PolicyStatus; summary: string; effectiveFrom: string; effectiveTo: string; sourceFileName: string; reviewComment?: string; version: number; updatedAt: string }
interface Project { id: string; code: string; policyId: string; name: string; category: string; academicYear: string; budgetAmount: number; defaultAmount: number; quota: number; usedQuota: number; applicationStart: string; applicationEnd: string; criteria: string; status: ProjectStatus; lastComment?: string; version: number; updatedAt: string }
interface Envelope<T> { success: boolean; data?: T; error?: string; message?: string }
interface PendingAction { kind: "policy" | "project"; id: string; version: number; action: PolicyAction | ProjectAction; title: string; name: string; currentQuota?: number }

const POLICY_STATUS: Record<PolicyStatus, { label: string; style: string }> = {
  draft: { label: "草稿", style: "border-slate-200 bg-slate-50 text-slate-600" },
  pending_approval: { label: "待业务审批", style: "border-amber-200 bg-amber-50 text-amber-700" },
  published: { label: "已发布", style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "已退回", style: "border-rose-200 bg-rose-50 text-rose-700" },
  retired: { label: "已终止", style: "border-slate-300 bg-slate-100 text-slate-600" },
};
const PROJECT_STATUS: Record<ProjectStatus, { label: string; style: string }> = {
  draft: { label: "草稿", style: "border-slate-200 bg-slate-50 text-slate-600" },
  pending_approval: { label: "待业务审批", style: "border-amber-200 bg-amber-50 text-amber-700" },
  active: { label: "运行中", style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "已退回", style: "border-rose-200 bg-rose-50 text-rose-700" },
  suspended: { label: "已暂停", style: "border-orange-200 bg-orange-50 text-orange-700" },
  closed: { label: "已关闭", style: "border-slate-300 bg-slate-100 text-slate-600" },
};

function authHeaders(extra?: Record<string, string>): HeadersInit { const token = window.localStorage.getItem("token"); return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }; }
function currentRole(): string { try { const user = JSON.parse(window.localStorage.getItem("user") ?? "{}") as { role?: string; roles?: Array<{ code?: string }> }; return user.roles?.[0]?.code ?? user.role ?? ""; } catch { return ""; } }
function idempotency(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

const emptyPolicy = { code: "", name: "", category: "国家资助", authority: "", versionNo: "V1.0", summary: "", effectiveFrom: "2026-09-01", effectiveTo: "2027-08-31", sourceFileName: "" };
const emptyProject = { code: "", policyId: "", name: "", category: "国家助学金", academicYear: "2026-2027", budgetAmount: "", defaultAmount: "", quota: "", applicationStart: "2026-08-20", applicationEnd: "2026-09-20", criteria: "" };

export default function FundingManagementPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState(emptyPolicy);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [comment, setComment] = useState("");
  const [quota, setQuota] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [policyResponse, projectResponse] = await Promise.all([fetch("/api/funding/policies", { headers: authHeaders(), cache: "no-store" }), fetch("/api/funding/projects", { headers: authHeaders(), cache: "no-store" })]);
      const [policyBody, projectBody] = await Promise.all([policyResponse.json() as Promise<Envelope<Policy[]>>, projectResponse.json() as Promise<Envelope<Project[]>>]);
      if (!policyResponse.ok || !policyBody.success) throw new Error(policyBody.error ?? "政策数据加载失败");
      if (!projectResponse.ok || !projectBody.success) throw new Error(projectBody.error ?? "项目数据加载失败");
      setPolicies(policyBody.data ?? []); setProjects(projectBody.data ?? []);
    } catch (reason) { setMessage({ type: "error", text: reason instanceof Error ? reason.message : "资助配置数据加载失败" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setRole(currentRole()); void load(); }, [load]);

  const metrics = useMemo(() => ({
    publishedPolicies: policies.filter((item) => item.status === "published").length,
    activeProjects: projects.filter((item) => item.status === "active").length,
    budget: projects.filter((item) => item.status === "active").reduce((sum, item) => sum + item.budgetAmount, 0),
    availableQuota: projects.filter((item) => item.status === "active").reduce((sum, item) => sum + Math.max(0, item.quota - item.usedQuota), 0),
  }), [policies, projects]);

  const createPolicy = async () => {
    setSubmitting(true); setMessage(null);
    try {
      const response = await fetch("/api/funding/policies", { method: "POST", headers: authHeaders({ "Idempotency-Key": idempotency("create-policy") }), body: JSON.stringify(policyForm) });
      const body = await response.json() as Envelope<Policy>;
      if (!response.ok || !body.success) throw new Error(body.error ?? "政策创建失败");
      setMessage({ type: "success", text: body.message ?? "政策草稿已创建" }); setPolicyOpen(false); setPolicyForm(emptyPolicy); await load();
    } catch (reason) { setMessage({ type: "error", text: reason instanceof Error ? reason.message : "政策创建失败" }); }
    finally { setSubmitting(false); }
  };

  const createProject = async () => {
    setSubmitting(true); setMessage(null);
    try {
      const response = await fetch("/api/funding/projects", { method: "POST", headers: authHeaders({ "Idempotency-Key": idempotency("create-project") }), body: JSON.stringify({ ...projectForm, budgetAmount: Number(projectForm.budgetAmount), defaultAmount: Number(projectForm.defaultAmount), quota: Number(projectForm.quota) }) });
      const body = await response.json() as Envelope<Project>;
      if (!response.ok || !body.success) throw new Error(body.error ?? "项目创建失败");
      setMessage({ type: "success", text: body.message ?? "项目草稿已创建" }); setProjectOpen(false); setProjectForm(emptyProject); await load();
    } catch (reason) { setMessage({ type: "error", text: reason instanceof Error ? reason.message : "项目创建失败" }); }
    finally { setSubmitting(false); }
  };

  const executeAction = async () => {
    if (!pending || comment.trim().length < 2) return;
    setSubmitting(true); setMessage(null);
    try {
      const endpoint = pending.kind === "policy" ? `/api/funding/policies/${pending.id}/actions` : `/api/funding/projects/${pending.id}/actions`;
      const response = await fetch(endpoint, { method: "POST", headers: authHeaders({ "Idempotency-Key": idempotency(`${pending.kind}-${pending.action}`) }), body: JSON.stringify({ action: pending.action, expectedVersion: pending.version, comment: comment.trim(), humanConfirmed: true, ...(pending.action === "adjust_quota" ? { quota: Number(quota) } : {}) }) });
      const body = await response.json() as Envelope<unknown>;
      if (!response.ok || !body.success) throw new Error(body.error ?? "操作失败");
      setMessage({ type: "success", text: body.message ?? "业务操作已完成" }); setPending(null); setComment(""); setQuota(""); await load();
    } catch (reason) { setMessage({ type: "error", text: reason instanceof Error ? reason.message : "操作失败" }); }
    finally { setSubmitting(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-700"><ShieldCheck className="h-4 w-4" />政策版本控制 · 项目预算校验 · 职责分离 · 全程审计</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">政策与资助项目管理中心</h1><p className="mt-1 text-sm text-slate-500">政策先审批发布，项目再提交启用；AI可辅助起草和校验，但不能替代人工发布与审批。</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</Button><Button variant="outline" onClick={() => router.push("/ai-assistant/chat?scene=policy-drafting")}><Bot className="mr-2 h-4 w-4" />AI政策助手</Button>{role === "FUND_ADMIN" && <><Button variant="outline" onClick={() => setPolicyOpen(true)}><Plus className="mr-2 h-4 w-4" />起草政策</Button><Button onClick={() => { setProjectForm({ ...emptyProject, policyId: policies.find((item) => item.status === "published")?.id ?? "" }); setProjectOpen(true); }}><Plus className="mr-2 h-4 w-4" />创建项目</Button></>}</div></div>

    {message && <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{message.text}</div>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric icon={BookOpenCheck} label="有效政策" value={metrics.publishedPolicies.toString()} detail="当前校区已发布" tone="blue" /><Metric icon={FolderKanban} label="运行中项目" value={metrics.activeProjects.toString()} detail="可受理申请" tone="emerald" /><Metric icon={WalletCards} label="运行项目预算" value={`¥${metrics.budget.toLocaleString("zh-CN")}`} detail="预算约束已启用" tone="violet" /><Metric icon={UsersRound} label="剩余名额" value={metrics.availableQuota.toLocaleString("zh-CN")} detail="按项目实时汇总" tone="amber" /></div>

    <Tabs defaultValue="projects" className="space-y-4"><TabsList><TabsTrigger value="projects">资助项目</TabsTrigger><TabsTrigger value="policies">政策文件</TabsTrigger><TabsTrigger value="controls">规则与控制</TabsTrigger></TabsList>
      <TabsContent value="projects"><ProjectTable projects={projects} policies={policies} role={role} loading={loading} onAction={(action) => { setPending(action); setComment(""); setQuota(action.currentQuota?.toString() ?? ""); }} /></TabsContent>
      <TabsContent value="policies"><PolicyTable policies={policies} role={role} loading={loading} onAction={(action) => { setPending(action); setComment(""); }} /></TabsContent>
      <TabsContent value="controls"><ControlsPanel /></TabsContent>
    </Tabs>

    <Dialog open={policyOpen} onOpenChange={(open) => { if (!submitting) setPolicyOpen(open); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>起草资助政策</DialogTitle><DialogDescription>创建后仅为草稿，必须由资助中心领导独立审批后才能发布。</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="政策编码"><Input value={policyForm.code} onChange={(event) => setPolicyForm({ ...policyForm, code: event.target.value })} placeholder="POL-2026-XXX" /></Field><Field label="版本号"><Input value={policyForm.versionNo} onChange={(event) => setPolicyForm({ ...policyForm, versionNo: event.target.value })} /></Field><Field label="政策名称" wide><Input value={policyForm.name} onChange={(event) => setPolicyForm({ ...policyForm, name: event.target.value })} /></Field><Field label="政策类别"><Input value={policyForm.category} onChange={(event) => setPolicyForm({ ...policyForm, category: event.target.value })} /></Field><Field label="发文/主管单位"><Input value={policyForm.authority} onChange={(event) => setPolicyForm({ ...policyForm, authority: event.target.value })} /></Field><Field label="生效日期"><Input type="date" value={policyForm.effectiveFrom} onChange={(event) => setPolicyForm({ ...policyForm, effectiveFrom: event.target.value })} /></Field><Field label="失效日期"><Input type="date" value={policyForm.effectiveTo} onChange={(event) => setPolicyForm({ ...policyForm, effectiveTo: event.target.value })} /></Field><Field label="来源文件" wide><Input value={policyForm.sourceFileName} onChange={(event) => setPolicyForm({ ...policyForm, sourceFileName: event.target.value })} placeholder="政策正文.pdf / 修订稿.docx" /></Field><Field label="政策摘要" wide><Textarea value={policyForm.summary} onChange={(event) => setPolicyForm({ ...policyForm, summary: event.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => setPolicyOpen(false)} disabled={submitting}>取消</Button><Button onClick={() => void createPolicy()} disabled={submitting}>{submitting ? "创建中…" : "保存草稿"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={projectOpen} onOpenChange={(open) => { if (!submitting) setProjectOpen(open); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>创建资助项目</DialogTitle><DialogDescription>预算、发放标准与名额将进行确定性一致性校验。</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="项目编码"><Input value={projectForm.code} onChange={(event) => setProjectForm({ ...projectForm, code: event.target.value })} placeholder="PRJ-2026-XXX" /></Field><Field label="学年"><Input value={projectForm.academicYear} onChange={(event) => setProjectForm({ ...projectForm, academicYear: event.target.value })} /></Field><Field label="项目名称" wide><Input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} /></Field><Field label="关联政策" wide><Select value={projectForm.policyId} onValueChange={(value) => setProjectForm({ ...projectForm, policyId: value })}><SelectTrigger><SelectValue placeholder="请选择政策" /></SelectTrigger><SelectContent>{policies.map((policy) => <SelectItem key={policy.id} value={policy.id}>{policy.name}（{POLICY_STATUS[policy.status].label}）</SelectItem>)}</SelectContent></Select></Field><Field label="项目类别"><Input value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })} /></Field><Field label="项目预算（元）"><Input type="number" value={projectForm.budgetAmount} onChange={(event) => setProjectForm({ ...projectForm, budgetAmount: event.target.value })} /></Field><Field label="默认标准（元/人）"><Input type="number" value={projectForm.defaultAmount} onChange={(event) => setProjectForm({ ...projectForm, defaultAmount: event.target.value })} /></Field><Field label="计划名额"><Input type="number" value={projectForm.quota} onChange={(event) => setProjectForm({ ...projectForm, quota: event.target.value })} /></Field><Field label="申请开始"><Input type="date" value={projectForm.applicationStart} onChange={(event) => setProjectForm({ ...projectForm, applicationStart: event.target.value })} /></Field><Field label="申请结束"><Input type="date" value={projectForm.applicationEnd} onChange={(event) => setProjectForm({ ...projectForm, applicationEnd: event.target.value })} /></Field><Field label="申请与认定条件" wide><Textarea value={projectForm.criteria} onChange={(event) => setProjectForm({ ...projectForm, criteria: event.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => setProjectOpen(false)} disabled={submitting}>取消</Button><Button onClick={() => void createProject()} disabled={submitting}>{submitting ? "创建中…" : "保存草稿"}</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={Boolean(pending)} onOpenChange={(open) => { if (!open && !submitting) setPending(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{pending?.title ?? "确认业务操作"}</AlertDialogTitle><AlertDialogDescription>对象：{pending?.name}。该操作将改变正式业务状态，系统会校验角色、状态、版本与幂等键，并写入审计证据。</AlertDialogDescription></AlertDialogHeader>{pending?.action === "adjust_quota" && <Field label="调整后名额"><Input type="number" value={quota} onChange={(event) => setQuota(event.target.value)} /></Field>}<Field label="人工处理意见"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="请输入2—500字的明确处理依据" maxLength={500} /></Field><AlertDialogFooter><AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void executeAction(); }} disabled={submitting || comment.trim().length < 2 || (pending?.action === "adjust_quota" && !Number.isInteger(Number(quota)))}>{submitting ? "处理中…" : "人工确认并提交"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <div className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>; }
function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof FileText; label: string; value: string; detail: string; tone: "blue" | "emerald" | "violet" | "amber" }) { const colors = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700" }; return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className={`rounded-xl p-3 ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div></CardContent></Card>; }

function policyActions(role: string, policy: Policy): PendingAction[] { const make = (action: PolicyAction, title: string): PendingAction => ({ kind: "policy", id: policy.id, version: policy.version, action, title, name: policy.name }); if (role === "FUND_ADMIN" && ["draft", "rejected"].includes(policy.status)) return [make("submit", "提交政策审批")]; if (role === "FUND_LEADER" && policy.status === "pending_approval") return [make("approve", "批准并发布政策"), make("reject", "退回政策修订")]; if (role === "FUND_LEADER" && policy.status === "published") return [make("retire", "终止政策")]; return []; }
function projectActions(role: string, project: Project): PendingAction[] { const make = (action: ProjectAction, title: string): PendingAction => ({ kind: "project", id: project.id, version: project.version, action, title, name: project.name, currentQuota: project.quota }); if (role === "FUND_ADMIN" && ["draft", "rejected"].includes(project.status)) return [make("submit", "提交项目审批"), make("adjust_quota", "调整项目名额")]; if (role === "FUND_ADMIN" && ["active", "suspended"].includes(project.status)) return [make("adjust_quota", "调整项目名额"), make("close", "关闭项目")]; if (role === "FUND_LEADER" && project.status === "pending_approval") return [make("approve", "批准并启用项目"), make("reject", "退回项目修订")]; if (role === "FUND_LEADER" && project.status === "active") return [make("suspend", "暂停项目")]; if (role === "FUND_LEADER" && project.status === "suspended") return [make("reopen", "恢复项目")]; return []; }

function PolicyTable({ policies, role, loading, onAction }: { policies: Policy[]; role: string; loading: boolean; onAction: (action: PendingAction) => void }) { return <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardTitle className="text-base">政策版本库</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>政策 / 版本</TableHead><TableHead>发文单位</TableHead><TableHead>有效期</TableHead><TableHead>来源文件</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6} className="h-28 text-center">加载中…</TableCell></TableRow> : policies.map((policy) => { const actions = policyActions(role, policy); return <TableRow key={policy.id}><TableCell className="max-w-sm"><p className="font-medium text-slate-900">{policy.name}</p><p className="mt-1 font-mono text-xs text-slate-400">{policy.code} · {policy.versionNo} · 数据v{policy.version}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{policy.summary}</p></TableCell><TableCell><p className="text-sm text-slate-700">{policy.authority}</p><p className="mt-1 text-xs text-slate-400">{policy.category}</p></TableCell><TableCell className="text-xs text-slate-600">{policy.effectiveFrom}<br />至 {policy.effectiveTo}</TableCell><TableCell className="max-w-48 truncate text-xs text-blue-700">{policy.sourceFileName}</TableCell><TableCell><Badge variant="outline" className={POLICY_STATUS[policy.status].style}>{POLICY_STATUS[policy.status].label}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{actions.length ? actions.map((action) => <Button key={action.action} size="sm" variant="outline" onClick={() => onAction(action)}>{action.title}</Button>) : <span className="text-xs text-slate-400">只读</span>}</div></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>; }

function ProjectTable({ projects, policies, role, loading, onAction }: { projects: Project[]; policies: Policy[]; role: string; loading: boolean; onAction: (action: PendingAction) => void }) { const policyMap = new Map(policies.map((item) => [item.id, item])); return <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardTitle className="text-base">资助项目运行台账</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>项目</TableHead><TableHead>政策依据</TableHead><TableHead>预算 / 标准</TableHead><TableHead>名额使用</TableHead><TableHead>申报期</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={7} className="h-28 text-center">加载中…</TableCell></TableRow> : projects.map((project) => { const actions = projectActions(role, project); const usage = project.quota ? Math.round((project.usedQuota / project.quota) * 100) : 0; return <TableRow key={project.id}><TableCell className="max-w-xs"><p className="font-medium text-slate-900">{project.name}</p><p className="mt-1 font-mono text-xs text-slate-400">{project.code} · {project.academicYear} · v{project.version}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.criteria}</p></TableCell><TableCell className="max-w-52"><p className="truncate text-sm text-slate-700">{policyMap.get(project.policyId)?.name ?? "未找到政策"}</p><p className="mt-1 text-xs text-slate-400">{project.category}</p></TableCell><TableCell><p className="font-semibold text-slate-800">¥{project.budgetAmount.toLocaleString("zh-CN")}</p><p className="mt-1 text-xs text-slate-400">¥{project.defaultAmount.toLocaleString("zh-CN")} / 人</p></TableCell><TableCell><div className="w-36"><div className="mb-1 flex justify-between text-xs"><span>{project.usedQuota} / {project.quota}</span><span>{usage}%</span></div><Progress value={usage} className="h-1.5" /><p className="mt-1 text-xs text-slate-400">剩余 {Math.max(0, project.quota - project.usedQuota)}</p></div></TableCell><TableCell className="text-xs text-slate-600">{project.applicationStart}<br />至 {project.applicationEnd}</TableCell><TableCell><Badge variant="outline" className={PROJECT_STATUS[project.status].style}>{PROJECT_STATUS[project.status].label}</Badge></TableCell><TableCell><div className="flex max-w-64 flex-wrap justify-end gap-2">{actions.length ? actions.map((action) => <Button key={action.action} size="sm" variant="outline" onClick={() => onAction(action)}>{action.title}</Button>) : <span className="text-xs text-slate-400">只读</span>}</div></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>; }

function ControlsPanel() { return <div className="grid gap-4 lg:grid-cols-3"><Control icon={Scale} title="确定性预算校验" text="项目名额 × 默认标准不得突破项目预算；名额不得低于已使用数。该规则由程序执行，不交给模型判断。" /><Control icon={ShieldCheck} title="职责分离（SoD）" text="资助管理员负责起草和提交，资助中心领导独立审批发布；所有正式变更要求人工确认。" /><Control icon={CalendarClock} title="版本与有效期" text="每次状态变更都执行乐观锁版本校验，并保留政策来源文件、有效期、审批意见和审计快照。" /></div>; }
function Control({ icon: Icon, title, text }: { icon: typeof Scale; title: string; text: string }) { return <Card className="border-slate-200 shadow-sm"><CardContent className="p-6"><span className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><Icon className="h-5 w-5" /></span><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><div className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />已在服务端规则中启用</div></CardContent></Card>; }


