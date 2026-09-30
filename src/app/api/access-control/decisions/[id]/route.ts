import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { canAccessPermissionCenter, getPermissionDecision } from "@/lib/platform/access-control-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessPermissionCenter(actor)) return errorResponse("当前岗位无权读取权限决策证据", 403);
  const { id } = await context.params;
  const record = getPermissionDecision(actor, id);
  if (!record) return errorResponse("权限决策不存在或不在授权范围", 404);
  return successResponse(record);
}
