import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { evaluateApplicationEligibility, listApplicationProjects } from "@/lib/platform/application-intake-store";
import { listVisibleApplications, writeAuditSnapshot } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
interface Body { project?: unknown; requestedAmount?: unknown; academicYear?: unknown; excludeApplicationId?: unknown }
export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("项目可申请清单仅向学生本人提供", 403);
  return successResponse({ projects: listApplicationProjects(actor.campusIds), generatedAt: new Date().toISOString(), source: "项目配置中心确定性快照" });
}
export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有学生本人可执行项目资格预检", 403);
  let body: Body; try { body = await request.json() as Body; } catch { return errorResponse("请求格式不正确"); }
  const project = typeof body.project === "string" ? body.project.trim().slice(0, 120) : ""; const requestedAmount = typeof body.requestedAmount === "number" && Number.isFinite(body.requestedAmount) ? body.requestedAmount : Number.NaN; const academicYear = typeof body.academicYear === "string" ? body.academicYear.trim().slice(0, 20) : "2026-2027"; const excludeApplicationId = typeof body.excludeApplicationId === "string" ? body.excludeApplicationId : undefined;
  if (!project || !Number.isFinite(requestedAmount)) return errorResponse("请选择项目并填写有效申请金额");
  const report = evaluateApplicationEligibility(actor, { project, requestedAmount, academicYear, excludeApplicationId }, listVisibleApplications(actor));
  writeAuditSnapshot({ taskId: report.id, actorId: actor.userId, actorRole: actor.role, action: "application:eligibility_preview", outcome: report.allowed ? "passed" : "blocked", evidenceSummary: `学生执行项目资格预检；报告 ${report.id}，确定性校验 ${report.checks.length} 项。`, resource: { type: "eligibility_report", id: report.id, campusId: actor.campusIds[0], sensitivity: "P2", workflowState: report.allowed ? "allowed" : "blocked" }, after: { allowed: report.allowed, blockingCodes: report.blockingCodes, warningCodes: report.warningCodes }, operationDetails: { deterministicRules: true, modelUsed: false } });
  return successResponse(report, report.allowed ? "项目资格确定性校验通过" : "项目资格校验存在阻断项");
}
