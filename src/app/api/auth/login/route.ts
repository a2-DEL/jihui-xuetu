import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { toLoginUser } from '@/lib/platform/demo-identities';
import { DemoIdentityProvider } from '@/lib/identity/demo-provider';

interface LoginRequest {
  username?: unknown;
  password?: unknown;
}

/**
 * 开发环境演示身份入口。
 * 生产环境禁止使用内置账号，必须接入学校统一身份认证或经过审计的企业 IdP。
 */
export async function POST(request: NextRequest) {
  let body: LoginRequest;
  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return errorResponse('请求格式不正确');
  }

  if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username || !body.password) {
    return errorResponse('用户名和密码不能为空');
  }

  const identity = new DemoIdentityProvider().authenticate(body.username.trim(), body.password);
  if (!identity) return errorResponse('用户名或密码错误');

  return successResponse({ token: identity.id, user: toLoginUser(identity) }, '登录成功');
}

