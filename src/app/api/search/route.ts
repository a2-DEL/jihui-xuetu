import { type NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { listVisibleApplications } from "@/lib/platform/demo-store";

// DEMO ONLY: authorize access to demo-store projections; do not serve hard-coded student profiles.
export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (["SYS_ADMIN", "AI_OPS", "PUBLIC_OPINION", "DISCIPLINE", "DATA_ADMIN"].includes(actor.role))
    return errorResponse("当前岗位无权检索学生申请", 403);
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim().toLocaleLowerCase() ?? "";
  if (keyword.length > 100) return errorResponse("关键词过长");
  if (!keyword) return successResponse({ applications: [], students: [], approvals: [], total: 0, dataMode: "DEMO" });
  const maySearchIdentity = ["STUDENT", "COUNSELOR", "DEPT_ADMIN", "FUND_ADMIN"].includes(actor.role);
  const applications = listVisibleApplications(actor).filter(item =>
    `${item.id} ${item.projectName} ${maySearchIdentity ? `${item.studentNo} ${item.studentName}` : ""}`.toLocaleLowerCase().includes(keyword)
  ).slice(0, 20).map(item => ({
    id: item.id, application_no: item.submissionReceiptNo ?? item.id, type: item.projectName,
    status: item.status, amount: item.requestedAmount,
    applicant_name: maySearchIdentity ? item.studentName : "***",
    student_id: maySearchIdentity ? item.studentNo : "****",
    created_at: item.submittedAt,
  }));
  return successResponse({ applications, students: [], approvals: [], total: applications.length, dataMode: "DEMO" });
}
