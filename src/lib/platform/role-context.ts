import type { ActorContext } from "./authorization";
import { ROLE_CODES, ROLE_PROFILES, type RoleCode } from "./roles";

export interface RegisteredRoleAgent {
  code: string;
  name: string;
  registered: true;
  lifecycle: "registered";
  permissionMode: "role-intersection";
}

export interface RoleGovernancePolicy {
  responsibility: string;
  coreBusiness: string;
  dataPolicy: string;
  maxAiLevel: "L1" | "L2" | "L3" | "L4" | "L5";
  maxDataSensitivity: "P0" | "P1" | "P2" | "P3" | "P4" | "P5";
  decisionBoundary: string;
  agentTeam: readonly RegisteredRoleAgent[];
}

function agents(role: RoleCode, names: readonly string[]): readonly RegisteredRoleAgent[] {
  return names.map((name, index) => ({
    code: `${role.toLocaleLowerCase()}-agent-${index + 1}`,
    name,
    registered: true as const,
    lifecycle: "registered" as const,
    permissionMode: "role-intersection" as const,
  }));
}

function policy(
  responsibility: string,
  coreBusiness: string,
  dataPolicy: string,
  maxAiLevel: RoleGovernancePolicy["maxAiLevel"],
  maxDataSensitivity: RoleGovernancePolicy["maxDataSensitivity"],
  decisionBoundary: string,
  role: RoleCode,
  team: readonly string[],
): RoleGovernancePolicy {
  return { responsibility, coreBusiness, dataPolicy, maxAiLevel, maxDataSensitivity, decisionBoundary, agentTeam: agents(role, team) };
}

export const ROLE_GOVERNANCE_POLICIES: Record<RoleCode, RoleGovernancePolicy> = {
  SYS_ADMIN: policy("负责系统全局配置、用户权限、基础设施运维与安全策略。", "系统设置、组织权限、流程配置、安全与运维。", "全校系统配置、安全事件与操作日志；业务敏感明细按需脱敏。", "L4", "P5", "AI只能辅助配置，不得自动执行高危系统操作。", "SYS_ADMIN", ["运维监控Agent", "安全审计Agent", "配置管理Agent", "日志分析Agent"]),
  AI_OPS: policy("负责AI平台健康运行、模型管理、Skill进化、偏见检测和性能优化。", "Agent、模型、Skills、MCP、Prompt、成本、评测与可观测性。", "AI平台运行数据、模型调用日志、Agent轨迹与Skill评估数据。", "L5", "P4", "关键模型、Agent和自进化操作必须双人审批，无业务决策权。", "AI_OPS", ["模型监控Agent", "Skill进化管理Agent", "偏见检测Agent", "性能优化Agent"]),
  SCHOOL_LEADER: policy("负责战略决策、预算规划、风险把控与政策效果评估。", "领导驾驶舱、预算决策、重大事项、风险与汇报。", "全校聚合指标和历史趋势，不含个人敏感明细。", "L2", "P1", "AI只生成报告与建议，不得代替领导审批。", "SCHOOL_LEADER", ["数据分析Agent", "报告生成Agent", "风险预警Agent", "政策咨询Agent"]),
  FUND_LEADER: policy("统筹全校资助政策、预算、重大项目、质量与跨部门协同。", "政策制定、预算规划、重大审批、质量评估与协调。", "全校资助业务聚合数据，不直接读取学生个人敏感明细。", "L3", "P2", "重大审批需人工确认，政策变更需多人会签。", "FUND_LEADER", ["政策分析Agent", "预算规划Agent", "质量评估Agent", "协调调度Agent"]),
  STU_AFFAIRS: policy("统筹学生工作与资助育人融合，指导辅导员队伍。", "学情、育人指导、队伍管理、学生成长和风险预警。", "全校学生工作与资助汇总数据，不含详细家庭和财务信息。", "L3", "P2", "AI可生成分析与指导建议，重大学生工作决策需人工确认。", "STU_AFFAIRS", ["学情分析Agent", "育人指导Agent", "队伍管理Agent", "风险预警Agent"]),
  FUND_ADMIN: policy("负责校级资助业务全流程执行、项目运营与数据统计。", "政策执行、项目管理、校级复审、公示、申诉与报表。", "全校资助业务数据；家庭财务等敏感字段按角色脱敏。", "L4", "P3", "AI可辅助审核和统计，异常需人工确认，资金发放需双重审批。", "FUND_ADMIN", ["业务审核Agent", "流程管理Agent", "数据统计Agent", "合规检查Agent"]),
  FINANCE: policy("负责资助资金预算、拨付、账务、对账和财务监督。", "预算、发放批次、账务处理、对账、凭证与财务报表。", "资助资金收支、预算与银行流水；学生账户只显示必要脱敏字段。", "L4", "P3", "AI可辅助核对和报表，资金划转必须双人授权。", "FINANCE", ["资金管理Agent", "账务处理Agent", "对账核查Agent", "报表生成Agent"]),
  DEPT_ADMIN: policy("负责本院系资助宣传、困难摸排、申请受理与初审。", "政策宣传、困难摸排、申请初审、发放协助和数据上报。", "仅本院系学生资助数据，不含他院系和学生详细家庭财务信息。", "L4", "P2", "AI可辅助初审与咨询，认定与推荐结论需人工确认。", "DEPT_ADMIN", ["政策助手Agent", "申请初审Agent", "学生关怀Agent", "数据上报Agent"]),
  COUNSELOR: policy("负责所带班级的资助指导、困难帮扶和学生成长。", "申请指导、班级初审、民主评议、谈心谈话与后续追踪。", "仅所带班级学生数据；家庭财务敏感字段不可见。", "L4", "P2", "AI可辅助指导与整理，初审和重点关怀决定需人工确认。", "COUNSELOR", ["学生档案Agent", "资助指导Agent", "关怀追踪Agent", "活动策划Agent"]),
  STUDENT: policy("作为资助服务对象，获取政策、提交申请、追踪进度与获取成长服务。", "政策浏览、项目查询、申请、进度、结果、咨询与成长服务。", "仅本人基本信息、申请、历史资助和账户脱敏数据。", "L1", "P3", "AI仅作为学生发起的服务工具，不涉及敏感业务决定。", "STUDENT", ["资助导航Agent", "申请助手Agent", "成长伙伴Agent", "桌面宠物小海豚"]),
  BANK: policy("负责助学贷款开户、发放、还款管理与银校对接。", "贷款账户、放款、还款、账单、逾期和银校对账。", "仅已分配的助学贷款必要数据，不可读取与贷款无关的学生数据。", "L4", "P3", "AI可辅助提醒和账单，资金操作必须银行工作人员授权。", "BANK", ["账户管理Agent", "放款处理Agent", "还款管理Agent", "账务核对Agent"]),
  AUDIT_EXTERNAL: policy("受委托对资助资金、流程和合规性开展独立审计。", "审前调查、资金审计、流程审计、效益评估和报告。", "仅委托任务范围内的业务、财务和证据数据，个人信息脱敏。", "L3", "P3", "AI只能辅助审计分析，审计结论必须由审计人员确认。", "AUDIT_EXTERNAL", ["审前调查Agent", "审计分析Agent", "报告生成Agent", "质量控制Agent"]),
  EDU_BUREAU: policy("负责省属高校资助日常监管、数据审核、专项检查与绩效评估。", "监管数据审核、日常监管、整改追踪、绩效与监管报告。", "全省高校聚合统计和资金指标，不含具体学生信息。", "L3", "P1", "AI可辅助监管分析，监管结论与整改指令需人工确认。", "EDU_BUREAU", ["数据审核Agent", "监管分析Agent", "整改追踪Agent", "报告生成Agent"]),
  AUDITOR: policy("负责学校资助资金、管理与效益的内部审计。", "审计计划、审计实施、问题发现、报告和整改管理。", "经授权的全链路业务、资金和制度数据，学生敏感明细脱敏。", "L3", "P4", "AI只能辅助取证和分析，审计结论与整改销号需人工确认。", "AUDITOR", ["审计计划Agent", "审计实施Agent", "审计报告Agent", "整改管理Agent"]),
  DISCIPLINE: policy("负责资助工作监督执纪、问题线索、调查与问责。", "日常监督、线索研判、违规调查、AI撤回、问责和档案。", "仅经授权的投诉、线索与调查数据，调查必要信息按案件授权解密。", "L3", "P5", "重大决定必须人工确认，AI撤回必须满足专属授权与审计条件。", "DISCIPLINE", ["监督预警Agent", "线索研判Agent", "AI撤回Agent", "档案管理Agent"]),
  DATA_ADMIN: policy("负责资助数据质量、安全、标准、共享和备份恢复。", "数据质量、数据安全、数据标准、数据共享与备份恢复。", "全校资助系统业务、用户、日志与备份数据；无具体业务决策权。", "L4", "P5", "AI可辅助数据管理，安全敏感操作需审批；人和AI都不得以数据管理身份作业务决策。", "DATA_ADMIN", ["数据质量Agent", "数据安全Agent", "数据标准Agent", "备份恢复Agent"]),
  PUBLIC_OPINION: policy("负责资助舆情监测、研判、引导与危机应对。", "公开网络监测、情感分析、风险预警、引导与报告。", "仅公开网络舆情数据，不含学生个人信息，不监控私密通讯。", "L3", "P0", "AI可辅助分析和生成草稿，重要舆情响应和内容发布需人工决策。", "PUBLIC_OPINION", ["舆情监测Agent", "舆情分析Agent", "舆情预警Agent", "舆情引导Agent"]),
};

export function roleDirectory() {
  return ROLE_CODES.map(code => ({ ...ROLE_PROFILES[code], governance: ROLE_GOVERNANCE_POLICIES[code] }));
}

export function buildActorRoleContext(actor: ActorContext) {
  const profile = ROLE_PROFILES[actor.role];
  const governance = ROLE_GOVERNANCE_POLICIES[actor.role];
  return {
    role: { ...profile },
    governance,
    effectiveScope: {
      type: profile.dataScope,
      campusIds: [...actor.campusIds],
      departmentIds: [...(actor.departmentIds ?? [])],
      classIds: [...(actor.classIds ?? [])],
      assignedTaskIds: [...(actor.assignedTaskIds ?? [])],
      ownerId: profile.dataScope === "self" ? actor.userId : null,
    },
    permissions: [...profile.permissions],
    capabilities: [...(actor.capabilities ?? [])],
    registry: { roleCount: ROLE_CODES.length, teamCount: ROLE_CODES.length, agentCount: ROLE_CODES.length * 4, version: "v2.0" },
  };
}
