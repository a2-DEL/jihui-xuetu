import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getHardshipVideoBankSnapshot } from "@/lib/platform/hardship-video-disbursement-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  const snapshot = getHardshipVideoBankSnapshot(actor);
  return snapshot ? successResponse(snapshot) : errorResponse("当前岗位无权读取银行发放任务", 403);
}
