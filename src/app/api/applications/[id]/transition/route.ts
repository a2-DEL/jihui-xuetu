import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { synchronizeIntakeTicket } from "@/lib/platform/application-intake-store";
import { getVisibleApplication, transitionDemoApplication, type ApplicationAction } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
const ACTIONS: readonly ApplicationAction[] = ["submit_draft", "approve", "return", "publish", "close_publicity", "mark_granted", "resubmit", "appeal", "resolve_appeal", "reject"];
interface TransitionBody { action?: unknown; comment?: unknown; expectedVersion?: unknown; humanConfirmed?: unknown }
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); const idempotencyKey = request.headers.get("idempotency-key")?.trim(); if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse("业务写操作必须提供有效的 Idempotency-Key");
  let body: TransitionBody; try { body = await request.json() as TransitionBody; } catch { return errorResponse("请求格式不正确"); }
  if (body.humanConfirmed !== true) return errorResponse("该流程动作需要当前处理人明确确认", 409); if (typeof body.action !== "string" || !ACTIONS.includes(body.action as ApplicationAction)) return errorResponse("不支持的流程动作"); if (typeof body.expectedVersion !== "number" || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) return errorResponse("缺少有效的业务数据版本号");
  const comment = typeof body.comment === "string" ? body.comment.trim() : ""; if (comment.length < 2 || comment.length > 500) return errorResponse("处理意见长度应为 2 至 500 个字符"); if (body.action === "mark_granted") return errorResponse("资金发放属于高风险动作，必须进入独立双人授权与银行回盘流程，不能通过通用状态接口执行", 403);
  if (["submit_draft", "resubmit"].includes(body.action)) return errorResponse("草稿或补正申请必须进入编辑页完成资格复核、材料预处理和预检后提交，禁止绕过受理网关直接改状态", 409);
  const { id } = await context.params; const before = getVisibleApplication(actor, id); const beforeStatus = before?.status; const result = transitionDemoApplication(actor, { applicationId: id, action: body.action as ApplicationAction, comment, idempotencyKey, expectedVersion: body.expectedVersion });
  if (!result.success) { const status = result.code === "VERSION_CONFLICT" || result.code === "SCENARIO_WORKFLOW_REQUIRED" ? 409 : result.code === "APPLICATION_NOT_FOUND" ? 404 : 403; return errorResponse(result.message, status); }
  if (beforeStatus && result.application) synchronizeIntakeTicket({ applicationId: id, action: body.action, fromStatus: beforeStatus, toStatus: result.application.status, actorId: actor.userId, actorRole: actor.role, comment });
  return successResponse(result, result.message);
}

