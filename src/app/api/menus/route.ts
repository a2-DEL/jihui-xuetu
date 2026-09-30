import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/api-utils';
import { type RoleCode } from '@/lib/platform/roles';
import { getRoleFeatureGroups } from '@/lib/platform/feature-coverage';
import { resolveRequestActor } from '@/lib/platform/request-actor';

interface MenuItem {
  id: string;
  name: string;
  code: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

const assistantMenu: MenuItem = { id: 'assistant', name: '小海豚智能助手', code: 'assistant', icon: 'Brain', path: '/ai-assistant/chat' };
const notificationMenu: MenuItem = { id: 'notification', name: '消息中心', code: 'notification', icon: 'Bell', path: '/notification/center' };
const personalSettingsMenu: MenuItem = { id: 'settings', name: '个人与系统设置', code: 'settings', icon: 'Settings', path: '/settings' };
const platformTourMenu: MenuItem = { id: 'platform-tour', name: '平台全景导览', code: 'platform-tour', icon: 'Network', path: '/platform-tour', children: [{ id: 'tour-aid-system', name: '高校资助体系总览', code: 'tour-aid-system', icon: 'BookOpen', path: '/platform-tour' }, { id: 'tour-role-network', name: '17角色协作全景', code: 'tour-role-network', icon: 'Users', path: '/platform-tour/roles' }, { id: 'tour-core-process', name: '资助核心流程全景', code: 'tour-core-process', icon: 'Workflow', path: '/platform-tour/process' }, { id: 'tour-agent-live', name: '多Agent协作实况', code: 'tour-agent-live', icon: 'Bot', path: '/agent/monitor/collaboration' }] };

const dashboard = (path = '/dashboard/overview'): MenuItem => ({ id: 'dashboard', name: '数据可视化', code: 'dashboard', icon: 'LayoutDashboard', path, children: [{ id: 'overview', name: '角色驾驶舱', code: 'overview', icon: 'Gauge', path }, { id: 'screen', name: '数据大屏', code: 'screen', icon: 'Monitor', path: '/dashboard/screen' }] });
const applications: MenuItem = { id: 'applications', name: '资助申请', code: 'applications', icon: 'FileText', path: '/application/all', children: [{ id: 'application-all', name: '申请列表', code: 'application-all', icon: 'Files', path: '/application/all' }, { id: 'application-pending', name: '待处理', code: 'application-pending', icon: 'Clock', path: '/application/all?view=pending' }, { id: 'application-intake', name: '受理与补正', code: 'application-intake', icon: 'ClipboardCheck', path: '/application/intake' }, { id: 'application-create', name: '新建申请', code: 'application-create', icon: 'Upload', path: '/application/create' }] };
const frontlineCenter: MenuItem = { id: 'frontline-center', name: '资助协同作战室', code: 'frontline-center', icon: 'UserCheck', path: '/frontline-center', children: [{ id: 'frontline-tasks', name: '岗位待办', code: 'frontline-tasks', icon: 'CheckSquare', path: '/frontline-center?view=tasks' }, { id: 'frontline-students', name: '学生与材料', code: 'frontline-students', icon: 'Users', path: '/frontline-center?view=students' }, { id: 'frontline-quotas', name: '名额组织', code: 'frontline-quotas', icon: 'BarChart3', path: '/frontline-center?view=quotas' }, { id: 'frontline-interviews', name: '谈心谈话', code: 'frontline-interviews', icon: 'FileText', path: '/frontline-center?view=interviews' }, { id: 'frontline-notifications', name: '通知沟通', code: 'frontline-notifications', icon: 'Bell', path: '/frontline-center?view=notifications' }, { id: 'frontline-archives', name: '电子归档', code: 'frontline-archives', icon: 'FileStack', path: '/frontline-center?view=archives' }] };
const fundingOperations: MenuItem = { id: 'funding-operations', name: '资助业务中枢', code: 'funding-operations', icon: 'Gift', path: '/funding/management', children: [{ id: 'funding-management', name: '政策与项目', code: 'funding-management', icon: 'FolderOpen', path: '/funding/management' }, { id: 'funding-difficulty', name: '困难认定', code: 'funding-difficulty', icon: 'UserCheck', path: '/funding/difficulty' }, { id: 'funding-publicity', name: '公示与申诉', code: 'funding-publicity', icon: 'FileSearch', path: '/funding/publicity-appeals' }, { id: 'funding-applications', name: '申请全流程', code: 'funding-applications', icon: 'Files', path: '/application/all' } ] };
const decisionCenter: MenuItem = { id: 'decision-center', name: '校级决策中心', code: 'decision-center', icon: 'Gauge', path: '/decision-center', children: [{ id: 'decision-overview', name: '领导驾驶舱', code: 'decision-overview', icon: 'LayoutDashboard', path: '/decision-center?view=overview' }, { id: 'decision-exceptions', name: '重大与例外事项', code: 'decision-exceptions', icon: 'AlertTriangle', path: '/decision-center?view=exceptions' }, { id: 'decision-simulation', name: '预算沙盒模拟', code: 'decision-simulation', icon: 'Calculator', path: '/decision-center?view=simulation' }, { id: 'decision-policy', name: '政策效果评估', code: 'decision-policy', icon: 'BarChart3', path: '/decision-center?view=policy' }, { id: 'decision-briefs', name: '汇报材料', code: 'decision-briefs', icon: 'FileStack', path: '/decision-center?view=briefs' }] };const approvals: MenuItem = { id: 'approval', name: '审核与审批', code: 'approval', icon: 'CheckSquare', path: '/application/all', children: [{ id: 'approval-pending', name: '待审批', code: 'approval-pending', icon: 'Clock', path: '/application/all?view=pending' }, { id: 'approval-tasks', name: '我的待办', code: 'approval-tasks', icon: 'ListTodo', path: '/application/all?view=pending' }, { id: 'approval-ai', name: '智能审核建议', code: 'approval-ai', icon: 'Sparkles', path: '/ai-assistant/chat?scene=application-review' }, { id: 'approval-history', name: '审批历史', code: 'approval-history', icon: 'History', path: '/application/all?view=history' }] };
const reports: MenuItem = { id: 'reports', name: '报表与分析', code: 'reports', icon: 'BarChart3', path: '/report/statistics', children: [{ id: 'report-statistics', name: '统计分析', code: 'report-statistics', icon: 'BarChart3', path: '/report/statistics' }, { id: 'report-export', name: '报表导出', code: 'report-export', icon: 'Upload', path: '/report/export' }, { id: 'ciac', name: '资助智能评估', code: 'ciac', icon: 'Activity', path: '/ciac' }] };
const knowledge: MenuItem = { id: 'knowledge', name: '政策知识库', code: 'knowledge', icon: 'BookOpen', path: '/knowledge', children: [{ id: 'knowledge-documents', name: '知识文档', code: 'knowledge-documents', icon: 'FileStack', path: '/knowledge?view=documents' }, { id: 'knowledge-retrieval', name: '政策检索', code: 'knowledge-retrieval', icon: 'Search', path: '/knowledge?view=retrieval' }, { id: 'knowledge-versions', name: '版本管理', code: 'knowledge-versions', icon: 'History', path: '/knowledge?view=documents&mode=versions' }] };
const agents: MenuItem = { id: 'agents', name: '智能助手管理', code: 'agents', icon: 'Bot', path: '/agent', children: [{ id: 'agent-workflow', name: '智能流程', code: 'agent-workflow', icon: 'GitBranch', path: '/agent/studio?view=workflows' }, { id: 'agent-monitor', name: '运行监控', code: 'agent-monitor', icon: 'Activity', path: '/agent/monitor' }, { id: 'agent-collaboration', name: '协同指挥', code: 'agent-collaboration', icon: 'Network', path: '/agent/monitor/collaboration' }] };
const bank: MenuItem = { id: 'bank', name: '银校协同', code: 'bank', icon: 'Landmark', path: '/bank-cooperation/reconciliation', children: [{ id: 'bank-portal', name: '发放与回盘工作台', code: 'bank-portal', icon: 'Gauge', path: '/bank-cooperation/reconciliation' }, { id: 'bank-reconciliation', name: '对账管理', code: 'bank-reconciliation', icon: 'Calculator', path: '/bank-cooperation/reconciliation' }, { id: 'bank-sync', name: '回盘同步', code: 'bank-sync', icon: 'RefreshCw', path: '/bank-cooperation/sync-monitor' }] };
const audit: MenuItem = { id: 'audit', name: '监督审计', code: 'audit', icon: 'Shield', path: '/audit-center', children: [{ id: 'audit-overview', name: '全链路审计总览', code: 'audit-overview', icon: 'Gauge', path: '/audit-center' }, { id: 'audit-events', name: '审计事件流水', code: 'audit-events', icon: 'FileSearch', path: '/audit-center/events' }, { id: 'audit-ai', name: 'AI与Agent证据', code: 'audit-ai', icon: 'Activity', path: '/audit-center/events?category=AI_OPERATION' }, { id: 'audit-integrity', name: '证据链完整性', code: 'audit-integrity', icon: 'Shield', path: '/audit-center/integrity' }, { id: 'audit-findings', name: '审计发现与整改', code: 'audit-findings', icon: 'CheckSquare', path: '/auditor/portal' }] };
const regulatory: MenuItem = { id: 'regulatory', name: '教育监管', code: 'regulatory', icon: 'Shield', path: '/governance/regulatory', children: [{ id: 'regulatory-dashboard', name: '省级监管驾驶舱', code: 'regulatory-dashboard', icon: 'Monitor', path: '/governance/regulatory' }, { id: 'regulatory-audit', name: '整改与审计', code: 'regulatory-audit', icon: 'FileSearch', path: '/auditor/portal' }] };
const opinionGovernance: MenuItem = { id: 'opinion-governance', name: '舆情治理', code: 'opinion-governance', icon: 'Bell', path: '/governance/opinion', children: [{ id: 'opinion-monitor', name: '监测与响应', code: 'opinion-monitor', icon: 'Activity', path: '/governance/opinion' }, { id: 'opinion-publicity', name: '公示专项监测', code: 'opinion-publicity', icon: 'FileSearch', path: '/funding/publicity-appeals' }] };
const privacyGovernance: MenuItem = { id: 'privacy-governance', name: '隐私与数据权利', code: 'privacy-governance', icon: 'Shield', path: '/student/privacy' };
const administration: MenuItem = { id: 'administration', name: '平台治理', code: 'administration', icon: 'Settings', path: '/platform-governance', children: [{ id: 'platform-control', name: '治理控制中心', code: 'platform-control', icon: 'Gauge', path: '/platform-governance' }, { id: 'organization', name: '账号与组织', code: 'organization', icon: 'Users', path: '/platform-governance?view=identity' }, { id: 'roles', name: '权限冲突与RBAC', code: 'roles', icon: 'Shield', path: '/platform-governance?view=permissions' }, { id: 'workflow-config', name: '流程与安全策略', code: 'workflow-config', icon: 'Workflow', path: '/platform-governance?view=workflow' }, { id: 'system-status', name: '服务状态与配置', code: 'system-status', icon: 'Activity', path: '/system' }] };
const studentAffairs: MenuItem = { id: 'student-affairs', name: '资助育人', code: 'student-affairs', icon: 'UserCheck', path: '/student-affairs', children: [{ id: 'affairs-dashboard', name: '育人成效驾驶舱', code: 'affairs-dashboard', icon: 'Gauge', path: '/student-affairs' }, { id: 'affairs-growth', name: '成长追踪', code: 'affairs-growth', icon: 'Activity', path: '/student-affairs?view=growth' }, { id: 'affairs-cases', name: '典型案例库', code: 'affairs-cases', icon: 'FileStack', path: '/student-affairs?view=cases' }, { id: 'affairs-activities', name: '教育活动', code: 'affairs-activities', icon: 'Star', path: '/student-affairs?view=activities' }, { id: 'affairs-reports', name: 'AI成效报告', code: 'affairs-reports', icon: 'Sparkles', path: '/student-affairs?view=reports' }] };
const financeOperations: MenuItem = { id: 'finance-operations', name: '资金执行中心', code: 'finance-operations', icon: 'Calculator', path: '/finance', children: [{ id: 'finance-dashboard', name: '财务资金驾驶舱', code: 'finance-dashboard', icon: 'Gauge', path: '/finance' }, { id: 'finance-budgets', name: '预算与调剂', code: 'finance-budgets', icon: 'BarChart3', path: '/finance?view=budget' }, { id: 'finance-batches', name: '发放批次与双确认', code: 'finance-batches', icon: 'Files', path: '/finance?view=batches' }, { id: 'finance-reconciliation', name: '回盘与对账', code: 'finance-reconciliation', icon: 'RefreshCw', path: '/finance?view=reconciliation' }, { id: 'finance-vouchers', name: '凭证与归档', code: 'finance-vouchers', icon: 'FileText', path: '/finance?view=vouchers' }] };
const accessControl: MenuItem = { id: 'access-control', name: '九维权限控制', code: 'access-control', icon: 'Shield', path: '/access-control', children: [{ id: 'access-decisions', name: '决策流水与模拟', code: 'access-decisions', icon: 'Activity', path: '/access-control' }, { id: 'access-role-dimension', name: '角色与组织边界', code: 'access-role-dimension', icon: 'Users', path: '/access-control/dimensions/role' }, { id: 'access-data-dimension', name: '数据与敏感等级', code: 'access-data-dimension', icon: 'Database', path: '/access-control/dimensions/sensitivity' }, { id: 'access-ai-dimension', name: 'Agent权限公式', code: 'access-ai-dimension', icon: 'Bot', path: '/access-control/dimensions/ai-risk' }] };const dataGovernance: MenuItem = { id: 'data-governance', name: '数据治理中心', code: 'data-governance', icon: 'Database', path: '/data-governance', children: [{ id: 'data-quality', name: '数据质量与标准', code: 'data-quality', icon: 'CheckCircle', path: '/data-governance?view=quality' }, { id: 'data-security', name: '数据安全与脱敏', code: 'data-security', icon: 'Shield', path: '/data-governance?view=security' }, { id: 'data-backup', name: '备份与恢复', code: 'data-backup', icon: 'RefreshCw', path: '/data-governance?view=backup' }, { id: 'role-registry', name: '17角色与数据边界', code: 'role-registry', icon: 'Users', path: '/user-management/roles' }] };
const modelOperations: MenuItem = { id: 'ai-operations', name: 'AI运行治理', code: 'ai-operations', icon: 'Brain', path: '/agent/monitor', children: [{ id: 'agent-os', name: 'Agent OS与注册中心', code: 'agent-os', icon: 'Network', path: '/agent/monitor' }, { id: 'ai-control-plane', name: 'AI安全控制平面', code: 'ai-control-plane', icon: 'Shield', path: '/ai-control-plane' }, { id: 'ai-asset-studio', name: 'AI资产工作室', code: 'ai-asset-studio', icon: 'Workflow', path: '/agent/studio' }, { id: 'model-center', name: 'MoE模型与成本路由', code: 'model-center', icon: 'Brain', path: '/ai-control-plane?view=routing' }, { id: 'skill-evolution', name: 'Skills创建与自进化', code: 'skill-evolution', icon: 'Zap', path: '/agent/studio?view=skills' }, { id: 'mcp-center', name: '插件与MCP注册', code: 'mcp-center', icon: 'Plug', path: '/agent/studio?view=integrations' }, { id: 'memory-center', name: '长期记忆与召回', code: 'memory-center', icon: 'Database', path: '/agent/studio?view=memory' }, { id: 'workflow-studio', name: '工作流编排运行', code: 'workflow-studio', icon: 'GitBranch', path: '/agent/studio?view=workflows' }, { id: 'model-evaluation', name: 'Evals与链路追踪', code: 'model-evaluation', icon: 'BarChart3', path: '/agent/monitor' }, { id: 'guardrail', name: '护栏与人机回环', code: 'guardrail', icon: 'UserCheck', path: '/ai-control-plane?view=guardrails' }] };

const ROLE_MENUS: Record<RoleCode, MenuItem[]> = {
  SYS_ADMIN: [dashboard(), accessControl, administration, privacyGovernance, agents, modelOperations, knowledge, assistantMenu, notificationMenu, personalSettingsMenu],
  AI_OPS: [dashboard(), accessControl, privacyGovernance, modelOperations, agents, knowledge, assistantMenu, notificationMenu, personalSettingsMenu],
  SCHOOL_LEADER: [dashboard('/decision-center'), decisionCenter, fundingOperations, reports, assistantMenu, notificationMenu, personalSettingsMenu],
  FUND_LEADER: [dashboard('/decision-center'), decisionCenter, fundingOperations, applications, approvals, reports, knowledge, assistantMenu, notificationMenu, personalSettingsMenu],
  STU_AFFAIRS: [dashboard('/student-affairs'), studentAffairs, fundingOperations, reports, knowledge, assistantMenu, notificationMenu, personalSettingsMenu],
  FUND_ADMIN: [dashboard('/frontline-center'), frontlineCenter, fundingOperations, privacyGovernance, applications, approvals, reports, knowledge, assistantMenu, notificationMenu, personalSettingsMenu],
  FINANCE: [dashboard('/finance'), financeOperations, bank, reports, assistantMenu, notificationMenu, personalSettingsMenu],
  DEPT_ADMIN: [dashboard('/frontline-center'), frontlineCenter, fundingOperations, applications, approvals, reports, assistantMenu, notificationMenu, personalSettingsMenu],
  COUNSELOR: [dashboard('/frontline-center'), frontlineCenter, fundingOperations, applications, approvals, assistantMenu, notificationMenu, personalSettingsMenu],
  STUDENT: [{ id: 'student', name: '我的资助', code: 'student', icon: 'User', path: '/student/portal', children: [{ id: 'student-portal', name: '个人资助画像', code: 'student-portal', icon: 'Gauge', path: '/student/portal' }, { id: 'student-application', name: '提交申请', code: 'student-application', icon: 'FileText', path: '/application/create' }, { id: 'student-intake', name: '受理与补正', code: 'student-intake', icon: 'ClipboardCheck', path: '/application/intake' }, { id: 'student-focus', name: '重点关注', code: 'student-focus', icon: 'Star', path: '/student/focus' }, { id: 'student-publicity', name: '公示与申诉', code: 'student-publicity', icon: 'FileSearch', path: '/funding/publicity-appeals' }, { id: 'student-privacy', name: '隐私与数据权利', code: 'student-privacy', icon: 'Shield', path: '/student/privacy' }] }, assistantMenu, notificationMenu, personalSettingsMenu],
  BANK: [dashboard('/bank/portal'), bank, assistantMenu, notificationMenu, personalSettingsMenu],
  AUDIT_EXTERNAL: [dashboard('/auditor/portal'), audit, reports, assistantMenu, notificationMenu, personalSettingsMenu],
  EDU_BUREAU: [dashboard(), regulatory, fundingOperations, reports, audit, assistantMenu, notificationMenu, personalSettingsMenu],
  AUDITOR: [dashboard('/auditor/portal'), accessControl, audit, reports, assistantMenu, notificationMenu, personalSettingsMenu],
  DISCIPLINE: [dashboard('/auditor/portal'), accessControl, audit, approvals, assistantMenu, notificationMenu, personalSettingsMenu],
  DATA_ADMIN: [dataGovernance, accessControl, assistantMenu, notificationMenu, personalSettingsMenu],
  PUBLIC_OPINION: [dashboard(), opinionGovernance, reports, notificationMenu, assistantMenu, personalSettingsMenu],
};

function roleWorkbenchMenu(request: NextRequest): MenuItem | null {
  const actor = resolveRequestActor(request);
  if (!actor) return null;
  const groups = getRoleFeatureGroups(actor);
  return {
    id: 'role-workbench',
    name: '岗位功能全景',
    code: 'role-workbench',
    icon: 'Workflow',
    path: '/role-workbench',
    children: groups.map((group, index) => ({
      id: `role-feature-${index}`,
      name: group.name,
      code: `role-feature-${index}`,
      icon: group.status === 'available' ? 'CheckCircle' : group.status === 'deepening' ? 'Zap' : 'Clock',
      path: `/role-workbench?module=${encodeURIComponent(group.name)}`,
      badge: group.items.length.toString(),
    })),
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return NextResponse.json({ success: false, message: '身份无效，默认拒绝菜单访问' }, { status: 401 });
  const workbench = roleWorkbenchMenu(request);
  return successResponse([...(workbench ? [workbench] : []), platformTourMenu, ...ROLE_MENUS[actor.role]]);
}
















