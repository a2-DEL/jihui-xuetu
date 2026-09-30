import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { accessControlOverview, canAccessPermissionCenter } from "@/lib/platform/access-control-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessPermissionCenter(actor)) return errorResponse("当前岗位无权进入全局权限控制中心", 403);
  return successResponse(accessControlOverview(actor));
}
