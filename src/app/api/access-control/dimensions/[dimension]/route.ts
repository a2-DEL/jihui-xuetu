import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { canAccessPermissionCenter, dimensionDetail } from "@/lib/platform/access-control-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest, context: { params: Promise<{ dimension: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessPermissionCenter(actor)) return errorResponse("当前岗位无权读取全局维度策略", 403);
  const { dimension } = await context.params;
  const data = dimensionDetail(actor, dimension);
  if (!data) return errorResponse("权限维度不存在", 404);
  return successResponse(data);
}
