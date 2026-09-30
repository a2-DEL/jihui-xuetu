/**
 * 冀慧学途统一角色目录。
 * 系统按 17 个独立 RBAC 角色建模，DATA_ADMIN 不再作为附加能力包使用。
 */
export const ROLE_CODES = [
  'SYS_ADMIN',
  'AI_OPS',
  'SCHOOL_LEADER',
  'FUND_LEADER',
  'STU_AFFAIRS',
  'FUND_ADMIN',
  'FINANCE',
  'DEPT_ADMIN',
  'COUNSELOR',
  'STUDENT',
  'BANK',
  'AUDIT_EXTERNAL',
  'EDU_BUREAU',
  'AUDITOR',
  'DISCIPLINE',
  'DATA_ADMIN',
  'PUBLIC_OPINION',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];
export type DataScope = 'platform' | 'school' | 'department' | 'class' | 'self' | 'assigned' | 'external-task';
export type CapabilityCode = 'DATA_ADMIN';

export interface RoleProfile {
  code: RoleCode;
  name: string;
  category: string;
  dataScope: DataScope;
  dashboard: string;
  assistantName: string;
  assistantEmoji: string;
  permissions: readonly string[];
}

const BASE_PERMISSIONS = ['assistant:use', 'notification:read', 'profile:manage'] as const;

export const ROLE_PROFILES: Record<RoleCode, RoleProfile> = {
  SYS_ADMIN: {
    code: 'SYS_ADMIN', name: '系统管理员', category: '技术与平台', dataScope: 'platform', dashboard: '平台运营驾驶舱', assistantName: '小海豚·智枢', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'system:manage', 'organization:manage', 'role:manage', 'security:manage', 'workflow:configure'],
  },
  AI_OPS: {
    code: 'AI_OPS', name: 'AI运维管理员', category: '技术与平台', dataScope: 'platform', dashboard: 'AI运维驾驶舱', assistantName: '小海豚·灵枢', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'ai:operate', 'agent:manage', 'model:manage', 'knowledge:operate', 'guardrail:manage', 'eval:manage'],
  },
  SCHOOL_LEADER: {
    code: 'SCHOOL_LEADER', name: '校领导 / 管理层', category: '学校管理·业务决策层', dataScope: 'school', dashboard: '领导驾驶舱', assistantName: '小海豚·决策参谋', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'dashboard:school', 'report:school', 'budget:approve-major', 'risk:read'],
  },
  FUND_LEADER: {
    code: 'FUND_LEADER', name: '校级资助中心领导 / 分管副主任', category: '学校管理·业务决策层', dataScope: 'school', dashboard: '资助决策驾驶舱', assistantName: '小海豚·资助参谋', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'fund:approve-exception', 'appeal:adjudicate', 'application:school-review', 'risk:read'],
  },
  STU_AFFAIRS: {
    code: 'STU_AFFAIRS', name: '学工部领导 / 资助育人专员', category: '学校管理·业务决策层', dataScope: 'school', dashboard: '育人成效驾驶舱', assistantName: '小海豚·育人伙伴', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'education:manage', 'outcome:read', 'case:manage', 'policy:evaluate'],
  },
  FUND_ADMIN: {
    code: 'FUND_ADMIN', name: '校级资助中心管理员', category: '学校管理·业务执行层', dataScope: 'school', dashboard: '资助业务驾驶舱', assistantName: '小海豚·业务管家', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'fund:manage', 'application:school-review', 'publicity:manage', 'appeal:handle', 'report:school'],
  },
  FINANCE: {
    code: 'FINANCE', name: '校级财务', category: '学校管理·业务执行层', dataScope: 'school', dashboard: '资金驾驶舱', assistantName: '小海豚·资金助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'budget:manage', 'grant:prepare', 'reconciliation:manage', 'voucher:manage'],
  },
  DEPT_ADMIN: {
    code: 'DEPT_ADMIN', name: '院系资助管理员', category: '院系执行', dataScope: 'department', dashboard: '院系驾驶舱', assistantName: '小海豚·院系助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'application:department-review', 'fund:department-manage', 'report:department', 'publicity:department'],
  },
  COUNSELOR: {
    code: 'COUNSELOR', name: '辅导员', category: '院系执行', dataScope: 'class', dashboard: '班级驾驶舱', assistantName: '小海豚·班级助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'application:first-review', 'student:class-read', 'evaluation:organize', 'reminder:create'],
  },
  STUDENT: {
    code: 'STUDENT', name: '学生', category: '学生服务', dataScope: 'self', dashboard: '个人资助画像', assistantName: '小海豚·助学伙伴', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'application:self-manage', 'appeal:self-manage', 'privacy:self-manage', 'fund:self-read'],
  },
  BANK: {
    code: 'BANK', name: '银行工作人员', category: '外部协作', dataScope: 'assigned', dashboard: '银行对接驾驶舱', assistantName: '小海豚·银校助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'bank:account-verify', 'bank:receipt-manage', 'bank:reconciliation'],
  },
  AUDIT_EXTERNAL: {
    code: 'AUDIT_EXTERNAL', name: '第三方审计机构', category: '外部协作', dataScope: 'external-task', dashboard: '审计任务驾驶舱', assistantName: '小海豚·审计协作员', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'audit:assigned-read', 'audit:evidence-read', 'audit:confirm'],
  },
  EDU_BUREAU: {
    code: 'EDU_BUREAU', name: '教育厅监管员', category: '监管与监督', dataScope: 'school', dashboard: '监管驾驶舱', assistantName: '小海豚·监管助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'regulation:read', 'report:regulatory', 'audit:supervise'],
  },
  AUDITOR: {
    code: 'AUDITOR', name: '审计人员', category: '监管与监督', dataScope: 'assigned', dashboard: '审计驾驶舱', assistantName: '小海豚·鉴真助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'audit:read', 'audit:evidence-read', 'ai:audit-read', 'risk:investigate'],
  },
  DISCIPLINE: {
    code: 'DISCIPLINE', name: '纪检人员', category: '监管与监督', dataScope: 'assigned', dashboard: '纪检驾驶舱', assistantName: '小海豚·廉洁助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'discipline:case-manage', 'discipline:withdraw-authorize', 'discipline:clue-read'],
  },
  DATA_ADMIN: {
    code: 'DATA_ADMIN', name: '数据管理员', category: '数据与内容管理', dataScope: 'platform', dashboard: '数据治理驾驶舱', assistantName: '小海豚·数据守护', assistantEmoji: 'DB',
    permissions: [...BASE_PERMISSIONS, 'data:quality-read', 'data:security-read', 'data:standard-read', 'data:sharing-read', 'backup:read', 'audit:read'],
  },
  PUBLIC_OPINION: {
    code: 'PUBLIC_OPINION', name: '舆情管理员', category: '数据与内容管理', dataScope: 'school', dashboard: '舆情驾驶舱', assistantName: '小海豚·舆情助手', assistantEmoji: '🐬',
    permissions: [...BASE_PERMISSIONS, 'opinion:manage', 'opinion:monitor', 'opinion:respond'],
  },
};

export const LEGACY_ROLE_MAP: Record<string, RoleCode> = {
  super_admin: 'SYS_ADMIN',
  admin: 'SYS_ADMIN',
  school_admin: 'FUND_ADMIN',
  dept_admin: 'DEPT_ADMIN',
  counselor: 'COUNSELOR',
  student: 'STUDENT',
  bank_staff: 'BANK',
  auditor: 'EDU_BUREAU',
  data_admin: 'DATA_ADMIN',
};

export function isRoleCode(value: string): value is RoleCode {
  return ROLE_CODES.includes(value as RoleCode);
}

export function normalizeRole(value: string | undefined | null): RoleCode | null {
  if (!value) return null;
  if (isRoleCode(value)) return value;
  return LEGACY_ROLE_MAP[value] ?? null;
}

export function getRoleProfile(value: string | undefined | null): RoleProfile | null {
  const code = normalizeRole(value);
  return code ? ROLE_PROFILES[code] : null;
}

export function hasCapability(capabilities: readonly string[] | undefined, capability: CapabilityCode): boolean {
  return capabilities?.includes(capability) ?? false;
}

