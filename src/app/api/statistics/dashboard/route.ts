import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { listVisibleApplications } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

// DEMO ONLY: do not publish random trends or fabricated KPIs as operational statistics.
export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!["FUND_ADMIN", "FUND_LEADER", "SCHOOL_LEADER", "STU_AFFAIRS", "EDU_BUREAU"].includes(actor.role))
    return errorResponse("当前岗位无权读取统计信息", 403);
  const applications = listVisibleApplications(actor);
  const today = new Date().toISOString().slice(0, 10);
  const pending = new Set(["待辅导员初审", "待院系复核", "待校级复审", "待领导审批", "待公示", "公示中"]);
  return successResponse({ dataMode: "DEMO", overview: {
    totalApplications: applications.length,
    pendingReview: applications.filter(item => pending.has(item.status)).length,
    approved: applications.filter(item => ["待发放", "已完成"].includes(item.status)).length,
    rejected: applications.filter(item => item.status === "已驳回").length,
    todayApplications: applications.filter(item => item.submittedAt.slice(0, 10) === today).length,
    todayApprovals: null, activeUsers: null,
  }, trend: [], todos: [], aiStats: null });
}
