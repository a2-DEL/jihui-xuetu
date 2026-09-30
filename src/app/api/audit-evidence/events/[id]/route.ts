import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { canAccessAuditCenter, getAuditEvidence } from "@/lib/platform/audit-evidence-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessAuditCenter(actor)) return errorResponse("当前岗位无权读取审计证据", 403);
  const { id } = await context.params;
  const record = getAuditEvidence(actor, id);
  if (!record) return errorResponse("审计事件不存在或不在授权任务范围", 404);
  return successResponse(record);
}
