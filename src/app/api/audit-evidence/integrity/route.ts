import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { canAccessAuditCenter, verifyAuditChain } from "@/lib/platform/audit-evidence-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessAuditCenter(actor)) return errorResponse("当前岗位无权校验审计证据链", 403);
  return successResponse(verifyAuditChain());
}
