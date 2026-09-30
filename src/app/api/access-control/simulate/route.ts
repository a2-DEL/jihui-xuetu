import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { canAccessPermissionCenter, simulatePermissionDecision, type SimulationOverrides } from "@/lib/platform/access-control-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import type { GeographicLevel } from "@/lib/platform/nine-dimension-engine";

const GEO_LEVELS: readonly GeographicLevel[] = ["L1", "L2", "L3", "L4", "L5"];
interface Body { scenarioId?: unknown; overrides?: unknown }
function parseOverrides(value: unknown): SimulationOverrides | null {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>; const output: SimulationOverrides = {};
  if (source.geographicLevel !== undefined) { if (typeof source.geographicLevel !== "string" || !GEO_LEVELS.includes(source.geographicLevel as GeographicLevel)) return null; output.geographicLevel = source.geographicLevel as GeographicLevel; }
  for (const key of ["deviceTrusted", "mfaVerified", "businessWindowOpen", "sandboxPassed", "trialApproved"] as const) { if (source[key] !== undefined) { if (typeof source[key] !== "boolean") return null; output[key] = source[key]; } }
  if (source.occurredAt !== undefined) { if (typeof source.occurredAt !== "string" || Number.isNaN(Date.parse(source.occurredAt))) return null; output.occurredAt = source.occurredAt; }
  if (source.confirmations !== undefined) { if (typeof source.confirmations !== "number" || !Number.isInteger(source.confirmations) || source.confirmations < 0 || source.confirmations > 5) return null; output.confirmations = source.confirmations; }
  if (source.purpose !== undefined) { if (typeof source.purpose !== "string" || source.purpose.trim().length > 200) return null; output.purpose = source.purpose.trim(); }
  return output;
}

export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessPermissionCenter(actor)) return errorResponse("当前岗位无权运行全局权限策略模拟", 403);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse("权限模拟必须提供有效的 Idempotency-Key");
  let body: Body; try { body = await request.json() as Body; } catch { return errorResponse("请求格式不正确"); }
  if (typeof body.scenarioId !== "string" || !body.scenarioId.trim()) return errorResponse("请选择有效的权限测试场景");
  const overrides = parseOverrides(body.overrides); if (!overrides) return errorResponse("模拟参数不合法");
  const result = simulatePermissionDecision(actor, { scenarioId: body.scenarioId.trim(), overrides, idempotencyKey });
  if (!result.success) return errorResponse(result.message, result.code === "SCENARIO_NOT_FOUND" ? 404 : 403);
  return successResponse(result, result.message);
}
