import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getDecisionSnapshot, processDecisionAction, type DecisionAction } from "@/lib/platform/decision-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
export async function GET(request: NextRequest) { const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); const data = getDecisionSnapshot(actor); return data ? successResponse(data) : errorResponse("当前岗位无校级决策数据权限", 403); }
export async function POST(request: NextRequest) { const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); let body: DecisionAction; try { body = await request.json() as DecisionAction; } catch { return errorResponse("请求参数格式无效"); } const result = processDecisionAction(actor, body, request.headers.get("idempotency-key") ?? ""); return result.success ? successResponse(result, result.message) : errorResponse(result.message, result.code === "ROLE_DENIED" ? 403 : result.code === "NOT_FOUND" ? 404 : result.code === "VERSION_CONFLICT" || result.code === "SCENARIO_WORKFLOW_REQUIRED" ? 409 : 400); }
