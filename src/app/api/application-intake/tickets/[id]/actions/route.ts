import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getVisibleIntakeTicket, synchronizeIntakeTicket } from "@/lib/platform/application-intake-store";
import { getVisibleApplication, listVisibleApplications, transitionDemoApplication } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
interface Body { action?: unknown; comment?: unknown; expectedTicketVersion?: unknown; expectedApplicationVersion?: unknown; humanConfirmed?: unknown }
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); const idempotencyKey = request.headers.get("idempotency-key")?.trim(); if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse("受理工单写操作必须提供有效的 Idempotency-Key");
  let body: Body; try { body = await request.json() as Body; } catch { return errorResponse("请求格式不正确"); } if (body.humanConfirmed !== true) return errorResponse("受理操作必须由处理人明确确认", 409); if (!['accept', 'request_correction'].includes(String(body.action))) return errorResponse("不支持的受理动作"); const comment = typeof body.comment === "string" ? body.comment.trim() : ""; if (comment.length < 2 || comment.length > 500) return errorResponse("处理意见长度应为2至500字"); if (typeof body.expectedTicketVersion !== "number" || typeof body.expectedApplicationVersion !== "number") return errorResponse("缺少工单或申请版本号", 409);
  const applications = listVisibleApplications(actor); const { id } = await context.params; const ticket = getVisibleIntakeTicket(id, applications.map(item => item.id)); if (!ticket) return errorResponse("受理工单不存在或不在当前授权范围", 404); if (ticket.version !== body.expectedTicketVersion) return errorResponse("受理工单已被其他处理人更新，请刷新后重试", 409); const application = getVisibleApplication(actor, ticket.applicationId); if (!application) return errorResponse("关联申请不存在", 404);
  const beforeStatus = application.status; const transitionAction = body.action === "accept" ? "approve" : "return"; const result = transitionDemoApplication(actor, { applicationId: application.id, action: transitionAction, comment, idempotencyKey, expectedVersion: body.expectedApplicationVersion }); if (!result.success || !result.application) return errorResponse(result.message, result.code === "VERSION_CONFLICT" ? 409 : 403);
  const updatedTicket = synchronizeIntakeTicket({ applicationId: application.id, action: transitionAction, fromStatus: beforeStatus, toStatus: result.application.status, actorId: actor.userId, actorRole: actor.role, comment });
  return successResponse({ application: result.application, ticket: updatedTicket }, result.message);
}
