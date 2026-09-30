import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { getFeatureCoverageSummary, getRoleFeatureGroups } from '@/lib/platform/feature-coverage';
import { resolveRequestActor } from '@/lib/platform/request-actor';
import { buildActorRoleContext } from '@/lib/platform/role-context';
import { ROLE_PROFILES } from '@/lib/platform/roles';

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);

  const groups = getRoleFeatureGroups(actor);
  const profile = ROLE_PROFILES[actor.role];
  return successResponse({
    role: {
      code: profile.code,
      name: profile.name,
      category: profile.category,
      dataScope: profile.dataScope,
      dashboard: profile.dashboard,
      permissions: profile.permissions,
      capabilities: actor.capabilities ?? [],
    },
    summary: getFeatureCoverageSummary(groups),
    groups,
    context: buildActorRoleContext(actor),
    baseline: {
      name: '角色功能规划表_v6',
      policy: '功能状态按真实交付情况标记；未完成能力不得伪装为可用。',
    },
  });
}
