import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { processFundingPolicyAction, type FundingPolicyAction } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

const ACTIONS: readonly FundingPolicyAction[] = ['submit', 'approve', 'reject', 'retire'];
interface ActionBody { action?: unknown; expectedVersion?: unknown; comment?: unknown; humanConfirmed?: unknown }

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('业务写操作必须提供有效的 Idempotency-Key');
  let body: ActionBody;
  try { body = (await request.json()) as ActionBody; } catch { return errorResponse('请求格式不正确'); }
  if (body.humanConfirmed !== true) return errorResponse('政策发布与状态变更需要当前处理人明确确认', 409);
  if (typeof body.action !== 'string' || !ACTIONS.includes(body.action as FundingPolicyAction)) return errorResponse('不支持的政策动作');
  if (typeof body.expectedVersion !== 'number' || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) return errorResponse('缺少有效的政策版本号');
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length < 2 || comment.length > 500) return errorResponse('处理意见长度应为2至500个字符');
  const { id } = await context.params;
  const result = processFundingPolicyAction(actor, { policyId: id, action: body.action as FundingPolicyAction, expectedVersion: body.expectedVersion, comment, idempotencyKey });
  if (!result.success) return errorResponse(result.message, result.code === 'VERSION_CONFLICT' ? 409 : result.code === 'POLICY_NOT_FOUND' ? 404 : 403);
  return successResponse(result.policy, result.message);
}
