import { NextRequest } from 'next/server';
import { getSupabaseClient } from './supabase-client';
import { successResponse, errorResponse } from './api-utils';

// 用户信息接口
export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: string;
  departmentId?: string;
  position?: string;
  roles: string[];
  permissions: string[];
}

// 从请求头获取Token
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// 验证Token并获取用户信息
export async function verifyToken(token: string): Promise<UserInfo | null> {
  try {
    const client = getSupabaseClient();
    
    // 这里简化处理，实际应该验证JWT token
    // 查询用户信息
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', token)
      .single();
    
    if (error || !user) {
      return null;
    }
    
    // 获取用户角色
    const { data: userRoles } = await client
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', user.id);
    
    const roles = userRoles?.map((ur: { roles: { code: string }[] } | null) => {
      if (!ur?.roles || ur.roles.length === 0) return null;
      return ur.roles[0]?.code;
    }).filter(Boolean) as string[] || [];
    
    return {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      departmentId: user.department_id,
      position: user.position,
      roles: roles as string[],
      permissions: [],
    };
  } catch {
    return null;
  }
}

// 认证中间件
export async function withAuth(
  request: NextRequest,
  handler: (user: UserInfo) => Promise<Response>,
): Promise<Response> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return errorResponse('未提供认证令牌', 401);
  }
  
  const user = await verifyToken(token);
  
  if (!user) {
    return errorResponse('无效的认证令牌', 401);
  }
  
  if (user.status !== 'active') {
    return errorResponse('账户已被禁用', 403);
  }
  
  return handler(user);
}

// 权限检查
export function hasPermission(user: UserInfo, permission: string): boolean {
  return user.permissions.includes(permission) || user.roles.includes('admin');
}

// 角色检查
export function hasRole(user: UserInfo, role: string): boolean {
  return user.roles.includes(role) || user.roles.includes('admin');
}
