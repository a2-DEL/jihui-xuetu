import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { processGrantBatchAction, type GrantBatchAction } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

const ACTIONS: readonly GrantBatchAction[] = ['business_approve', 'send_to_bank', 'receive_bank_receipt', 'reconcile'];
interface ActionBody { action?: unknown; expectedVersion?: unknown; comment?: unknown; humanConfirmed?: unknown; receiptNo?: unknown; actualCount?: unknown; actualAmount?: unknown; failedCount?: unknown }

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('业务写操作必须提供有效的 Idempotency-Key');
  let body: ActionBody;
  try { body = (await request.json()) as ActionBody; } catch { return errorResponse('请求格式不正确'); }
  if (body.humanConfirmed !== true) return errorResponse('该高风险资金操作需要当前处理人明确确认', 409);
  if (typeof body.action !== 'string' || !ACTIONS.includes(body.action as GrantBatchAction)) return errorResponse('不支持的批次动作');
  if (typeof body.expectedVersion !== 'number' || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) return errorResponse('缺少有效的批次版本号');
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length < 2 || comment.length > 500) return errorResponse('处理意见长度应为2至500个字符');
  const { id } = await context.params;
  const receipt = body.action === 'receive_bank_receipt' && typeof body.receiptNo === 'string' && typeof body.actualCount === 'number' && typeof body.actualAmount === 'number' && typeof body.failedCount === 'number'
    ? { receiptNo: body.receiptNo, actualCount: body.actualCount, actualAmount: body.actualAmount, failedCount: body.failedCount }
    : undefined;
  const result = processGrantBatchAction(actor, { batchId: id, action: body.action as GrantBatchAction, idempotencyKey, expectedVersion: body.expectedVersion, comment, receipt });
  if (!result.success) {
    const status = result.code === 'BATCH_NOT_FOUND' ? 404 : result.code === 'VERSION_CONFLICT' ? 409 : 403;
    return errorResponse(result.message, status);
  }
  return successResponse(result, result.message);
}
