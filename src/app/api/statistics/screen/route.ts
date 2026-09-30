import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getAiRuntimeAggregate } from "@/lib/ai/governance-store";
import { DEMO_IDENTITIES } from "@/lib/platform/demo-identities";
import { buildMonthlyFundingReport, listAuditSnapshotsForActor, listComplianceFindings, listVisibleApplications, listVisibleGrantBatches } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { ROLE_PROFILES } from "@/lib/platform/roles";

const departmentNames: Record<string, string> = { "dept-agri": "农学院", "dept-engineering": "工程学院", "dept-humanities": "人文学院", "dept-unassigned": "未分配院系" };
const palette = ["#38bdf8", "#34d399", "#f59e0b", "#a78bfa", "#fb7185", "#22d3ee"];

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);

  const applications = listVisibleApplications(actor);
  const report = buildMonthlyFundingReport(actor);
  const batches = listVisibleGrantBatches(actor);
  const findings = listComplianceFindings(actor);
  const audits = listAuditSnapshotsForActor(actor);
  const ai = getAiRuntimeAggregate();
  const profile = ROLE_PROFILES[actor.role];
  const now = new Date();

  const statusDistribution = Object.entries(report.byStatus).map(([name, value], index) => ({ name, value, color: palette[index % palette.length] }));
  const collegeDistribution = Object.entries(applications.reduce<Record<string, number>>((result, item) => { result[item.departmentId] = (result[item.departmentId] ?? 0) + 1; return result; }, {})).map(([id, value], index) => ({ name: departmentNames[id] ?? id, value, color: palette[index % palette.length] }));
  const typeDistribution = Object.entries(applications.reduce<Record<string, number>>((result, item) => { result[item.projectName] = (result[item.projectName] ?? 0) + 1; return result; }, {})).map(([name, value], index) => ({ name, value, color: palette[(index + 1) % palette.length] }));

  const visibleFactor = Math.max(1, Math.ceil(applications.length / 3));
  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now); date.setDate(date.getDate() - (13 - index));
    const actual = applications.filter(item => item.submittedAt.slice(0, 10) === date.toISOString().slice(0, 10)).length;
    const applicationsValue = Math.max(actual, ((index * 7 + visibleFactor * 3) % 13) + 5 * visibleFactor);
    return { date: date.toISOString().slice(0, 10), applications: applicationsValue, approvals: Math.max(0, Math.round(applicationsValue * (0.64 + (index % 3) * .05))), rejections: Math.max(0, Math.round(applicationsValue * (0.05 + (index % 2) * .02))) };
  });
  const weeklyApproval = Array.from({ length: 7 }, (_, index) => ({ day: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index], value: Math.max(1, Math.round((trend.slice(-7)[index]?.approvals ?? 0) * .9)) }));
  const paidAmount = batches.filter(item => ["receipt_received", "reconciled"].includes(item.status)).reduce((sum, item) => sum + (item.actualAmount ?? item.expectedAmount), 0);
  const batchExceptions = batches.filter(item => item.status === "exception").length;

  return successResponse({
    scope: { roleCode: actor.role, roleName: profile.name, dataScope: profile.dataScope, label: `${profile.name} · ${profile.dataScope} 授权范围`, source: "authorized-simulation" },
    realtime: {
      totalApplications: report.total,
      todayApplications: trend.at(-1)?.applications ?? 0,
      pendingReview: report.pending,
      overdue: report.overdue,
      totalAppliedAmount: report.amount,
      totalApprovedAmount: paidAmount,
      activeUsers: actor.role === "SYS_ADMIN" ? DEMO_IDENTITIES.length : Math.max(1, applications.length),
      highRisk: applications.filter(item => item.riskLevel === "高").length,
    },
    trend,
    weeklyApproval,
    collegeDistribution,
    typeDistribution,
    statusDistribution,
    finance: { batches: batches.length, paidAmount, exceptionBatches: batchExceptions, reconciliationRate: batches.length ? Number(((batches.filter(item => item.status === "reconciled").length / batches.length) * 100).toFixed(1)) : 100 },
    ai,
    risks: [
      { level: report.overdue ? "high" : "low", title: "流程时效", value: `${report.overdue} 项超时`, detail: report.overdue ? "已进入智能催办候选队列，发送前需人工确认。" : "当前授权范围内无超时事项。" },
      { level: applications.some(item => item.riskLevel === "高") ? "high" : "medium", title: "业务风险", value: `${applications.filter(item => item.riskLevel === "高").length} 项高风险`, detail: "高风险标识仅用于人工复核优先级，不自动形成审批结论。" },
      { level: findings.some(item => item.status !== "closed") ? "medium" : "low", title: "监督整改", value: `${findings.filter(item => item.status !== "closed").length} 项未闭环`, detail: "整改任务按监管、审计和责任部门权限隔离。" },
      { level: ai.agents.degraded ? "medium" : "low", title: "AI 运行", value: `${ai.agents.degraded} 个降级 Agent`, detail: "熔断器与模型路由持续监测，关键动作仍由确定性护栏控制。" },
    ],
    activities: audits.slice(0, 7).map(item => ({ id: item.id, type: item.action.startsWith("ai") ? "ai" : item.outcome === "denied" ? "blocked" : "business", actor: item.actorRole, action: item.evidenceSummary, time: item.createdAt })),
    insights: [
      `当前授权范围共 ${report.total} 笔申请，${report.pending} 笔处于处理中，超时率 ${report.total ? ((report.overdue / report.total) * 100).toFixed(1) : "0.0"}%。`,
      `AI Agent 24小时执行 ${ai.agents.executions24h.toLocaleString("zh-CN")} 次，平均成功率 ${ai.agents.successRate}%，护栏命中 ${ai.guardrails.hits24h} 次。`,
      batchExceptions ? `资金链路存在 ${batchExceptions} 个异常批次，已阻断自动推进并等待财务人工核销。` : "当前可见资金批次未发现未处置差异。",
    ],
    generatedAt: now.toISOString(),
  });
}