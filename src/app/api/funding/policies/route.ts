import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { createFundingPolicy, listFundingPolicies } from '@/lib/platform/demo-store';
import { resolveRequestActor } from '@/lib/platform/request-actor';

interface CreatePolicyBody { code?: unknown; name?: unknown; category?: unknown; authority?: unknown; versionNo?: unknown; summary?: unknown; effectiveFrom?: unknown; effectiveTo?: unknown; sourceFileName?: unknown }
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  return successResponse(listFundingPolicies(actor));
}

export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse('创建政策必须提供有效的 Idempotency-Key');
  let body: CreatePolicyBody;
  try { body = (await request.json()) as CreatePolicyBody; } catch { return errorResponse('请求格式不正确'); }
  const input = { code: text(body.code).toUpperCase(), name: text(body.name), category: text(body.category), authority: text(body.authority), versionNo: text(body.versionNo), summary: text(body.summary), effectiveFrom: text(body.effectiveFrom), effectiveTo: text(body.effectiveTo), sourceFileName: text(body.sourceFileName), idempotencyKey };
  if (!/^[A-Z0-9-]{5,40}$/.test(input.code)) return errorResponse('政策编码应为5至40位大写字母、数字或短横线');
  if (input.name.length < 4 || input.name.length > 100) return errorResponse('政策名称长度应为4至100个字符');
  if (!input.category || !input.authority || !input.versionNo || input.summary.length < 10 || !input.sourceFileName) return errorResponse('政策类别、发文单位、版本、摘要和来源文件不能为空');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveTo) || input.effectiveTo < input.effectiveFrom) return errorResponse('政策有效期不合法');
  const result = createFundingPolicy(actor, input);
  if (!result.success) return errorResponse(result.message, result.code === 'POLICY_CODE_EXISTS' ? 409 : 403);
  return successResponse(result.policy, result.message);
}
