import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { processAidProjectAction, type AidProjectAction } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

const ACTIONS: readonly AidProjectAction[] = ['submit', 'approve', 'reject', 'suspend', 'reopen', 'close', 'adjust_quota'];
interface ActionBody { action?: unknown; expectedVersion?: unknown; comment?: unknown; humanConfirmed?: unknown; quota?: unknown }

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('业务写操作必须提供有效的 Idempotency-Key');
  let body: ActionBody;
  try { body = (await request.json()) as ActionBody; } catch { return errorResponse('请求格式不正确'); }
  if (body.humanConfirmed !== true) return errorResponse('项目状态或名额变更需要当前处理人明确确认', 409);
  if (typeof body.action !== 'string' || !ACTIONS.includes(body.action as AidProjectAction)) return errorResponse('不支持的项目动作');
  if (typeof body.expectedVersion !== 'number' || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) return errorResponse('缺少有效的项目版本号');
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length < 2 || comment.length > 500) return errorResponse('处理意见长度应为2至500个字符');
  if (body.action === 'adjust_quota' && (typeof body.quota !== 'number' || !Number.isInteger(body.quota))) return errorResponse('名额调整必须提供整数名额');
  const { id } = await context.params;
  const result = processAidProjectAction(actor, { projectId: id, action: body.action as AidProjectAction, expectedVersion: body.expectedVersion, comment, idempotencyKey, quota: typeof body.quota === 'number' ? body.quota : undefined });
  if (!result.success) return errorResponse(result.message, result.code === 'VERSION_CONFLICT' ? 409 : result.code === 'PROJECT_NOT_FOUND' ? 404 : 403);
  return successResponse(result.project, result.message);
}
