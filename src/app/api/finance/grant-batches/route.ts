import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { createGrantBatch, listVisibleGrantBatches } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

interface CreateBatchBody { applicationIds?: unknown; humanConfirmed?: unknown }

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  return successResponse(listVisibleGrantBatches(actor));
}

export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('业务写操作必须提供有效的 Idempotency-Key');
  let body: CreateBatchBody;
  try { body = (await request.json()) as CreateBatchBody; } catch { return errorResponse('请求格式不正确'); }
  if (body.humanConfirmed !== true) return errorResponse('编制发放批次需要人工明确确认', 409);
  if (!Array.isArray(body.applicationIds) || body.applicationIds.length === 0 || !body.applicationIds.every((item) => typeof item === 'string')) return errorResponse('申请清单不合法');
  const result = createGrantBatch(actor, { idempotencyKey, applicationIds: body.applicationIds });
  if (!result.success) return errorResponse(result.message, result.code === 'ROLE_DENIED' ? 403 : 409);
  return successResponse(result, result.message);
}
