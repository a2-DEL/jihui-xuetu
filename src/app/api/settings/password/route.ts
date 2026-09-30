import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { changeDemoIdentityPassword } from "@/lib/platform/demo-identities";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  let body: { currentPassword?: unknown; newPassword?: unknown };
  try { body = await request.json() as typeof body; } catch { return errorResponse("请求参数格式无效", 400); }
  if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") return errorResponse("当前密码和新密码不能为空", 400);
  const result = changeDemoIdentityPassword(actor.userId, body.currentPassword, body.newPassword);
  writeAuditSnapshot({ taskId: `password-${actor.userId}-${Date.now()}`, actorId: actor.userId, actorRole: actor.role, action: "account_security:password_change", outcome: result.success ? "success" : "denied", evidenceSummary: result.success ? "用户已更新演示身份密码；未记录任何密码内容。" : "密码修改校验未通过；未记录任何密码内容。" });
  return result.success ? successResponse({ changed: true }, result.message) : errorResponse(result.message, 400);
}