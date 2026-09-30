import baseline from '../../../docs/role-function-baseline-v6.json';
import { type ActorContext } from './authorization';

export type FeatureDeliveryStatus = 'available' | 'deepening' | 'planned';

export interface RoleFeatureItem {
  row: number;
  level1: string;
  level2: string;
  level3: string;
  scope: string;
  ai: string;
  status: FeatureDeliveryStatus;
  route: string;
}

export interface RoleFeatureGroup {
  name: string;
  status: FeatureDeliveryStatus;
  route: string;
  items: RoleFeatureItem[];
}

const AVAILABLE_KEYWORDS = ['AI智能助手', '桌面宠物', '申请管理', '在线申请', '进度查询', '补正材料', '初审意见', '院系审核', '学校复审', '发放批次', '发放回盘', '对账管理', '对账文件', '银行工作台', '银校协同', '政策管理', '项目管理', '困难认定', '民主评议', '公示管理', '公示查看', '申诉管理', '申诉反馈', '资金审计', '流程审计', '操作审计', 'AI行为审计', '证据链管理', '线索管理', '案件授权', '案件生命周期管理', '舆情采集', '舆情分级响应', '舆情预警', '公示期舆情监测', '监管驾驶舱', '政策执行监管', '风险预警', '整改督办', '个人信息', 'Agent注册与配置', '模型管理 LLMOps', 'Skills封装', 'MCP/插件管理', 'AI成本控制中心', 'Human-in-the-Loop配置', '可观测性与链路追踪', 'AI性能评估', '工具熔断机制', 'AI自进化受控闭环', '向量检索配置', '沙盒执行环境', 'Agent调度与编排中心', '知识库管理(业务侧)', '向量检索', '领导驾驶舱', '全校资助风险驾驶舱', '资助业务大屏', '院系数据看板', '辅导员工作台看板', '学生个人中心看板', '审计驾驶舱', '纪检案件看板', '舆情监测大屏', 'AI运维监控大屏', '组织架构管理', '用户管理', '角色权限管理', '流程配置', '安全护栏', '审计与运维', '数据生命周期管理', 'API开放平台', '系统设置', '系统运维大屏', 'Prompt工坊', '沙盒执行环境', 'XAI可解释引擎', '受助学生成长追踪', '资助项目效果对比', '典型学生案例库', '资助政策育人评估', '励志教育素材库', '受助学生感恩教育', '资助育人驾驶舱', '领导驾驶舱', '预算决策支持', '政策效果评估', '重大事项审批', '风险总体把控', '汇报材料生成', '资助沙盒模拟', '例外审批工作台', '政策调整建议', '全校资助风险驾驶舱', '预算管理', '凭证管理', '财务风险', '财务数据大屏', '发放失败二次处理', '院系工作台', '学生管理', '项目组织', '院系资助档案', '申诉初审', '院系统计', '院系数据看板', '班级工作台', '学生画像', '申请指导', '班级民主评议管理', '谈心谈话', '初审意见', '通知沟通', '后续跟踪', '重点关注学生列表', '辅导员工作台看板', '监管驾驶舱', '银行工作台', '审计任务', '证据查看', '案件生命周期管理', 'AI规则冻结'];
const DEEPENING_KEYWORDS = ['政策管理', '项目管理', '困难认定', '公示管理', '申诉管理', '预算管理', '审计', '监管', '舆情', '知识库', 'Agent', '模型', 'Skills', '工作流', '数据质量', '系统设置', '用户管理', '角色权限'];

function deliveryStatus(name: string): FeatureDeliveryStatus {
  if (AVAILABLE_KEYWORDS.some((keyword) => name.includes(keyword))) return 'available';
  if (DEEPENING_KEYWORDS.some((keyword) => name.includes(keyword))) return 'deepening';
  return 'planned';
}

function routeFor(name: string): string {
  if (name.includes('院系工作台') || name.includes('学生管理') || name.includes('项目组织') || name.includes('院系资助档案') || name.includes('申诉初审') || name.includes('院系统计') || name.includes('院系数据看板') || name.includes('班级工作台') || name.includes('学生画像') || name.includes('申请指导') || name.includes('班级民主评议') || name.includes('谈心谈话') || name.includes('初审意见') || name.includes('通知沟通') || name.includes('后续跟踪') || name.includes('重点关注学生') || name.includes('辅导员工作台')) return '/frontline-center';
  if (name.includes('领导驾驶舱') || name.includes('预算决策') || name.includes('政策效果') || name.includes('重大事项') || name.includes('风险总体') || name.includes('汇报材料') || name.includes('资助沙盒') || name.includes('例外审批') || name.includes('政策调整') || name.includes('全校资助风险')) return '/decision-center';
  if (name.includes('资助育人') || name.includes('成长追踪') || name.includes('项目效果') || name.includes('典型学生') || name.includes('励志教育') || name.includes('感恩教育')) return '/student-affairs';
  if (name.includes('预算') || name.includes('凭证') || name.includes('财务风险') || name.includes('财务数据') || name.includes('资金调剂')) return '/finance';
  if (name.includes('Prompt') || name.includes('Human-in-the-Loop') || name.includes('沙盒') || name.includes('安全护栏') || name.includes('XAI')) return '/ai-control-plane';
  if (name.includes('组织架构') || name.includes('用户管理') || name.includes('角色权限') || name.includes('流程配置') || name.includes('审计与运维') || name.includes('数据生命周期') || name.includes('API开放') || name.includes('系统设置') || name.includes('系统运维')) return '/platform-governance';
  if (name.includes('政策') || name.includes('项目管理')) return '/funding/management';
  if (name.includes('困难认定') || name.includes('民主评议')) return '/funding/difficulty';
  if (name.includes('公示') || name.includes('申诉') || name.includes('异议')) return '/funding/publicity-appeals';
  if (name.includes('发放') || name.includes('对账') || name.includes('银行')) return '/bank-cooperation/reconciliation';
  if (name.includes('申请') || name.includes('审核') || name.includes('复审') || name.includes('初审') || name.includes('补正')) return '/application/all';
  if (name.includes('知识库') || name.includes('向量')) return '/knowledge';
  if (name.includes('Agent') || name.includes('工作流') || name.includes('调度')) return '/agent';
  if (name.includes('模型') || name.includes('LLMOps') || name.includes('偏见')) return '/model-center';
  if (name.includes('舆情')) return '/governance/opinion';
  if (name.includes('监管') || name.includes('整改督办') || name.includes('跨校')) return '/governance/regulatory';
  if (name.includes('隐私') || name.includes('数据权利') || name.includes('数据生命周期')) return '/student/privacy';
  if (name.includes('审计') || name.includes('纪检') || name.includes('证据')) return '/auditor/portal';
  if (name.includes('用户') || name.includes('角色权限') || name.includes('组织架构')) return '/user-management';
  if (name.includes('系统') || name.includes('安全护栏') || name.includes('MCP') || name.includes('API')) return '/system';
  if (name.includes('学生') || name.includes('个人信息') || name.includes('资助历史')) return '/student/portal';
  if (name.includes('大屏') || name.includes('驾驶舱') || name.includes('看板')) return '/dashboard/overview';
  return '/role-workbench';
}

function groupsForCode(code: string): RoleFeatureGroup[] {
  const role = baseline.roles.find((item) => item.code === code);
  if (!role) return [];
  const groups = new Map<string, RoleFeatureItem[]>();
  for (const row of role.rows) {
    if (!row.level1 || row.level1 === '【专属AI能力】') continue;
    const status = deliveryStatus(`${row.level1}${row.level2}${row.level3}`);
    const item: RoleFeatureItem = { ...row, status, route: routeFor(`${row.level1}${row.level2}${row.level3}`) };
    const current = groups.get(row.level1) ?? [];
    current.push(item);
    groups.set(row.level1, current);
  }
  return Array.from(groups.entries()).map(([name, items]) => {
    const statuses = items.map((item) => item.status);
    const status: FeatureDeliveryStatus = statuses.includes('available') ? 'available' : statuses.includes('deepening') ? 'deepening' : 'planned';
    return { name, items, status, route: routeFor(name) };
  });
}

export function getRoleFeatureGroups(actor: ActorContext): RoleFeatureGroup[] {
  return groupsForCode(actor.role);
}

export function getFeatureCoverageSummary(groups: readonly RoleFeatureGroup[]) {
  const items = groups.flatMap((group) => group.items);
  return {
    groups: groups.length,
    functions: items.length,
    available: items.filter((item) => item.status === 'available').length,
    deepening: items.filter((item) => item.status === 'deepening').length,
    planned: items.filter((item) => item.status === 'planned').length,
  };
}









