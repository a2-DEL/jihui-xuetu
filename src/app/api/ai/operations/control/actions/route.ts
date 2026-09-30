import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { processAiControlAction, type AiControlAction } from "@/lib/ai/governance-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
const ACTIONS: readonly AiControlAction[] = ["resolve_hitl", "toggle_guardrail", "activate_prompt"];
interface Body { action?: unknown; targetId?: unknown; expectedVersion?: unknown; decision?: unknown; comment?: unknown; humanConfirmed?: unknown }
export async function POST(request: NextRequest) {
 const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "AI_OPS") return errorResponse("当前岗位无AI控制平面变更权限", 403); const key = request.headers.get("idempotency-key")?.trim(); if (!key || key.length < 8) return errorResponse("操作必须提供有效的Idempotency-Key"); let body: Body; try { body = await request.json() as Body; } catch { return errorResponse("请求格式不正确"); }
 if (body.humanConfirmed !== true) return errorResponse("AI控制平面变更需要人工确认", 409); if (typeof body.action !== "string" || !ACTIONS.includes(body.action as AiControlAction)) return errorResponse("不支持的控制动作"); if (typeof body.targetId !== "string" || !body.targetId) return errorResponse("缺少目标对象"); if (typeof body.expectedVersion !== "number" || !Number.isInteger(body.expectedVersion)) return errorResponse("缺少有效版本号"); const comment = typeof body.comment === "string" ? body.comment.trim() : "";
 const result = processAiControlAction(actor, { action: body.action as AiControlAction, targetId: body.targetId, expectedVersion: body.expectedVersion, decision: body.decision === "approved" || body.decision === "rejected" ? body.decision : undefined, comment, idempotencyKey: key }); if (!result.success) return errorResponse(result.message, result.code === "VERSION_CONFLICT" ? 409 : result.code === "NOT_FOUND" ? 404 : result.code === "ROLE_DENIED" || result.code === "ASSIGNEE_DENIED" ? 403 : 400); return successResponse(result, result.message);
}

