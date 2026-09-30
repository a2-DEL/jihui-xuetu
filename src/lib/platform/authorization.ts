import { type CapabilityCode, type DataScope, type RoleCode, ROLE_PROFILES } from './roles';

export const SENSITIVE_LEVELS = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'] as const;
export type SensitiveLevel = (typeof SENSITIVE_LEVELS)[number];
export const AI_RISK_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const;
export type AiRiskLevel = (typeof AI_RISK_LEVELS)[number];

export interface ActorContext {
  userId: string;
  role: RoleCode;
  campusIds: readonly string[];
  departmentIds?: readonly string[];
  classIds?: readonly string[];
  assignedTaskIds?: readonly string[];
  capabilities?: readonly CapabilityCode[];
  authenticated: boolean;
}

export interface ResourceContext {
  campusId?: string;
  departmentId?: string;
  classId?: string;
  ownerId?: string;
  assignedTaskId?: string;
  sensitiveLevel: SensitiveLevel;
  processState?: string;
  currentHandlerId?: string;
}

export interface AccessRequest {
  permission: string;
  resource?: ResourceContext;
  requiresWorkHours?: boolean;
  requiresCampusNetwork?: boolean;
  onCampusNetwork?: boolean;
  now?: Date;
}

export interface AuthorizationDecision {
  allowed: boolean;
  code: string;
  reason: string;
  fieldMode: 'full' | 'masked' | 'hidden';
  requiredApprovals: number;
}

const RISK_REQUIREMENTS: Record<AiRiskLevel, { confirmation: boolean; approvals: number; executable: boolean }> = {
  L0: { confirmation: false, approvals: 0, executable: true },
  L1: { confirmation: true, approvals: 0, executable: true },
  L2: { confirmation: false, approvals: 0, executable: true },
  L3: { confirmation: true, approvals: 0, executable: true },
  L4: { confirmation: true, approvals: 1, executable: false },
  L5: { confirmation: true, approvals: 2, executable: false },
};

function deny(code: string, reason: string, approvals = 0): AuthorizationDecision {
  return { allowed: false, code, reason, fieldMode: 'hidden', requiredApprovals: approvals };
}

function hasOrganizationScope(actor: ActorContext, resource: ResourceContext): boolean {
  const scope: DataScope = ROLE_PROFILES[actor.role].dataScope;
  if (scope === 'platform') return true;
  if (resource.campusId && !actor.campusIds.includes(resource.campusId)) return false;
  if (scope === 'school') return true;
  if (scope === 'department') return Boolean(resource.departmentId && actor.departmentIds?.includes(resource.departmentId));
  if (scope === 'class') return Boolean(resource.classId && actor.classIds?.includes(resource.classId));
  if (scope === 'self') return resource.ownerId === actor.userId;
  if (scope === 'assigned' || scope === 'external-task') {
    return Boolean(resource.assignedTaskId && actor.assignedTaskIds?.includes(resource.assignedTaskId));
  }
  return false;
}

function fieldModeFor(role: RoleCode, level: SensitiveLevel): 'full' | 'masked' | 'hidden' {
  if (level === 'P0' || level === 'P1') return 'full';
  if (level === 'P2') return 'full';
  if (level === 'P3') {
    return role === 'STUDENT' || role === 'BANK' || role === 'FINANCE' || role === 'DATA_ADMIN' ? 'full' : 'masked';
  }
  if (level === 'P4') {
    return role === 'AUDITOR' || role === 'DISCIPLINE' || role === 'AI_OPS' || role === 'DATA_ADMIN' ? 'full' : 'hidden';
  }
  return role === 'DISCIPLINE' ? 'full' : 'hidden';
}

/** Campus business hours use Asia/Shanghai, not the deployment host timezone. */
export function isCampusWorkHours(now: Date): boolean {
  if (!Number.isFinite(now.getTime())) return false;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const weekday = parts.find((item) => item.type === 'weekday')?.value;
  const hour = Number(parts.find((item) => item.type === 'hour')?.value);
  return weekday !== 'Sat' && weekday !== 'Sun' && Number.isFinite(hour) && hour >= 8 && hour < 18;
}

function isWithinWorkHours(now: Date): boolean {
  return isCampusWorkHours(now);
}

export function evaluateAccess(actor: ActorContext, request: AccessRequest): AuthorizationDecision {
  if (!actor.authenticated) return deny('UNAUTHENTICATED', '未完成身份认证');
  const profile = ROLE_PROFILES[actor.role];
  if (!profile.permissions.includes(request.permission)) {
    return deny('RBAC_DENIED', `角色“${profile.name}”不具备 ${request.permission} 权限`);
  }
  if (request.requiresWorkHours && !isWithinWorkHours(request.now ?? new Date())) {
    return deny('TIME_DENIED', '该敏感操作仅允许在工作时间执行');
  }
  if (request.requiresCampusNetwork && !request.onCampusNetwork) {
    return deny('NETWORK_DENIED', '该管理操作需要从校内网络或堡垒机发起');
  }
  if (!request.resource) {
    return { allowed: true, code: 'ALLOW', reason: '权限校验通过', fieldMode: 'full', requiredApprovals: 0 };
  }
  if (!hasOrganizationScope(actor, request.resource)) {
    return deny('SCOPE_DENIED', '目标数据不在当前角色的组织或任务授权范围内');
  }
  const fieldMode = fieldModeFor(actor.role, request.resource.sensitiveLevel);
  if (fieldMode === 'hidden') {
    return deny('SENSITIVE_DENIED', `无权访问 ${request.resource.sensitiveLevel} 级敏感数据`);
  }
  if (request.resource.currentHandlerId && request.resource.currentHandlerId !== actor.userId) {
    return deny('HANDLER_DENIED', '当前流程节点不属于该处理人');
  }
  return { allowed: true, code: 'ALLOW', reason: '权限校验通过', fieldMode, requiredApprovals: 0 };
}

export function evaluateAiAction(
  actor: ActorContext,
  toolPermission: string,
  riskLevel: AiRiskLevel,
  options: { userConfirmed?: boolean; approvedBy?: readonly string[]; onCampusNetwork?: boolean } = {},
): AuthorizationDecision {
  const access = evaluateAccess(actor, {
    permission: toolPermission,
    requiresWorkHours: riskLevel === 'L4' || riskLevel === 'L5',
    requiresCampusNetwork: riskLevel === 'L5',
    onCampusNetwork: options.onCampusNetwork,
  });
  if (!access.allowed) return access;

  const requirement = RISK_REQUIREMENTS[riskLevel];
  if (requirement.confirmation && !options.userConfirmed) {
    return deny('CONFIRMATION_REQUIRED', `${riskLevel} 级AI操作需要人工确认`, requirement.approvals);
  }
  if (options.approvedBy && options.approvedBy.length < requirement.approvals) {
    return deny('APPROVAL_REQUIRED', `${riskLevel} 级AI操作需要 ${requirement.approvals} 人审批`, requirement.approvals);
  }
  if (!requirement.executable) {
    return deny('HUMAN_ACTION_REQUIRED', `${riskLevel} 级操作只能生成方案，不能由AI直接执行`, requirement.approvals);
  }
  return { allowed: true, code: 'ALLOW', reason: 'AI操作护栏校验通过', fieldMode: 'full', requiredApprovals: requirement.approvals };
}

export function riskRequirements(level: AiRiskLevel): Readonly<{ confirmation: boolean; approvals: number; executable: boolean }> {
  return RISK_REQUIREMENTS[level];
}

