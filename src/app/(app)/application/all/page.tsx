"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, Clock3, FileCheck2, Filter, Eye, RefreshCw, Search, ShieldCheck, WalletCards } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationRecord {
  id: string;
  studentName: string;
  studentNo: string;
  projectName: string;
  requestedAmount: number;
  status: string;
  riskLevel: "低" | "中" | "高";
  materialCompleteness: number;
  submittedAt: string;
  overdue: boolean;
  version?: number;
  submissionChannel?: string;
  materialSubmissionMethod?: string;
  materialCount?: number;
  submissionReceiptNo?: string;
  scenarioId?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type WorkflowAction = "submit_draft" | "approve" | "return" | "publish" | "close_publicity" | "resubmit" | "appeal" | "resolve_appeal" | "reject";

interface PendingAction {
  application: ApplicationRecord;
  action: WorkflowAction;
  label: string;
  tone: "primary" | "danger" | "warning";
}

const STATUS_OPTIONS = ["全部状态", "待处理事项", "历史记录", "超时事项", "草稿", "待辅导员初审", "待院系复核", "待校级复审", "待领导审批", "待公示", "公示中", "待发放", "已完成", "已退回补正", "已驳回", "申诉处理中"];

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = window.localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

function currentRole(): string {
  const text = window.localStorage.getItem("user");
  if (!text) return "";
  try {
    const user = JSON.parse(text) as { role?: string; roles?: Array<{ code?: string }> };
    return user.roles?.[0]?.code ?? user.role ?? "";
  } catch {
    return "";
  }
}

function statusStyle(status: string): string {
  if (status === "已完成") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "已驳回") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "已退回补正") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "公示中") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "待发放") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function riskStyle(risk: ApplicationRecord["riskLevel"]): string {
  if (risk === "高") return "bg-rose-100 text-rose-700";
  if (risk === "中") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function availableActions(role: string, application: ApplicationRecord): PendingAction[] {
  if (application.scenarioId) return [];
  const create = (action: WorkflowAction, label: string, tone: PendingAction["tone"] = "primary"): PendingAction => ({ application, action, label, tone });
  if (role === "STUDENT" && application.status === "草稿") return [];
  if (role === "COUNSELOR" && application.status === "待辅导员初审") return [create("approve", "初审通过"), create("return", "退回补正", "warning")];
  if (role === "DEPT_ADMIN" && application.status === "待院系复核") return [create("approve", "院系复核通过"), create("return", "退回补正", "warning")];
  if ((role === "FUND_ADMIN" || role === "FUND_LEADER") && application.status === "待校级复审") return [create("approve", "校级复审通过"), create("return", "退回补正", "warning"), ...(role === "FUND_LEADER" ? [create("reject", "驳回申请", "danger")] : [])];
  if (role === "FUND_ADMIN" && application.status === "待公示") return [create("publish", "发布公示")];
  if (role === "FUND_ADMIN" && application.status === "公示中") return [create("close_publicity", "结束公示")];
  if (role === "STUDENT" && application.status === "已退回补正") return [create("appeal", "发起申诉", "warning")];
  if (role === "STUDENT" && application.status === "已驳回") return [create("appeal", "发起申诉", "warning")];
  if (role === "FUND_LEADER" && application.status === "申诉处理中") return [create("resolve_appeal", "申诉复核通过"), create("reject", "维持原结论", "danger")];
  return [];
}

export default function ApplicationListPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [role, setRole] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/applications?pageSize=100", { headers: authHeaders() });
      const payload = await response.json() as ApiEnvelope<ApplicationRecord[]>;
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "申请数据加载失败");
      setApplications(payload.data ?? []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "申请数据加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "pending") setStatus("待处理事项");
    if (view === "history") setStatus("历史记录");
    setRole(currentRole());
    void loadApplications();
  }, [loadApplications]);
  useEffect(() => {
    if (!applications.length) return;
    const timer = window.setTimeout(() => applications.slice(0, 8).forEach((item) => router.prefetch(`/application/detail?id=${item.id}`)), 150);
    return () => window.clearTimeout(timer);
  }, [applications, router]);

  const filtered = useMemo(() => applications.filter((application) => {
    const matchesStatus = status === "全部状态" || (status === "待处理事项" ? application.status.startsWith("待") || application.status === "申诉处理中" : status === "历史记录" ? ["已完成","已驳回","已退回补正"].includes(application.status) : status === "超时事项" ? application.overdue : application.status === status);
    const normalized = keyword.trim().toLocaleLowerCase();
    const matchesKeyword = !normalized || `${application.studentName}${application.studentNo}${application.projectName}${application.id}`.toLocaleLowerCase().includes(normalized);
    return matchesStatus && matchesKeyword;
  }), [applications, keyword, status]);

  const summary = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => item.status.startsWith("待") || item.status === "申诉处理中").length,
    overdue: applications.filter((item) => item.overdue).length,
    amount: applications.reduce((sum, item) => sum + item.requestedAmount, 0),
  }), [applications]);

  const submitTransition = async () => {
    if (!pendingAction || comment.trim().length < 2) return;
    setSubmitting(true);
    try {
      const application = pendingAction.application;
      const idempotencyKey = `workflow-${application.id}-${application.version ?? 1}-${pendingAction.action}`;
      const response = await fetch(`/api/applications/${application.id}/transition`, {
        method: "POST",
        headers: authHeaders({ "Idempotency-Key": idempotencyKey }),
        body: JSON.stringify({ action: pendingAction.action, comment: comment.trim(), expectedVersion: application.version ?? 1, humanConfirmed: true }),
      });
      const payload = await response.json() as ApiEnvelope<{ application?: ApplicationRecord; message?: string }>;
      if (!response.ok || !payload.success || !payload.data?.application) throw new Error(payload.error ?? "流程处理失败");
      setApplications((current) => current.map((item) => item.id === application.id ? payload.data!.application! : item));
      setMessage({ type: "success", text: payload.data.message ?? "流程处理完成" });
      setPendingAction(null);
      setComment("");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "流程处理失败" });
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-700"><ShieldCheck className="h-4 w-4" />组织范围隔离 · 乐观锁 · 幂等防重 · 全程审计</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">资助申请全流程工作台</h1><p className="mt-1 text-sm text-slate-500">模拟业务库已启用；流程写操作均由当前处理人明确确认，AI只能生成建议。</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => void loadApplications()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</Button><Button onClick={() => router.push("/ai-assistant/chat?scene=application-review")}><Bot className="mr-2 h-4 w-4" />查看智能审核建议</Button></div>
    </div>

    {message && <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{message.text}</div>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <button className="text-left" onClick={() => setStatus("全部状态")}><MetricCard icon={FileCheck2} label="授权范围申请" value={summary.total.toString()} description="点击查看全部授权数据" tone="blue" /></button>
      <button className="text-left" onClick={() => setStatus("待处理事项")}><MetricCard icon={Clock3} label="待处理事项" value={summary.pending.toString()} description="点击筛选审核、公示与申诉" tone="amber" /></button>
      <button className="text-left" onClick={() => setStatus("超时事项")}><MetricCard icon={AlertTriangle} label="超时预警" value={summary.overdue.toString()} description="点击进入超时记录" tone="rose" /></button>
      <button className="text-left" onClick={() => setStatus("全部状态")}><MetricCard icon={WalletCards} label="申请金额" value={`¥${summary.amount.toLocaleString("zh-CN")}`} description="点击回到完整清单" tone="emerald" /></button>
    </div>

    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><CardTitle className="text-base">申请清单</CardTitle><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="学生、学号、项目或编号" className="w-full pl-9 sm:w-72" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-48"><Filter className="mr-2 h-4 w-4 text-slate-400" /><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div></div></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/80"><TableHead>申请 / 学生</TableHead><TableHead>资助项目</TableHead><TableHead>申请金额</TableHead><TableHead>材料完整度</TableHead><TableHead>风险</TableHead><TableHead>流程状态</TableHead><TableHead className="text-right">当前操作</TableHead></TableRow></TableHeader><TableBody>
          {loading ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">正在加载授权范围内的申请…</TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">暂无符合条件的申请</TableCell></TableRow> : filtered.map((application) => {
            const actions = availableActions(role, application);
            return <TableRow key={application.id} className="hover:bg-blue-50/30"><TableCell><p className="font-medium text-slate-900">{application.studentName} <span className="ml-1 text-xs font-normal text-slate-400">{application.studentNo}</span></p><p className="mt-1 font-mono text-xs text-slate-400">{application.id} · v{application.version ?? 1}</p></TableCell><TableCell><p className="font-medium text-slate-700">{application.projectName}</p><p className="mt-1 text-xs text-slate-400">提交于 {application.submittedAt.slice(0, 10)}</p><div className="mt-2 flex flex-wrap gap-1"><Badge variant="outline" className="text-[9px]">{application.submissionChannel ?? "web"}</Badge><Badge variant="outline" className="text-[9px]">{application.materialSubmissionMethod ?? "online-upload"}</Badge></div><p className="mt-1 font-mono text-[9px] text-slate-400">{application.submissionReceiptNo ?? "历史数据回执"}</p></TableCell><TableCell className="font-semibold text-slate-800">¥{application.requestedAmount.toLocaleString("zh-CN")}</TableCell><TableCell><div className="w-32"><div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">完整度</span><span className="font-medium">{application.materialCompleteness}%</span></div><Progress value={application.materialCompleteness} className="h-1.5" /></div></TableCell><TableCell><Badge className={riskStyle(application.riskLevel)}>{application.riskLevel}风险</Badge></TableCell><TableCell><Badge variant="outline" className={statusStyle(application.status)}>{application.status}</Badge>{application.overdue && <p className="mt-1 text-xs text-rose-600">已超时</p>}</TableCell><TableCell><div className="flex justify-end gap-2">{!["SCHOOL_LEADER", "FINANCE", "EDU_BUREAU"].includes(role) ? <Button size="sm" variant="outline" onMouseEnter={() => router.prefetch(`/application/detail?id=${application.id}`)} onClick={() => router.push(`/application/detail?id=${application.id}`)}><Eye className="mr-1 h-3 w-3" />详情</Button> : <span className="self-center text-[10px] text-slate-400">脱敏汇总</span>}{role === "STUDENT" && ["草稿", "已退回补正"].includes(application.status) && <Button size="sm" onClick={() => router.push(`/application/create?draft=${application.id}`)}>继续编辑</Button>}{actions.slice(0, 2).map((action) => <Button key={action.action} size="sm" variant={action.tone === "primary" ? "default" : "outline"} className={action.tone === "danger" ? "border-rose-200 text-rose-700 hover:bg-rose-50" : action.tone === "warning" ? "border-amber-200 text-amber-700 hover:bg-amber-50" : ""} onClick={() => { setPendingAction(action); setComment(""); }}>{action.label}</Button>)}</div></TableCell></TableRow>;
          })}
        </TableBody></Table></div>
      </CardContent>
    </Card>

    <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => { if (!open && !submitting) setPendingAction(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认流程操作</AlertDialogTitle><AlertDialogDescription>{pendingAction ? `将对 ${pendingAction.application.studentName} 的“${pendingAction.application.projectName}”执行“${pendingAction.label}”。操作会改变流程状态并写入审计日志。` : ""}</AlertDialogDescription></AlertDialogHeader><div className="space-y-2"><label className="text-sm font-medium text-slate-700">处理意见</label><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="请输入明确、可审计的处理依据（2—500字）" maxLength={500} /><p className="text-right text-xs text-slate-400">{comment.length}/500</p></div><AlertDialogFooter><AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void submitTransition(); }} disabled={submitting || comment.trim().length < 2}>{submitting ? "处理中…" : "人工确认并提交"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function MetricCard({ icon: Icon, label, value, description, tone }: { icon: typeof FileCheck2; label: string; value: string; description: string; tone: "blue" | "amber" | "rose" | "emerald" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", emerald: "bg-emerald-50 text-emerald-700" };
  return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div></CardContent></Card>;
}







