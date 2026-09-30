import { isCampusWorkHours, type ActorContext, type AiRiskLevel, type SensitiveLevel } from "./authorization";
import { ROLE_GOVERNANCE_POLICIES } from "./role-context";
import { ROLE_PROFILES, type DataScope, type RoleCode } from "./roles";

export const DIMENSION_CODES = ["role", "organization", "data-scope", "time", "geography", "workflow", "ai-risk", "sensitivity", "operation"] as const;
export type DimensionCode = (typeof DIMENSION_CODES)[number];
export type PermissionStatus = "ALLOW" | "DENY" | "PENDING_APPROVAL" | "ESCALATE";
export type OperationType = "CREATE" | "READ" | "UPDATE" | "DELETE" | "EXPORT";
export type GeographicLevel = "L1" | "L2" | "L3" | "L4" | "L5";
export type TimePolicy = "always" | "work-hours" | "business-window";
export type FieldMode = "full" | "masked" | "hidden";

export interface PermissionResource {
  id: string;
  type: string;
  campusId?: string;
  departmentId?: string;
  classId?: string;
  ownerId?: string;
  assignedTaskId?: string;
  dataTags: readonly string[];
  academicYear?: string;
  sensitiveLevel: SensitiveLevel;
  processState?: string;
  currentHandlerId?: string;
}

export interface PermissionRuntimeContext {
  occurredAt: string;
  timePolicy: TimePolicy;
  businessWindowOpen?: boolean;
  emergencyMode?: boolean;
  geographicLevel: GeographicLevel;
  ipAddress?: string;
  deviceTrusted: boolean;
  mfaVerified: boolean;
  purpose?: string;
  confirmations: number;
  approvedBy: readonly string[];
  itemCount?: number;
  trialApproved?: boolean;
  sandboxPassed?: boolean;
}

export interface AgentExecutionBoundary {
  agentCode: string;
  toolName: string;
  toolRegistered: boolean;
  allowedRoles: readonly RoleCode[];
  registeredPermissions: readonly string[];
  guardrailPassed: boolean;
}

export interface NineDimensionRequest {
  permission: string;
  operation: OperationType;
  resource: PermissionResource;
  runtime: PermissionRuntimeContext;
  actorType: "human" | "agent";
  aiRiskLevel: AiRiskLevel;
  agent?: AgentExecutionBoundary;
}

export interface DimensionDecision {
  code: DimensionCode;
  name: string;
  status: PermissionStatus;
  reason: string;
  evidence: string[];
  policyRef: string;
  requiredApprovals: number;
  fieldMode?: FieldMode;
}

export interface AgentFormulaComponent {
  code: "user-role" | "agent-tool" | "nine-dimension" | "guardrail" | "workflow" | "time" | "geography";
  name: string;
  status: PermissionStatus;
  detail: string;
}

export interface NineDimensionDecision {
  status: PermissionStatus;
  allowed: boolean;
  code: string;
  reason: string;
  deniedBy: DimensionCode[];
  pendingBy: DimensionCode[];
  requiredApprovals: number;
  fieldMode: FieldMode;
  dimensions: DimensionDecision[];
  formula: { expression: string; effective: boolean; components: AgentFormulaComponent[] } | null;
  evaluatedAt: string;
}

export interface DimensionDefinition {
  code: DimensionCode;
  name: string;
  category: "主体客体" | "动态情境" | "AI与敏感操作";
  description: string;
  rules: readonly string[];
  policyRef: string;
}

export const DIMENSION_DEFINITIONS: readonly DimensionDefinition[] = [
  { code: "role", name: "角色维度", category: "主体客体", description: "验证17角色RBAC权限、职责分离和岗位边界。", rules: ["请求权限点必须在角色权限集合中", "技术、审计、纪检和数据治理岗位不得参与资助业务决策", "任一角色默认拒绝未显式授予的权限"], policyRef: "v2-5.1" },
  { code: "organization", name: "组织维度", category: "主体客体", description: "按校级、院系、班级、本人或任务授权限定组织范围。", rules: ["校级仅限授权校区", "院系仅限所属院系", "辅导员仅限所带班级", "任务型角色仅限分配任务"], policyRef: "v2-5.2" },
  { code: "data-scope", name: "数据范围维度", category: "主体客体", description: "校验资源数据标签是否属于岗位业务数据集合。", rules: ["角色只可访问注册的数据类型", "治理岗位只读元数据和治理结果", "跨学年归档数据需额外授权"], policyRef: "v2-5.3" },
  { code: "time", name: "时间维度", category: "动态情境", description: "控制工作时间、业务窗口、假期冻结和紧急绿色通道。", rules: ["敏感管理操作限定工作日08:00—18:00", "业务窗口关闭时禁止流转", "紧急模式必须显式标记并全量留痕"], policyRef: "v2-5.4" },
  { code: "geography", name: "地理维度", category: "动态情境", description: "基于位置等级、设备可信度和MFA约束操作。", rules: ["L5仅允许登录，不下发业务数据", "L4仅允许低敏只读", "资金发放和模型参数修改必须在L1", "陌生设备处理敏感数据必须完成MFA"], policyRef: "v2-5.5" },
  { code: "workflow", name: "流程状态维度", category: "动态情境", description: "业务状态机决定当前节点可执行的操作。", rules: ["公示期冻结审批修改", "待发放只允许财务办理", "已完成记录不可修改", "节点处理人必须匹配"], policyRef: "v2-5.6" },
  { code: "ai-risk", name: "AI权限等级维度", category: "AI与敏感操作", description: "按L0—L5限制AI自主执行程度并校验Agent工具边界。", rules: ["Agent必须属于当前角色团队", "工具必须注册且角色在工具白名单", "L4只能给建议", "L5完全禁止AI执行"], policyRef: "v2-5.7" },
  { code: "sensitivity", name: "数据敏感等级维度", category: "AI与敏感操作", description: "按P0—P5决定完整、脱敏或隐藏字段。", rules: ["P3以上查阅必须登记用途", "P4仅限授权决策与治理岗位", "P5仅纪检双人授权", "无权字段直接隐藏"], policyRef: "v2-5.8" },
  { code: "operation", name: "操作类型维度", category: "AI与敏感操作", description: "针对创建、读取、修改、删除和导出施加不同护栏。", rules: ["删除必须二次确认并逻辑删除", "P2以上导出需双重确认", "单次导出不得超过1000条", "导出必须登记用途并添加水印"], policyRef: "v2-5.9" },
] as const;

const DATA_TAGS_BY_ROLE: Record<RoleCode, readonly string[]> = {
  SYS_ADMIN: ["PUBLIC", "SYSTEM_CONFIG", "SECURITY_EVENT", "AUDIT_LOG", "PERMISSION_METADATA"],
  AI_OPS: ["PUBLIC", "AI_ASSET", "AI_TRACE", "KNOWLEDGE", "AUDIT_LOG", "PERMISSION_METADATA"],
  SCHOOL_LEADER: ["PUBLIC", "AGGREGATE", "REPORT", "RISK_AGGREGATE", "POLICY"],
  FUND_LEADER: ["PUBLIC", "AGGREGATE", "APPLICATION_AGGREGATE", "POLICY", "BUDGET", "RISK_AGGREGATE", "REPORT"],
  STU_AFFAIRS: ["PUBLIC", "AGGREGATE", "EDUCATION", "OUTCOME", "CASE_SUMMARY", "REPORT"],
  FUND_ADMIN: ["PUBLIC", "APPLICATION", "MATERIAL", "RESULT", "POLICY", "PROJECT", "PUBLICITY", "APPEAL", "REPORT"],
  FINANCE: ["PUBLIC", "FINANCIAL", "GRANT", "RECONCILIATION", "VOUCHER", "APPLICATION_REFERENCE", "REPORT"],
  DEPT_ADMIN: ["PUBLIC", "APPLICATION", "MATERIAL", "RESULT", "PUBLICITY", "APPEAL", "REPORT"],
  COUNSELOR: ["PUBLIC", "APPLICATION", "MATERIAL", "RESULT", "STUDENT_PROFILE", "INTERVIEW"],
  STUDENT: ["PUBLIC", "APPLICATION", "RESULT", "SELF_PROFILE", "APPEAL"],
  BANK: ["PUBLIC", "LOAN", "GRANT_REFERENCE", "RECONCILIATION", "APPLICATION_REFERENCE"],
  AUDIT_EXTERNAL: ["PUBLIC", "AUDIT_LOG", "EVIDENCE", "FINANCIAL_AGGREGATE", "APPLICATION_REFERENCE"],
  EDU_BUREAU: ["PUBLIC", "REGULATORY", "AGGREGATE", "REPORT", "AUDIT_LOG"],
  AUDITOR: ["PUBLIC", "AUDIT_LOG", "EVIDENCE", "APPLICATION", "FINANCIAL", "AI_TRACE", "PERMISSION_METADATA", "REPORT"],
  DISCIPLINE: ["PUBLIC", "DISCIPLINE_CASE", "CLUE", "AUDIT_LOG", "AI_TRACE", "EVIDENCE", "PERMISSION_METADATA"],
  DATA_ADMIN: ["PUBLIC", "DATA_GOVERNANCE", "DATA_QUALITY", "METADATA", "AUDIT_LOG", "BACKUP", "PERMISSION_METADATA"],
  PUBLIC_OPINION: ["PUBLIC", "OPINION", "PUBLICITY"],
};

const WORKFLOW_ALLOWED_OPERATIONS: Record<string, readonly OperationType[]> = {
  "草稿": ["CREATE", "READ", "UPDATE", "DELETE"],
  "待辅导员初审": ["READ", "UPDATE"],
  "待院系复核": ["READ", "UPDATE"],
  "待校级复审": ["READ", "UPDATE"],
  "待公示": ["READ", "UPDATE"],
  "公示中": ["READ", "CREATE"],
  "待发放": ["READ", "UPDATE"],
  "已完成": ["READ", "EXPORT"],
  "已退回补正": ["READ", "UPDATE"],
  "已驳回": ["READ", "CREATE"],
  "申诉处理中": ["READ", "UPDATE"],
};

const sensitivityIndex = (level: SensitiveLevel) => Number(level.slice(1));
const aiIndex = (level: AiRiskLevel) => Number(level.slice(1));
const definition = (code: DimensionCode) => DIMENSION_DEFINITIONS.find((item) => item.code === code)!;
function result(code: DimensionCode, status: PermissionStatus, reason: string, evidence: string[], requiredApprovals = 0, fieldMode?: FieldMode): DimensionDecision {
  const item = definition(code);
  return { code, name: item.name, status, reason, evidence, policyRef: item.policyRef, requiredApprovals, fieldMode };
}

function organizationAllowed(actor: ActorContext, resource: PermissionResource): boolean {
  const scope: DataScope = ROLE_PROFILES[actor.role].dataScope;
  if (scope === "platform") return true;
  if (resource.campusId && !actor.campusIds.includes(resource.campusId)) return false;
  if (scope === "school") return true;
  if (scope === "department") return Boolean(resource.departmentId && actor.departmentIds?.includes(resource.departmentId));
  if (scope === "class") return Boolean(resource.classId && actor.classIds?.includes(resource.classId));
  if (scope === "self") return resource.ownerId === actor.userId;
  return Boolean(resource.assignedTaskId && actor.assignedTaskIds?.includes(resource.assignedTaskId));
}

function evaluateRole(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  const profile = ROLE_PROFILES[actor.role];
  if (!actor.authenticated) return result("role", "DENY", "身份未认证，默认拒绝。", ["authenticated=false"]);
  if (!profile.permissions.includes(request.permission)) return result("role", "DENY", `角色“${profile.name}”未授予 ${request.permission}。`, [`role=${actor.role}`, `permission=${request.permission}`]);
  return result("role", "ALLOW", "角色权限点校验通过。", [`role=${actor.role}`, `permission=${request.permission}`]);
}

function evaluateOrganization(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  const allowed = organizationAllowed(actor, request.resource);
  return allowed
    ? result("organization", "ALLOW", "资源位于当前组织或任务授权范围。", [`scope=${ROLE_PROFILES[actor.role].dataScope}`, `campus=${request.resource.campusId ?? "none"}`, `department=${request.resource.departmentId ?? "none"}`, `class=${request.resource.classId ?? "none"}`])
    : result("organization", "DENY", "资源超出当前组织、本人或分配任务范围。", [`scope=${ROLE_PROFILES[actor.role].dataScope}`, `resource=${request.resource.id}`]);
}

function evaluateDataScope(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  const granted = DATA_TAGS_BY_ROLE[actor.role];
  const missing = request.resource.dataTags.filter((tag) => !granted.includes(tag));
  if (missing.length) return result("data-scope", "DENY", `岗位未注册以下数据范围：${missing.join("、")}。`, [`granted=${granted.join(",")}`, `requested=${request.resource.dataTags.join(",")}`]);
  if (request.resource.academicYear && !request.resource.academicYear.startsWith("2026") && !["AUDITOR", "DISCIPLINE", "DATA_ADMIN"].includes(actor.role)) {
    return result("data-scope", "PENDING_APPROVAL", "历史学年度数据已归档，需要追加授权。", [`academicYear=${request.resource.academicYear}`], 1);
  }
  return result("data-scope", "ALLOW", "资源数据标签全部落在岗位注册范围。", [`tags=${request.resource.dataTags.join(",") || "none"}`]);
}

function evaluateTime(request: NineDimensionRequest): DimensionDecision {
  const runtime = request.runtime;
  if (runtime.emergencyMode) return result("time", "ALLOW", "紧急绿色通道已显式开启，时间限制放行并要求全量留痕。", ["emergencyMode=true", `occurredAt=${runtime.occurredAt}`]);
  if (runtime.timePolicy === "always") return result("time", "ALLOW", "该操作没有额外时间窗口限制。", [`occurredAt=${runtime.occurredAt}`]);
  if (runtime.timePolicy === "business-window") {
    return runtime.businessWindowOpen
      ? result("time", "ALLOW", "业务办理窗口处于开放状态。", ["businessWindowOpen=true"])
      : result("time", "DENY", "业务办理窗口已关闭。", ["businessWindowOpen=false"]);
  }
  const now = new Date(runtime.occurredAt);
  const inHours = isCampusWorkHours(now);
  return inHours
    ? result("time", "ALLOW", "操作发生在工作日08:00—18:00。", [`zone=Asia/Shanghai`, `occurredAt=${runtime.occurredAt}`])
    : result("time", "DENY", "敏感操作仅允许在工作日08:00—18:00执行。", [`zone=Asia/Shanghai`, `occurredAt=${runtime.occurredAt}`]);
}

function evaluateGeography(request: NineDimensionRequest): DimensionDecision {
  const { geographicLevel, deviceTrusted, mfaVerified } = request.runtime;
  const evidence = [`level=${geographicLevel}`, `deviceTrusted=${deviceTrusted}`, `mfaVerified=${mfaVerified}`, `ip=${request.runtime.ipAddress ?? "not-recorded"}`];
  if (geographicLevel === "L5") return result("geography", "DENY", "境外或未知位置仅允许登录，不下发业务数据。", evidence);
  if (geographicLevel === "L4" && (request.operation !== "READ" || sensitivityIndex(request.resource.sensitiveLevel) > 1)) return result("geography", "DENY", "国内异地仅允许P0/P1低敏只读操作。", evidence);
  if (geographicLevel === "L3" && !["READ", "CREATE"].includes(request.operation)) return result("geography", "DENY", "外勤位置仅允许查询和申请提交，不可办理审批、删除或导出。", evidence);
  if ((request.permission === "grant:prepare" || request.permission === "model:manage") && geographicLevel !== "L1") return result("geography", "DENY", "资金发放或模型参数修改必须从L1校内核心区发起。", evidence);
  if (request.operation === "EXPORT" && sensitivityIndex(request.resource.sensitiveLevel) >= 3 && !["L1", "L2"].includes(geographicLevel)) return result("geography", "DENY", "P3以上数据导出仅允许在L1/L2位置执行。", evidence);
  if (!deviceTrusted && sensitivityIndex(request.resource.sensitiveLevel) >= 2 && !mfaVerified) return result("geography", "PENDING_APPROVAL", "陌生设备处理敏感数据前需要完成MFA。", evidence, 1);
  return result("geography", "ALLOW", "位置、设备可信度与MFA条件满足。", evidence);
}

function evaluateWorkflow(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  const state = request.resource.processState;
  if (!state) return result("workflow", "ALLOW", "资源未绑定业务状态机。", ["processState=none"]);
  const allowed = WORKFLOW_ALLOWED_OPERATIONS[state] ?? ["READ"];
  if (!allowed.includes(request.operation)) return result("workflow", "DENY", `流程状态“${state}”不允许${request.operation}操作。`, [`allowed=${allowed.join(",")}`]);
  if (request.resource.currentHandlerId && request.operation === "UPDATE" && request.resource.currentHandlerId !== actor.userId) return result("workflow", "DENY", "当前用户不是该流程节点处理人。", [`handler=${request.resource.currentHandlerId}`, `actor=${actor.userId}`]);
  if (state === "待发放" && request.operation === "UPDATE" && actor.role !== "FINANCE") return result("workflow", "DENY", "待发放节点仅允许财务人员执行发放确认。", [`role=${actor.role}`]);
  return result("workflow", "ALLOW", `流程状态“${state}”允许当前操作。`, [`operation=${request.operation}`, `allowed=${allowed.join(",")}`]);
}

function evaluateAiRisk(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  if (request.actorType === "human") return result("ai-risk", "ALLOW", "当前为人工操作，不授予AI额外权限。", [`risk=${request.aiRiskLevel}`, "actorType=human"]);
  const boundary = request.agent;
  if (!boundary) return result("ai-risk", "DENY", "Agent执行缺少已注册工具边界。", ["agentBoundary=missing"]);
  const team = ROLE_GOVERNANCE_POLICIES[actor.role].agentTeam;
  if (!team.some((agent) => agent.code === boundary.agentCode)) return result("ai-risk", "DENY", "Agent不属于当前角色专属团队。", [`agent=${boundary.agentCode}`, `role=${actor.role}`]);
  if (!boundary.toolRegistered || !boundary.allowedRoles.includes(actor.role) || !boundary.registeredPermissions.includes(request.permission)) return result("ai-risk", "DENY", "Agent工具注册权限与角色权限没有形成有效交集。", [`tool=${boundary.toolName}`, `registered=${boundary.toolRegistered}`, `toolRoles=${boundary.allowedRoles.join(",")}`]);
  if (!boundary.guardrailPassed) return result("ai-risk", "DENY", "系统安全护栏已阻断该Agent操作。", [`tool=${boundary.toolName}`, "guardrail=false"]);
  const maxLevel = ROLE_GOVERNANCE_POLICIES[actor.role].maxAiLevel;
  if (aiIndex(request.aiRiskLevel) > aiIndex(maxLevel)) return result("ai-risk", "DENY", `请求风险${request.aiRiskLevel}超过岗位AI上限${maxLevel}。`, [`risk=${request.aiRiskLevel}`, `max=${maxLevel}`]);
  if (request.aiRiskLevel === "L5") return result("ai-risk", "DENY", "L5操作强制人工，AI完全禁止执行。", ["mode=zero-ai"]);
  if (request.aiRiskLevel === "L4" && request.operation !== "READ") return result("ai-risk", "DENY", "L4仅允许AI生成建议，业务写操作必须由人工完成。", ["mode=advisory-only", `operation=${request.operation}`]);
  if (request.aiRiskLevel === "L3" && !request.runtime.sandboxPassed) return result("ai-risk", "PENDING_APPROVAL", "L3能力需先通过个人沙盒验证。", ["sandboxPassed=false"], 1);
  if (request.aiRiskLevel === "L2" && !request.runtime.trialApproved) return result("ai-risk", "PENDING_APPROVAL", "L2能力需完成部门试用并获批。", ["trialApproved=false"], 1);
  if (request.aiRiskLevel === "L1" && request.runtime.confirmations < 1) return result("ai-risk", "PENDING_APPROVAL", "L1能力需要授权人员会签。", [`confirmations=${request.runtime.confirmations}`], 1);
  return result("ai-risk", "ALLOW", "Agent团队、工具注册、护栏与AI等级全部通过。", [`agent=${boundary.agentCode}`, `tool=${boundary.toolName}`, `risk=${request.aiRiskLevel}`]);
}

function sensitivityMode(role: RoleCode, level: SensitiveLevel): FieldMode {
  if (sensitivityIndex(level) <= 2) return "full";
  if (level === "P3") return ["STUDENT", "BANK", "FINANCE", "DATA_ADMIN"].includes(role) ? "full" : "masked";
  if (level === "P4") return ["AUDITOR", "DISCIPLINE", "AI_OPS", "DATA_ADMIN"].includes(role) ? "full" : "hidden";
  return role === "DISCIPLINE" ? "full" : "hidden";
}

function evaluateSensitivity(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  const level = request.resource.sensitiveLevel;
  const max = ROLE_GOVERNANCE_POLICIES[actor.role].maxDataSensitivity;
  const mode = sensitivityMode(actor.role, level);
  const evidence = [`level=${level}`, `roleMax=${max}`, `fieldMode=${mode}`, `purpose=${request.runtime.purpose ? "registered" : "missing"}`];
  if (level === "P5" && (actor.role !== "DISCIPLINE" || request.runtime.approvedBy.length < 2)) return result("sensitivity", "DENY", "P5纪检材料仅允许纪检人员在双人授权后访问。", evidence, 2, "hidden");
  if (sensitivityIndex(level) > sensitivityIndex(max) || mode === "hidden") return result("sensitivity", "DENY", `岗位无权访问${level}级数据。`, evidence, 0, "hidden");
  if (sensitivityIndex(level) >= 3 && !request.runtime.purpose?.trim()) return result("sensitivity", "PENDING_APPROVAL", `${level}级数据查阅必须登记明确用途。`, evidence, 1, mode);
  return result("sensitivity", "ALLOW", mode === "masked" ? "敏感字段按岗位策略脱敏后可见。" : "数据敏感等级与岗位上限匹配。", evidence, 0, mode);
}

function evaluateOperation(actor: ActorContext, request: NineDimensionRequest): DimensionDecision {
  const evidence = [`operation=${request.operation}`, `confirmations=${request.runtime.confirmations}`, `itemCount=${request.runtime.itemCount ?? 1}`];
  if (request.operation === "DELETE") {
    if (!["SYS_ADMIN", "DISCIPLINE"].includes(actor.role)) return result("operation", "DENY", "删除仅允许系统管理员或纪检人员在专属范围执行。", evidence);
    if (request.runtime.confirmations < 2) return result("operation", "PENDING_APPROVAL", "删除操作需要二次确认并采用逻辑删除。", evidence, 2);
  }
  if (request.operation === "EXPORT") {
    if (!request.runtime.purpose?.trim()) return result("operation", "PENDING_APPROVAL", "导出必须登记用途。", evidence, 1);
    if ((request.runtime.itemCount ?? 1) > 1000) return result("operation", "DENY", "单次导出超过1000条上限。", evidence);
    if (sensitivityIndex(request.resource.sensitiveLevel) >= 2 && request.runtime.confirmations < 2) return result("operation", "PENDING_APPROVAL", "P2以上数据导出需要用途确认和脱敏预览双重确认。", evidence, 2);
  }
  return result("operation", "ALLOW", "操作类型的专项安全控制通过。", evidence);
}

export function evaluateNineDimensionPermission(actor: ActorContext, request: NineDimensionRequest): NineDimensionDecision {
  const dimensions = [evaluateRole(actor, request), evaluateOrganization(actor, request), evaluateDataScope(actor, request), evaluateTime(request), evaluateGeography(request), evaluateWorkflow(actor, request), evaluateAiRisk(actor, request), evaluateSensitivity(actor, request), evaluateOperation(actor, request)];
  const denied = dimensions.filter((item) => item.status === "DENY");
  const pending = dimensions.filter((item) => item.status === "PENDING_APPROVAL" || item.status === "ESCALATE");
  const status: PermissionStatus = denied.length ? "DENY" : pending.length ? "PENDING_APPROVAL" : "ALLOW";
  const fieldMode = dimensions.find((item) => item.code === "sensitivity")?.fieldMode ?? "full";
  const requiredApprovals = Math.max(0, ...dimensions.map((item) => item.requiredApprovals));
  const formula = request.actorType === "agent" ? buildFormula(dimensions, request) : null;
  const primary = denied[0] ?? pending[0];
  return {
    status,
    allowed: status === "ALLOW",
    code: status === "ALLOW" ? "NINE_DIMENSION_ALLOW" : status === "DENY" ? `${primary?.code.toUpperCase().replace("-", "_")}_DENIED` : "APPROVAL_REQUIRED",
    reason: primary?.reason ?? "九个维度全部通过。",
    deniedBy: denied.map((item) => item.code),
    pendingBy: pending.map((item) => item.code),
    requiredApprovals,
    fieldMode,
    dimensions,
    formula,
    evaluatedAt: new Date().toISOString(),
  };
}

function buildFormula(dimensions: DimensionDecision[], request: NineDimensionRequest) {
  const byCode = (code: DimensionCode) => dimensions.find((item) => item.code === code)!;
  const boundary = request.agent!;
  const components: AgentFormulaComponent[] = [
    { code: "user-role", name: "用户角色权限", status: byCode("role").status, detail: byCode("role").reason },
    { code: "agent-tool", name: "Agent工具注册权限", status: boundary.toolRegistered && boundary.registeredPermissions.includes(request.permission) ? "ALLOW" : "DENY", detail: `${boundary.agentCode} → ${boundary.toolName}` },
    { code: "nine-dimension", name: "九维权限校验", status: dimensions.some((item) => item.status === "DENY") ? "DENY" : dimensions.some((item) => item.status !== "ALLOW") ? "PENDING_APPROVAL" : "ALLOW", detail: "角色、组织、数据、时间、地理、流程、AI、敏感度、操作类型" },
    { code: "guardrail", name: "安全护栏", status: boundary.guardrailPassed ? "ALLOW" : "DENY", detail: boundary.guardrailPassed ? "输入与输出护栏通过" : "护栏命中阻断规则" },
    { code: "workflow", name: "流程状态限制", status: byCode("workflow").status, detail: byCode("workflow").reason },
    { code: "time", name: "时间窗口", status: byCode("time").status, detail: byCode("time").reason },
    { code: "geography", name: "地理位置", status: byCode("geography").status, detail: byCode("geography").reason },
  ];
  return { expression: "用户角色权限 ∩ Agent工具注册权限 ∩ 九维权限校验 ∩ 安全护栏 ∩ 流程状态 ∩ 时间窗口 ∩ 地理位置", effective: components.every((item) => item.status === "ALLOW"), components };
}

export function defaultRuntime(overrides: Partial<PermissionRuntimeContext> = {}): PermissionRuntimeContext {
  return { occurredAt: new Date().toISOString(), timePolicy: "always", geographicLevel: "L2", ipAddress: "10.20.8.12", deviceTrusted: true, mfaVerified: true, confirmations: 0, approvedBy: [], trialApproved: true, sandboxPassed: true, ...overrides };
}


/** Query-only adapter. Deliberately delegates to the unchanged nine-dimension decision logic. */
export function evaluateAgentReadQuery(actor: ActorContext, request: NineDimensionRequest): NineDimensionDecision {
  if (request.operation !== "READ" || request.actorType !== "agent") throw new Error("NINE_DIMENSION_READ_ONLY_REQUIRED");
  return evaluateNineDimensionPermission(actor, request);
}
