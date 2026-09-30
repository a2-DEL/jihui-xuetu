import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { ensureIntakeTickets, getApplicationEligibility, getApplicationPrecheck, getVisibleIntakeTicket } from "@/lib/platform/application-intake-store";
import { getVisibleApplication, listVisibleApplications } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (!["STUDENT", "COUNSELOR", "DEPT_ADMIN", "FUND_ADMIN", "FUND_LEADER", "AUDITOR", "AUDIT_EXTERNAL"].includes(actor.role)) return errorResponse("当前岗位无权读取申请受理工单", 403);
  const applications = listVisibleApplications(actor); ensureIntakeTickets(applications); const { id } = await context.params; const ticket = getVisibleIntakeTicket(id, applications.map(item => item.id)); if (!ticket) return errorResponse("受理工单不存在或不在当前授权范围", 404); const application = getVisibleApplication(actor, ticket.applicationId); if (!application) return errorResponse("关联申请不在当前授权范围", 404);
  const canHandle = !application.scenarioId && ((actor.role === "COUNSELOR" && application.status === "待辅导员初审") || (actor.role === "DEPT_ADMIN" && application.status === "待院系复核") || (actor.role === "FUND_ADMIN" && application.status === "待校级复审"));
  return successResponse({ ticket, application, eligibility: getApplicationEligibility(application.id), precheck: getApplicationPrecheck(application.id), permission: { canHandle, actions: canHandle ? [{ id: "accept", label: "受理通过并转下一环节" }, { id: "request_correction", label: "退回补正" }] : [], dataScope: actor.role } });
}


