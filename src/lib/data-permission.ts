/**
 * 数据权限过滤和字段脱敏工具函数
 * 根据规划文档实现行级数据范围和列级字段脱敏
 */

// 角色类型定义
export type UserRole = 
  | 'super_admin' 
  | 'school_admin' 
  | 'dept_admin' 
  | 'counselor' 
  | 'student' 
  | 'bank_staff' 
  | 'auditor';

// 用户信息接口
export interface UserInfo {
  id: string;
  role: UserRole;
  name: string;
  departmentId?: string; // 院系ID
  classId?: string; // 班级ID（辅导员）
  studentId?: string; // 学号（学生）
}

// 数据范围类型
export type DataScope = 'all' | 'department' | 'class' | 'self' | 'loan_related';

// 脱敏规则类型
export type MaskRule = 'none' | 'id_card' | 'phone' | 'address' | 'bank_account' | 'credit_detail' | 'hidden';

// 字段脱敏函数
export const maskField = (value: string, rule: MaskRule): string => {
  if (!value || rule === 'none') return value;
  
  switch (rule) {
    case 'id_card':
      // 身份证脱敏: 130****1234
      if (value.length >= 8) {
        return value.slice(0, 3) + '****' + value.slice(-4);
      }
      return '****';
      
    case 'phone':
      // 手机号脱敏: 139****8000
      if (value.length >= 8) {
        return value.slice(0, 3) + '****' + value.slice(-4);
      }
      return '****';
      
    case 'address':
      // 地址脱敏: 仅显示省市
      const parts = value.split(/[省市区县]/);
      if (parts.length >= 2) {
        return parts[0] + '省' + (parts[1] ? parts[1] + '市' : '');
      }
      return value.slice(0, 6) + '...';
      
    case 'bank_account':
      // 银行账号脱敏: **** **** **** 1234
      if (value.length >= 4) {
        return '**** **** **** ' + value.slice(-4);
      }
      return '****';
      
    case 'credit_detail':
      // 信用分详情脱敏
      return '***';
      
    case 'hidden':
      // 完全隐藏
      return '不可见';
      
    default:
      return value;
  }
};

// 各角色字段脱敏规则映射
export const fieldMaskRules: Record<string, Record<UserRole, MaskRule>> = {
  idCard: {
    super_admin: 'none',
    school_admin: 'id_card',
    dept_admin: 'id_card',
    counselor: 'id_card',
    student: 'none',
    bank_staff: 'none',
    auditor: 'id_card',
  },
  phone: {
    super_admin: 'none',
    school_admin: 'phone',
    dept_admin: 'phone',
    counselor: 'none',
    student: 'none',
    bank_staff: 'phone',
    auditor: 'phone',
  },
  address: {
    super_admin: 'none',
    school_admin: 'address',
    dept_admin: 'none',
    counselor: 'none',
    student: 'none',
    bank_staff: 'address',
    auditor: 'address',
  },
  bankAccount: {
    super_admin: 'none',
    school_admin: 'none',
    dept_admin: 'none',
    counselor: 'hidden',
    student: 'none',
    bank_staff: 'none',
    auditor: 'bank_account',
  },
  creditDetail: {
    super_admin: 'none',
    school_admin: 'credit_detail',
    dept_admin: 'none',
    counselor: 'none',
    student: 'none',
    bank_staff: 'credit_detail',
    auditor: 'none',
  },
};

// 应用字段脱敏规则到学生数据
export const maskStudentData = <T extends Record<string, unknown>>(
  student: T,
  role: UserRole
): T => {
  const maskedStudent = { ...student } as Record<string, unknown>;
  
  // 身份证脱敏
  if ('idCard' in maskedStudent && maskedStudent.idCard && typeof maskedStudent.idCard === 'string') {
    maskedStudent.idCard = maskField(maskedStudent.idCard, fieldMaskRules.idCard[role]);
  }
  
  // 手机号脱敏
  if ('phone' in maskedStudent && maskedStudent.phone && typeof maskedStudent.phone === 'string') {
    maskedStudent.phone = maskField(maskedStudent.phone, fieldMaskRules.phone[role]);
  }
  
  // 地址脱敏
  if ('address' in maskedStudent && maskedStudent.address && typeof maskedStudent.address === 'string') {
    maskedStudent.address = maskField(maskedStudent.address, fieldMaskRules.address[role]);
  }
  
  // 银行账号脱敏
  if ('bankAccount' in maskedStudent && maskedStudent.bankAccount && typeof maskedStudent.bankAccount === 'string') {
    maskedStudent.bankAccount = maskField(maskedStudent.bankAccount, fieldMaskRules.bankAccount[role]);
  }
  
  return maskedStudent as T;
};

// 数据范围过滤函数
export const filterByDataScope = <T extends Record<string, unknown>>(
  data: T[],
  user: UserInfo
): T[] => {
  switch (user.role) {
    case 'super_admin':
    case 'school_admin':
      // 超级管理员和校级管理员可查看全部数据
      return data;
      
    case 'dept_admin':
      // 院系管理员只能查看本院系数据
      return data.filter(item => 
        'departmentId' in item && item.departmentId === user.departmentId
      );
      
    case 'counselor':
      // 辅导员只能查看所带班级数据
      return data.filter(item => 
        'classId' in item && item.classId === user.classId
      );
      
    case 'student':
      // 学生只能查看自己的数据
      return data.filter(item => 
        ('studentId' in item && item.studentId === user.studentId) ||
        ('id' in item && item.id === user.id)
      );
      
    case 'bank_staff':
      // 银行工作人员只能查看贷款相关数据
      return data.filter(item => 
        'type' in item && (item.type === 'loan' || item.type === '助学贷款')
      );
      
    case 'auditor':
      // 审计员可查看全部数据（审计权限）
      return data;
      
    default:
      return [];
  }
};

// 权限检查函数
export const hasPermission = (
  user: UserInfo,
  permission: string
): boolean => {
  const permissionMatrix: Record<UserRole, string[]> = {
    super_admin: [
      'user:read', 'user:create', 'user:update', 'user:delete',
      'role:manage', 'application:create', 'application:read', 'application:update',
      'application:delete', 'application:submit', 'application:export',
      'approval:read', 'approval:approve', 'approval:reject', 'approval:transfer',
      'credit:read', 'credit:config', 'credit:adjust',
      'model:train', 'model:deploy', 'agent:orchestrate',
      'knowledge:manage', 'bank:sync', 'bank:conflict',
      'system:config', 'audit:log', 'dashboard:view',
    ],
    school_admin: [
      'user:read', 'user:update',
      'application:read', 'application:export',
      'approval:read', 'approval:approve', 'approval:reject', 'approval:transfer',
      'credit:read', 'credit:config',
      'knowledge:manage', 'bank:sync',
      'dashboard:view',
    ],
    dept_admin: [
      'user:read', 'user:update',
      'application:read', 'application:export',
      'approval:read', 'approval:approve', 'approval:reject', 'approval:transfer',
      'credit:read',
      'dashboard:view',
    ],
    counselor: [
      'user:read', 'user:update',
      'application:read', 'application:export',
      'approval:read', 'approval:approve', 'approval:reject', 'approval:transfer',
      'credit:read',
      'dashboard:view',
    ],
    student: [
      'user:read', 'user:update',
      'application:create', 'application:read', 'application:update', 
      'application:delete', 'application:submit',
      'credit:read',
    ],
    bank_staff: [
      'application:read', 'application:export',
      'approval:read', 'approval:approve', 'approval:reject', 'approval:transfer',
      'credit:read',
      'bank:sync', 'bank:conflict',
      'dashboard:view',
    ],
    auditor: [
      'audit:log', 'dashboard:view',
      'application:read', 'approval:read', 'credit:read',
    ],
  };
  
  return permissionMatrix[user.role]?.includes(permission) ?? false;
};

// 申请状态流转验证
export const canTransitionTo = (
  currentStatus: string,
  targetStatus: string,
  role: UserRole
): boolean => {
  // 状态流转规则
  const transitions: Record<string, { target: string; roles: UserRole[] }[]> = {
    draft: [
      { target: 'pending_first', roles: ['student', 'super_admin'] },
    ],
    pending_first: [
      { target: 'pending_college', roles: ['counselor', 'dept_admin', 'school_admin', 'super_admin'] },
      { target: 'rejected', roles: ['counselor', 'dept_admin', 'school_admin', 'super_admin'] },
    ],
    pending_college: [
      { target: 'pending_school', roles: ['dept_admin', 'school_admin', 'super_admin'] },
      { target: 'rejected', roles: ['dept_admin', 'school_admin', 'super_admin'] },
    ],
    pending_school: [
      { target: 'pending_bank', roles: ['school_admin', 'super_admin'] }, // 仅贷款类
      { target: 'approved', roles: ['school_admin', 'super_admin'] },
      { target: 'rejected', roles: ['school_admin', 'super_admin'] },
    ],
    pending_bank: [
      { target: 'approved', roles: ['bank_staff', 'super_admin'] },
      { target: 'rejected', roles: ['bank_staff', 'super_admin'] },
    ],
    approved: [
      { target: 'completed', roles: ['school_admin', 'super_admin'] },
    ],
    rejected: [], // 驳回状态不可流转
    completed: [], // 已完成不可流转
    cancelled: [], // 已取消不可流转
  };
  
  const allowedTransitions = transitions[currentStatus] || [];
  return allowedTransitions.some(
    t => t.target === targetStatus && t.roles.includes(role)
  );
};

// 获取状态显示信息
export const getStatusInfo = (status: string): { label: string; color: string; description: string } => {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    draft: { label: '草稿', color: 'gray', description: '学生保存草稿，未提交' },
    pending_first: { label: '待初审', color: 'orange', description: '已提交，待辅导员初审' },
    pending_college: { label: '待院系复核', color: 'blue', description: '辅导员初审通过，待院系复核' },
    pending_school: { label: '待校级终审', color: 'purple', description: '院系复核通过，待校级终审' },
    pending_bank: { label: '待银行审批', color: 'cyan', description: '校级通过，待银行审批（仅贷款类）' },
    approved: { label: '审批通过', color: 'green', description: '审批通过，待发放资金' },
    rejected: { label: '已驳回', color: 'red', description: '被驳回' },
    completed: { label: '已完成', color: 'green', description: '资金已发放，流程结束' },
    cancelled: { label: '已取消', color: 'gray', description: '学生撤销申请' },
  };
  
  return statusMap[status] || { label: status, color: 'gray', description: '' };
};
