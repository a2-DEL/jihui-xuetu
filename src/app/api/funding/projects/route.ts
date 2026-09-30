import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { createAidProject, listAidProjects } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

interface CreateProjectBody { code?: unknown; policyId?: unknown; name?: unknown; category?: unknown; academicYear?: unknown; budgetAmount?: unknown; defaultAmount?: unknown; quota?: unknown; applicationStart?: unknown; applicationEnd?: unknown; criteria?: unknown }
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  return successResponse(listAidProjects(actor));
}

export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('创建项目必须提供有效的 Idempotency-Key');
  let body: CreateProjectBody;
  try { body = (await request.json()) as CreateProjectBody; } catch { return errorResponse('请求格式不正确'); }
  const input = { code: text(body.code).toUpperCase(), policyId: text(body.policyId), name: text(body.name), category: text(body.category), academicYear: text(body.academicYear), budgetAmount: body.budgetAmount, defaultAmount: body.defaultAmount, quota: body.quota, applicationStart: text(body.applicationStart), applicationEnd: text(body.applicationEnd), criteria: text(body.criteria) };
  if (!/^[A-Z0-9-]{5,40}$/.test(input.code)) return errorResponse('项目编码应为5至40位大写字母、数字或短横线');
  if (!input.policyId || input.name.length < 4 || !input.category || !/^\d{4}-\d{4}$/.test(input.academicYear)) return errorResponse('关联政策、项目名称、类别和学年不能为空');
  if (typeof input.budgetAmount !== 'number' || !Number.isFinite(input.budgetAmount) || input.budgetAmount <= 0 || typeof input.defaultAmount !== 'number' || !Number.isFinite(input.defaultAmount) || input.defaultAmount <= 0 || typeof input.quota !== 'number' || !Number.isInteger(input.quota) || input.quota <= 0) return errorResponse('预算、默认标准和名额必须为有效正数');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.applicationStart) || !/^\d{4}-\d{2}-\d{2}$/.test(input.applicationEnd) || input.applicationEnd < input.applicationStart) return errorResponse('申请开放时间不合法');
  if (input.criteria.length < 10 || input.criteria.length > 1000) return errorResponse('申请条件长度应为10至1000个字符');
  const result = createAidProject(actor, { ...input, budgetAmount: input.budgetAmount, defaultAmount: input.defaultAmount, quota: input.quota, idempotencyKey });
  if (!result.success) return errorResponse(result.message, result.code.endsWith('EXISTS') ? 409 : 403);
  return successResponse(result.project, result.message);
}
