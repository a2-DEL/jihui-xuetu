import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { DEMO_IDENTITIES } from '@/lib/platform/demo-identities';
import { roleDirectory } from '@/lib/platform/role-context';
import { resolveRequestActor } from '@/lib/platform/request-actor';

const REGISTRY_READ_ROLES = ['SYS_ADMIN', 'DATA_ADMIN', 'AUDITOR'] as const;

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  if (!(REGISTRY_READ_ROLES as readonly string[]).includes(actor.role)) {
    return errorResponse('当前岗位无权读取全局角色注册表', 403);
  }
  const counts = DEMO_IDENTITIES.reduce<Record<string, number>>((result, identity) => {
    result[identity.role] = (result[identity.role] ?? 0) + 1;
    return result;
  }, {});
  const roles = roleDirectory().map((role) => ({ ...role, userCount: counts[role.code] ?? 0 }));
  return successResponse({
    version: 'v2.0',
    generatedAt: new Date().toISOString(),
    model: '17-role-independent-rbac',
    roles,
    summary: { roles: roles.length, teams: roles.length, agents: roles.reduce((sum, role) => sum + role.governance.agentTeam.length, 0), activeDemoIdentities: DEMO_IDENTITIES.length },
    safeguards: ['角色权限与Agent权限取交集', '数据管理员无业务决策权', '高风险AI操作必须人工审批', '默认拒绝跨组织与跨任务数据'],
  });
}
