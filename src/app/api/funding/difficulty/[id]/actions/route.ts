import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { processDifficultyAction, type DifficultyAction, type DifficultyLevel } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

const ACTIONS: readonly DifficultyAction[] = ['submit_democratic_review', 'department_approve', 'department_return', 'school_confirm', 'school_return', 'restart_review'];
const LEVELS: readonly DifficultyLevel[] = ['一般困难', '困难', '特别困难', '不予认定'];
interface ActionBody { action?: unknown; expectedVersion?: unknown; comment?: unknown; humanConfirmed?: unknown; votesAgree?: unknown; votesTotal?: unknown; finalLevel?: unknown }

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('业务写操作必须提供有效的 Idempotency-Key');
  let body: ActionBody;
  try { body = (await request.json()) as ActionBody; } catch { return errorResponse('请求格式不正确'); }
  if (body.humanConfirmed !== true) return errorResponse('困难认定结论必须由当前处理人明确确认', 409);
  if (typeof body.action !== 'string' || !ACTIONS.includes(body.action as DifficultyAction)) return errorResponse('不支持的认定动作');
  if (typeof body.expectedVersion !== 'number' || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) return errorResponse('缺少有效的数据版本号');
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length < 2 || comment.length > 500) return errorResponse('处理意见长度应为2至500个字符');
  if (body.action === 'school_confirm' && (typeof body.finalLevel !== 'string' || !LEVELS.includes(body.finalLevel as DifficultyLevel))) return errorResponse('请选择人工确认的困难等级');
  const { id } = await context.params;
  const result = processDifficultyAction(actor, { assessmentId: id, action: body.action as DifficultyAction, expectedVersion: body.expectedVersion, comment, idempotencyKey, votesAgree: typeof body.votesAgree === 'number' ? body.votesAgree : undefined, votesTotal: typeof body.votesTotal === 'number' ? body.votesTotal : undefined, finalLevel: typeof body.finalLevel === 'string' ? body.finalLevel as DifficultyLevel : undefined });
  if (!result.success) return errorResponse(result.message, result.code === 'VERSION_CONFLICT' ? 409 : result.code === 'ASSESSMENT_NOT_FOUND' ? 404 : 403);
  return successResponse(result.assessment, result.message);
}
