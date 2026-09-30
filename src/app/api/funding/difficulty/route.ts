import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { listDifficultyAssessments } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  return successResponse(listDifficultyAssessments(actor));
}
