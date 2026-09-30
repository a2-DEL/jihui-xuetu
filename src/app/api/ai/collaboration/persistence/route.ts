import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getHardshipPersistenceProof } from "@/lib/ai/hardship-persistence-proof";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  const runId = request.nextUrl.searchParams.get("runId")?.trim();
  if (!runId) return errorResponse("缺少运行编号", 400);
  try { return successResponse(getHardshipPersistenceProof(actor, runId)); }
  catch (error) { return errorResponse(error instanceof Error ? error.message : "持久化证据生成失败", 404); }
}
