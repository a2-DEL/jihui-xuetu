import { roleDirectory } from "./role-context";
import type { RoleCode } from "./roles";

export type TourTone = "blue" | "cyan" | "emerald" | "amber" | "violet" | "rose";

export interface AidBranch {
  code: string;
  name: string;
  subtitle: string;
  coverage: string;
  examples: readonly string[];
  tone: TourTone;
}

export interface TourRole {
  code: RoleCode;
  name: string;
  category: string;
  dashboard: string;
  assistantName: string;
  dataScope: string;
  responsibility: string;
  coreBusiness: string;
  dataPolicy: string;
  decisionBoundary: string;
  maxAiLevel: string;
  maxDataSensitivity: string;
  agentTeam: ReadonlyArray<{ code: string; name: string }>;
}

export interface RoleGroup {
  category: string;
  description: string;
  roles: readonly TourRole[];
}

export interface ProcessStep {
  id: string;
  sequence: number;
  phase: string;
  title: string;
  ownerCode: RoleCode;
  owner: string;
  aiAction: string;
  humanGate: string;
  evidence: string;
  route: string;
  painSolved: string;
  tone: TourTone;
}

export interface PlatformTourSnapshot {
  version: string;
  simulationStatement: string;
  metrics: { aidBranches: number; roles: number; teams: number; agents: number; processSteps: number };
  aidBranches: readonly AidBranch[];
  lifecycle: ReadonlyArray<{ stage: string; description: string }>;
  roleGroups: readonly RoleGroup[];
  roles: readonly TourRole[];
  mainScenario: readonly ProcessStep[];
  safeguards: readonly string[];
}

const AID_BRANCHES: readonly AidBranch[] = [
  { code: "SCHOLARSHIP", name: "奖学金", subtitle: "激励发展", coverage: "奖励品学兼优与全面发展的学生", examples: ["国家奖学金", "校级奖学金", "社会奖学金"], tone: "amber" },
  { code: "GRANT", name: "助学金", subtitle: "保障基本学习生活", coverage: "面向家庭经济困难学生提供生活支持", examples: ["国家助学金", "地方助学金", "临时困难补助"], tone: "blue" },
  { code: "LOAN", name: "助学贷款", subtitle: "信用金融支持", coverage: "解决学费、住宿费和必要生活费压力", examples: ["生源地信用助学贷款", "校园地国家助学贷款"], tone: "cyan" },
  { code: "MILITARY", name: "服兵役资助", subtitle: "服务国家战略", coverage: "覆盖应征入伍、退役复学与退役入学学生", examples: ["学费补偿", "贷款代偿", "学费减免"], tone: "emerald" },
  { code: "COMPENSATION", name: "基层就业补偿代偿", subtitle: "引导基层就业", coverage: "支持毕业生到中西部和艰苦边远地区就业", examples: ["学费补偿", "国家助学贷款代偿"], tone: "violet" },
  { code: "WORK_STUDY", name: "勤工助学", subtitle: "劳动育人与能力成长", coverage: "通过校内岗位获得合理劳动报酬和实践锻炼", examples: ["固定岗位", "临时岗位", "技能型岗位"], tone: "cyan" },
  { code: "GREEN_CHANNEL", name: "绿色通道", subtitle: "入学无障碍", coverage: "先办理入学手续，再根据核实情况精准资助", examples: ["缓缴学费", "入学礼包", "应急保障"], tone: "emerald" },
  { code: "CAMPUS_AID", name: "校内资助", subtitle: "兜底与个性化帮扶", coverage: "对突发、特殊和多元成长需求提供校本支持", examples: ["临时困难补助", "学费减免", "发展型资助"], tone: "rose" },
];

const LIFECYCLE = [
  { stage: "政策与项目", description: "政策入库、项目建模、资格规则和预算边界统一配置" },
  { stage: "通知与申请", description: "定向触达、智能填报、材料解析与受理补正形成闭环" },
  { stage: "认定与评审", description: "班级、院系、校级分层审核，AI建议不替代人工决定" },
  { stage: "公示与申诉", description: "最小披露公示、异议受理、复核裁决和全过程留痕" },
  { stage: "资金与银行", description: "预算占用、双人复核、银行回盘、对账与异常处置" },
  { stage: "监督与育人", description: "审计取证、监管报送、成效评估和成长服务持续跟踪" },
] as const;

const GROUP_DESCRIPTIONS: Record<string, string> = {
  "技术与平台": "维护基础设施、AI运行与安全底座，不介入具体资助业务决定。",
  "学校管理·业务决策层": "负责战略、政策、重大事项与最终授权，始终保留人工决策权。",
  "学校管理·业务执行层": "承担校级资助业务、资金执行与全过程运营。",
  "院系执行": "贴近学生开展受理、初审、摸排、关怀与院系汇总。",
  "学生服务": "围绕学生本人提供政策获取、申请、进度、申诉与隐私权利服务。",
  "外部协作": "通过任务授权和最小数据集完成银行、第三方审计协同。",
  "监管与监督": "依法依规开展教育监管、审计监督与纪检调查。",
  "数据与内容管理": "负责数据质量、安全、标准和公开舆情治理，不拥有业务决定权。",
};

const SCENARIO_BLUEPRINT: ReadonlyArray<Omit<ProcessStep, "owner">> = [
  { id: "notice", sequence: 1, phase: "项目启动", title: "发布临时困难补助通知", ownerCode: "FUND_ADMIN", aiAction: "政策Agent检索依据，流程Agent生成对象范围、时限与材料清单草案。", humanGate: "资助中心管理员核对政策与预算后发布。", evidence: "通知版本、发布人、受众快照、政策引用", route: "/funding/management", painSolved: "通知分散、口径不一、重复答疑", tone: "blue" },
  { id: "discover", sequence: 2, phase: "学生触达", title: "学生收到精准通知", ownerCode: "STUDENT", aiAction: "小海豚结合本人权限解释资格、材料与截止时间，不暴露他人信息。", humanGate: "学生自主决定是否发起申请。", evidence: "送达回执、政策引用、咨询记录", route: "/notification/center", painSolved: "政策难懂、错过时限、找不到入口", tone: "cyan" },
  { id: "apply", sequence: 3, phase: "在线申请", title: "填写申请并提交材料", ownerCode: "STUDENT", aiAction: "申请助手按字段引导；OCR、版面分析与实体抽取引擎解析材料。", humanGate: "学生确认结构化信息、授权范围并正式提交。", evidence: "申请快照、文件哈希、解析结果、授权记录", route: "/application/create", painSolved: "反复填表、材料混乱、人工录入易错", tone: "blue" },
  { id: "precheck", sequence: 4, phase: "智能受理", title: "规则校验与AI预审", ownerCode: "FUND_ADMIN", aiAction: "确定性规则先判资格；模型仅生成风险提示和补正建议，低置信度转人工。", humanGate: "受理人员确认退回补正或进入初审。", evidence: "规则命中、模型版本、Prompt摘要、置信度与引用", route: "/application/intake", painSolved: "漏项反复退回、人工预检耗时", tone: "violet" },
  { id: "counselor", sequence: 5, phase: "班级初审", title: "辅导员初审与关怀核实", ownerCode: "COUNSELOR", aiAction: "资助指导Agent整理证据、发现矛盾项并生成核实清单。", humanGate: "辅导员结合谈话与事实作出初审意见。", evidence: "核实清单、谈话记录、初审意见、电子签名", route: "/frontline-center?view=tasks", painSolved: "材料阅读耗时、关键信息遗漏", tone: "emerald" },
  { id: "department", sequence: 6, phase: "院系汇总", title: "院系复核与批量上报", ownerCode: "DEPT_ADMIN", aiAction: "申请初审Agent检查重复、异常与名额边界，自动生成汇总表草案。", humanGate: "院系资助管理员复核排序与异常后上报。", evidence: "院系批次、名单差异、异常处置、上报回执", route: "/frontline-center?view=quotas", painSolved: "人工汇总慢、版本错乱、跨表核对", tone: "cyan" },
  { id: "school-review", sequence: 7, phase: "校级审核", title: "资助中心校级复审", ownerCode: "FUND_ADMIN", aiAction: "业务审核Agent进行跨院系一致性检查，合规Agent核验政策与数据边界。", humanGate: "资助中心管理员确认建议并形成送审批次。", evidence: "复审意见、政策依据、异常闭环、批次快照", route: "/application/all?view=pending", painSolved: "跨院系标准不一、异常难追踪", tone: "blue" },
  { id: "leader", sequence: 8, phase: "领导审批", title: "校领导审阅关键风险并审批", ownerCode: "SCHOOL_LEADER", aiAction: "决策参谋生成一页式摘要、预算影响和例外事项解释，不代签不代批。", humanGate: "校领导完成不可替代的人工审批。", evidence: "决策摘要、审批意见、身份认证、时间戳", route: "/decision-center?view=exceptions", painSolved: "信息过载、重大风险难聚焦", tone: "amber" },
  { id: "finance", sequence: 9, phase: "财务执行", title: "生成发放批次并双人复核", ownerCode: "FINANCE", aiAction: "资金Agent核对预算、账户脱敏信息、重复发放与金额平衡。", humanGate: "经办与复核双人确认；确定性校验通过后才可出款。", evidence: "预算占用、双签记录、批次哈希、财务凭证", route: "/finance?view=batches", painSolved: "重复核账、错发漏发、责任边界不清", tone: "rose" },
  { id: "bank", sequence: 10, phase: "银校闭环", title: "银行MCP发放、回盘与到账通知", ownerCode: "BANK", aiAction: "小海豚调用银行MCP提交最小必要字段，对账Agent解析回盘并定位差异。", humanGate: "银行工作人员授权资金操作；财务确认对账结果。", evidence: "MCP调用、银行回盘、对账差异、到账通知、审计归档", route: "/bank-cooperation/reconciliation", painSolved: "系统割裂、回盘滞后、到账状态不透明", tone: "emerald" },
];

export function getPlatformTourSnapshot(): PlatformTourSnapshot {
  const roles: TourRole[] = roleDirectory().map(role => ({
    code: role.code,
    name: role.name,
    category: role.category,
    dashboard: role.dashboard,
    assistantName: role.assistantName,
    dataScope: role.dataScope,
    responsibility: role.governance.responsibility,
    coreBusiness: role.governance.coreBusiness,
    dataPolicy: role.governance.dataPolicy,
    decisionBoundary: role.governance.decisionBoundary,
    maxAiLevel: role.governance.maxAiLevel,
    maxDataSensitivity: role.governance.maxDataSensitivity,
    agentTeam: role.governance.agentTeam.map(agent => ({ code: agent.code, name: agent.name })),
  }));
  const roleName = new Map(roles.map(role => [role.code, role.name]));
  const roleGroups: RoleGroup[] = Array.from(new Set(roles.map(role => role.category))).map(category => ({
    category,
    description: GROUP_DESCRIPTIONS[category] ?? "按照岗位职责和最小权限原则参与资助协同。",
    roles: roles.filter(role => role.category === category),
  }));
  const mainScenario: ProcessStep[] = SCENARIO_BLUEPRINT.map(step => ({ ...step, owner: roleName.get(step.ownerCode) ?? step.ownerCode }));
  return {
    version: "v2.0",
    simulationStatement: "本演示环境仅使用脱敏构造的模拟数据，不承载任何真实学生敏感信息；业务流转、权限校验、Agent 调度、模型调用、MCP 工具执行与审计留痕均按真实系统机制运行。",
    metrics: { aidBranches: AID_BRANCHES.length, roles: roles.length, teams: roles.length, agents: roles.reduce((total, role) => total + role.agentTeam.length, 0), processSteps: mainScenario.length },
    aidBranches: AID_BRANCHES,
    lifecycle: LIFECYCLE,
    roleGroups,
    roles,
    mainScenario,
    safeguards: ["九维权限交集", "AI建议不替代人工决定", "敏感字段最小披露", "高风险操作双人确认", "全过程审计证据链"],
  };
}
