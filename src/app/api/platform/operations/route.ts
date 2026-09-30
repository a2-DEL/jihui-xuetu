import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getPlatformAdminSnapshot, processPlatformAdminAction, type PlatformAdminAction } from "@/lib/platform/admin-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401);
  const snapshot = getPlatformAdminSnapshot(actor); if (!snapshot) return errorResponse("当前岗位无平台治理权限", 403);
  return successResponse(snapshot);
}
export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401);
  let body: PlatformAdminAction; try { body = await request.json() as PlatformAdminAction; } catch { return errorResponse("请求参数格式无效", 400); }
  const result = processPlatformAdminAction(actor, body, request.headers.get("idempotency-key") ?? "");
  return result.success ? successResponse(result, result.message) : errorResponse(result.message, result.code === "ROLE_DENIED" ? 403 : result.code === "NOT_FOUND" ? 404 : result.code === "VERSION_CONFLICT" ? 409 : 400);
}
