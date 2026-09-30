import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { type ActorContext } from './authorization';
import { type CapabilityCode, type RoleCode, ROLE_PROFILES } from './roles';

export interface DemoIdentity {
  id: string;
  username: string;
  password: string;
  role: RoleCode;
  realName: string;
  departmentIds?: readonly string[];
  classIds?: readonly string[];
  assignedTaskIds?: readonly string[];
  capabilities?: readonly CapabilityCode[];
}

const CAMPUS_IDS = ['campus-main'] as const;

export const DEMO_IDENTITIES: readonly DemoIdentity[] = [
  { id: 'demo-sys-admin', username: 'sys_admin', password: 'Demo@123', role: 'SYS_ADMIN', realName: '李平台' },
  { id: 'demo-ai-ops', username: 'ai_ops', password: 'Demo@123', role: 'AI_OPS', realName: '周智能' },
  { id: 'demo-school-leader', username: 'school_leader', password: 'Demo@123', role: 'SCHOOL_LEADER', realName: '王校长' },
  { id: 'demo-fund-leader', username: 'fund_leader', password: 'Demo@123', role: 'FUND_LEADER', realName: '陈主任' },
  { id: 'demo-stu-affairs', username: 'stu_affairs', password: 'Demo@123', role: 'STU_AFFAIRS', realName: '赵老师' },
  { id: 'demo-fund-admin', username: 'fund_admin', password: 'Demo@123', role: 'FUND_ADMIN', realName: '孙管理员' },
  { id: 'demo-finance', username: 'finance', password: 'Demo@123', role: 'FINANCE', realName: '钱会计' },
  { id: 'demo-dept-admin', username: 'dept_admin', password: 'Demo@123', role: 'DEPT_ADMIN', realName: '吴院管', departmentIds: ['dept-agri'] },
  { id: 'demo-counselor', username: 'counselor', password: 'Demo@123', role: 'COUNSELOR', realName: '郑辅导员', departmentIds: ['dept-agri'], classIds: ['class-agri-01'] },
  { id: 'demo-student', username: 'student', password: 'Demo@123', role: 'STUDENT', realName: '李明', departmentIds: ['dept-agri'], classIds: ['class-agri-01'] },
  { id: 'demo-bank', username: 'bank_staff', password: 'Demo@123', role: 'BANK', realName: '冯银行' },
  { id: 'demo-ext-audit', username: 'audit_external', password: 'Demo@123', role: 'AUDIT_EXTERNAL', realName: '褚外审', assignedTaskIds: ['audit-task-2026-01'] },
  { id: 'demo-edu-bureau', username: 'edu_bureau', password: 'Demo@123', role: 'EDU_BUREAU', realName: '卫监管' },
  { id: 'demo-auditor', username: 'auditor', password: 'Demo@123', role: 'AUDITOR', realName: '蒋审计', assignedTaskIds: ['audit-task-2026-01'] },
  { id: 'demo-discipline', username: 'discipline', password: 'Demo@123', role: 'DISCIPLINE', realName: '沈纪检', assignedTaskIds: ['discipline-case-2026-01'] },
  { id: 'demo-data-admin', username: 'data_admin', password: 'Demo@123', role: 'DATA_ADMIN', realName: '林数据' },
  { id: 'demo-public-opinion', username: 'public_opinion', password: 'Demo@123', role: 'PUBLIC_OPINION', realName: '韩舆情' },
];

interface PasswordOverride { salt: string; hash: string }
const passwordOverrides = new Map<string, PasswordOverride>();

function passwordMatches(identity: DemoIdentity, password: string): boolean {
  const override = passwordOverrides.get(identity.id);
  if (!override) return identity.password === password;
  const candidate = scryptSync(password, override.salt, 64);
  const expected = Buffer.from(override.hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function findDemoIdentityByCredentials(username: string, password: string): DemoIdentity | null {
  const identity = DEMO_IDENTITIES.find((item) => item.username === username);
  return identity && passwordMatches(identity, password) ? identity : null;
}

export function changeDemoIdentityPassword(userId: string, currentPassword: string, newPassword: string): { success: boolean; message: string } {
  const identity = DEMO_IDENTITIES.find((item) => item.id === userId);
  if (!identity || !passwordMatches(identity, currentPassword)) return { success: false, message: '当前密码不正确。' };
  if (newPassword === currentPassword) return { success: false, message: '新密码不能与当前密码相同。' };
  if (newPassword.length < 10 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
    return { success: false, message: '新密码至少10位，且必须包含大小写字母、数字和特殊字符。' };
  }
  const salt = randomBytes(16).toString('hex');
  passwordOverrides.set(identity.id, { salt, hash: scryptSync(newPassword, salt, 64).toString('hex') });
  return { success: true, message: '密码已修改，请在下次登录时使用新密码。' };
}

export function findDemoIdentityByToken(token: string | null): DemoIdentity | null {
  if (!token) return null;
  return DEMO_IDENTITIES.find((identity) => identity.id === token) ?? null;
}

export function toActorContext(identity: DemoIdentity): ActorContext {
  return {
    userId: identity.id,
    role: identity.role,
    campusIds: CAMPUS_IDS,
    departmentIds: identity.departmentIds,
    classIds: identity.classIds,
    assignedTaskIds: identity.assignedTaskIds,
    capabilities: identity.capabilities,
    authenticated: true,
  };
}

const ROLE_LANDING_PATH: Record<RoleCode, string> = {
  SYS_ADMIN: '/platform-governance', AI_OPS: '/agent/monitor', SCHOOL_LEADER: '/decision-center', FUND_LEADER: '/decision-center',
  STU_AFFAIRS: '/student-affairs', FUND_ADMIN: '/frontline-center', FINANCE: '/finance', DEPT_ADMIN: '/frontline-center',
  COUNSELOR: '/frontline-center', STUDENT: '/student/portal', BANK: '/bank/portal', AUDIT_EXTERNAL: '/auditor/portal',
  EDU_BUREAU: '/dashboard/overview', AUDITOR: '/auditor/portal', DISCIPLINE: '/auditor/portal', DATA_ADMIN: '/data-governance', PUBLIC_OPINION: '/dashboard/overview',
};

export function toLoginUser(identity: DemoIdentity) {
  const profile = ROLE_PROFILES[identity.role];
  return {
    id: identity.id,
    username: identity.username,
    realName: identity.realName,
    name: identity.realName,
    role: identity.role,
    departmentId: identity.departmentIds?.[0] ?? 'school-office',
    classId: identity.classIds?.[0],
    studentId: identity.role === 'STUDENT' ? '2024001001' : undefined,
    position: profile.name,
    landingPath: ROLE_LANDING_PATH[identity.role],
    roles: [{ id: `role-${identity.role.toLowerCase()}`, code: identity.role, name: profile.name }],
    capabilities: identity.capabilities ?? [],
    menus: [],
  };
}



