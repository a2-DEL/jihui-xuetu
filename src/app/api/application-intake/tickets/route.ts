import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { ensureIntakeTickets, listVisibleIntakeTickets } from "@/lib/platform/application-intake-store";
import { listVisibleApplications } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (!["STUDENT", "COUNSELOR", "DEPT_ADMIN", "FUND_ADMIN", "FUND_LEADER", "AUDITOR", "AUDIT_EXTERNAL"].includes(actor.role)) return errorResponse("当前岗位无权读取申请受理工单", 403);
  const applications = listVisibleApplications(actor); ensureIntakeTickets(applications); const status = request.nextUrl.searchParams.get("status"); let tickets = listVisibleIntakeTickets(applications.map((item) => item.id)); if (status) tickets = tickets.filter((item) => item.status === status);
  return successResponse({ tickets, summary: { total: tickets.length, queued: tickets.filter(item => item.status === "queued" || item.status === "resubmitted").length, correction: tickets.filter(item => item.status === "correction_required").length, highPriority: tickets.filter(item => item.priority === "high").length }, generatedAt: new Date().toISOString() });
}
