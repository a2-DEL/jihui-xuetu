import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { advanceCollaborationRun, confirmCollaborationGate, controlCollaborationRun, createCollaborationRun, getCollaborationSnapshot, resetVideoScenario, startVideoScenario } from "@/lib/ai/hardship-collaboration-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

type CollaborationRequest =
  | { action: "create_run"; command: string }
  | { action: "start_scenario"; scenarioId: string; expectedVersion: number; command: string }
  | { action: "reset_scenario"; scenarioId: string; expectedVersion: number; comment: string; humanConfirmed: boolean }
  | { action: "advance"; runId: string; expectedVersion: number }
  | { action: "confirm_gate"; runId: string; expectedVersion: number; comment: string; humanConfirmed: boolean }
  | { action: "control"; runId: string; expectedVersion: number; controlAction: "pause" | "resume" | "retry" };

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  const runId = request.nextUrl.searchParams.get("runId") ?? undefined;
  const scenarioId = request.nextUrl.searchParams.get("scenario") ?? undefined;
  try { return successResponse(getCollaborationSnapshot(actor, runId, scenarioId)); }
  catch (error) { return errorResponse(error instanceof Error ? error.message : "协同运行加载失败", 500); }
}

export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8) return errorResponse("写操作必须提供有效幂等键", 400);
  let body: CollaborationRequest;
  try { body = await request.json() as CollaborationRequest; }
  catch { return errorResponse("请求参数格式无效", 400); }
  let result;
  try {
    if (body.action === "create_run") result = await createCollaborationRun(actor, body.command, idempotencyKey);
    else if (body.action === "start_scenario") result = await startVideoScenario(actor, body.scenarioId, body.expectedVersion, body.command, idempotencyKey);
    else if (body.action === "reset_scenario") {
      if (!body.humanConfirmed) return errorResponse("场景复位必须显式人工确认", 428);
      result = resetVideoScenario(actor, body.scenarioId, body.expectedVersion, body.comment, idempotencyKey);
    } else if (body.action === "advance") result = advanceCollaborationRun(actor, body.runId, body.expectedVersion, idempotencyKey);
    else if (body.action === "confirm_gate") {
      if (!body.humanConfirmed) return errorResponse("人工闸门必须显式确认", 428);
      result = confirmCollaborationGate(actor, body.runId, body.expectedVersion, body.comment, idempotencyKey);
    } else if (body.action === "control") result = controlCollaborationRun(actor, body.runId, body.controlAction, body.expectedVersion, idempotencyKey);
    else return errorResponse("不支持的协同操作", 400);
  } catch (error) { return errorResponse(error instanceof Error ? error.message : "协同操作失败", 500); }
  if (result.success) return successResponse(result.data ?? { code: result.code }, result.message);
  const status = result.code === "ROLE_DENIED" || result.code === "PERMISSION_BLOCKED" ? 403
    : result.code === "NOT_FOUND" || result.code === "SCENARIO_NOT_FOUND" ? 404
    : result.code === "VERSION_CONFLICT" || result.code === "BUSINESS_ADAPTER_PENDING" || result.code === "STATE_DENIED" ? 409
    : result.code === "HUMAN_GATE_WAITING" || result.code === "GATE_NOT_WAITING" ? 428 : 400;
  return errorResponse(`${result.code}: ${result.message}`, status);
}
