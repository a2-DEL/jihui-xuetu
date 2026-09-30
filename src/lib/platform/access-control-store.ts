import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ActorContext } from "./authorization";
import { DEMO_IDENTITIES, toActorContext } from "./demo-identities";
import { DIMENSION_DEFINITIONS, defaultRuntime, evaluateNineDimensionPermission, type GeographicLevel, type NineDimensionDecision, type NineDimensionRequest, type PermissionRuntimeContext } from "./nine-dimension-engine";
import type { RoleCode } from "./roles";
import { writeAuditSnapshot } from "./demo-store";

export interface PermissionScenario {
  id: string;
  name: string;
  category: "正常放行" | "越权阻断" | "条件审批" | "Agent护栏";
  description: string;
  actorId: string;
  actorRole: RoleCode;
  request: NineDimensionRequest;
}

export interface PermissionDecisionRecord {
  id: string;
  scenarioId: string;
  scenarioName: string;
  actorId: string;
  actorRole: RoleCode;
  actorType: "human" | "agent";
  permission: string;
  operation: string;
  resourceId: string;
  resourceType: string;
  sensitiveLevel: string;
  geographicLevel: GeographicLevel;
  decision: NineDimensionDecision;
  createdAt: string;
  initiatedBy: string;
  idempotencyKey?: string;
}

export interface SimulationOverrides {
  geographicLevel?: GeographicLevel;
  deviceTrusted?: boolean;
  mfaVerified?: boolean;
  occurredAt?: string;
  confirmations?: number;
  purpose?: string;
  businessWindowOpen?: boolean;
  sandboxPassed?: boolean;
  trialApproved?: boolean;
}

const GOVERNANCE_ROLES: readonly RoleCode[] = ["SYS_ADMIN", "AI_OPS", "DATA_ADMIN", "AUDITOR", "DISCIPLINE"];
const decisionsFile = path.join(process.cwd(), ".runtime", "permission-decisions.json");
const identity = (id: string) => {
  const found = DEMO_IDENTITIES.find((item) => item.id === id);
  if (!found) throw new Error(`DEMO_IDENTITY_NOT_FOUND:${id}`);
  return toActorContext(found);
};
const workTime = "2026-08-04T10:00:00+08:00";

export const PERMISSION_SCENARIOS: readonly PermissionScenario[] = [
  {
    id: "student-own-application-read", name: "学生查看本人申请", category: "正常放行", description: "验证本人范围、P2数据和低风险读取。", actorId: "demo-student", actorRole: "STUDENT",
    request: { permission: "application:self-manage", operation: "READ", actorType: "human", aiRiskLevel: "L0", resource: { id: "app-2026-001", type: "资助申请", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", ownerId: "demo-student", dataTags: ["APPLICATION"], academicYear: "2026-2027", sensitiveLevel: "P2", processState: "待辅导员初审" }, runtime: defaultRuntime({ occurredAt: workTime, geographicLevel: "L2" }) },
  },
  {
    id: "student-cross-owner-read", name: "学生读取他人申请", category: "越权阻断", description: "验证本人范围不可横向越权。", actorId: "demo-student", actorRole: "STUDENT",
    request: { permission: "application:self-manage", operation: "READ", actorType: "human", aiRiskLevel: "L0", resource: { id: "app-2026-002", type: "资助申请", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", ownerId: "demo-student-002", dataTags: ["APPLICATION"], academicYear: "2026-2027", sensitiveLevel: "P2", processState: "待辅导员初审" }, runtime: defaultRuntime({ occurredAt: workTime, geographicLevel: "L2" }) },
  },
  {
    id: "counselor-own-class-review", name: "辅导员办理所带班级初审", category: "正常放行", description: "验证班级范围、流程处理人与业务窗口。", actorId: "demo-counselor", actorRole: "COUNSELOR",
    request: { permission: "application:first-review", operation: "UPDATE", actorType: "human", aiRiskLevel: "L0", resource: { id: "app-2026-001", type: "资助申请", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", ownerId: "demo-student", dataTags: ["APPLICATION", "MATERIAL"], academicYear: "2026-2027", sensitiveLevel: "P2", processState: "待辅导员初审", currentHandlerId: "demo-counselor" }, runtime: defaultRuntime({ occurredAt: workTime, timePolicy: "business-window", businessWindowOpen: true, geographicLevel: "L2" }) },
  },
  {
    id: "counselor-cross-class-review", name: "辅导员跨班级初审", category: "越权阻断", description: "验证班级和院系组织边界。", actorId: "demo-counselor", actorRole: "COUNSELOR",
    request: { permission: "application:first-review", operation: "UPDATE", actorType: "human", aiRiskLevel: "L0", resource: { id: "app-2026-003", type: "资助申请", campusId: "campus-main", departmentId: "dept-engineering", classId: "class-eng-01", ownerId: "demo-student-003", dataTags: ["APPLICATION"], academicYear: "2026-2027", sensitiveLevel: "P2", processState: "待辅导员初审", currentHandlerId: "demo-counselor" }, runtime: defaultRuntime({ occurredAt: workTime, timePolicy: "business-window", businessWindowOpen: true, geographicLevel: "L2" }) },
  },
  {
    id: "finance-core-zone-disbursement", name: "财务核心区发放确认", category: "正常放行", description: "验证L1核心区、P3用途登记、流程节点和双确认。", actorId: "demo-finance", actorRole: "FINANCE",
    request: { permission: "grant:prepare", operation: "UPDATE", actorType: "human", aiRiskLevel: "L0", resource: { id: "grant-batch-2026-spring", type: "发放批次", campusId: "campus-main", dataTags: ["GRANT", "APPLICATION_REFERENCE"], sensitiveLevel: "P3", processState: "待发放", currentHandlerId: "demo-finance" }, runtime: defaultRuntime({ occurredAt: workTime, timePolicy: "work-hours", geographicLevel: "L1", purpose: "执行已审批发放批次", confirmations: 2, approvedBy: ["demo-fund-leader", "demo-finance"] }) },
  },
  {
    id: "finance-remote-disbursement", name: "财务异地发放", category: "越权阻断", description: "验证资金发放必须从L1指定终端发起。", actorId: "demo-finance", actorRole: "FINANCE",
    request: { permission: "grant:prepare", operation: "UPDATE", actorType: "human", aiRiskLevel: "L0", resource: { id: "grant-batch-2026-spring", type: "发放批次", campusId: "campus-main", dataTags: ["GRANT", "APPLICATION_REFERENCE"], sensitiveLevel: "P3", processState: "待发放", currentHandlerId: "demo-finance" }, runtime: defaultRuntime({ occurredAt: workTime, timePolicy: "work-hours", geographicLevel: "L4", ipAddress: "117.34.22.18", purpose: "执行发放", confirmations: 2, approvedBy: ["demo-fund-leader", "demo-finance"] }) },
  },
  {
    id: "fund-admin-agent-l4-review", name: "业务Agent尝试提交L4审核", category: "Agent护栏", description: "验证L4只能给建议，Agent不得写入审批状态。", actorId: "demo-fund-admin", actorRole: "FUND_ADMIN",
    request: { permission: "assistant:use", operation: "UPDATE", actorType: "agent", aiRiskLevel: "L4", agent: { agentCode: "fund_admin-agent-1", toolName: "submit_review_decision", toolRegistered: true, allowedRoles: ["FUND_ADMIN"], registeredPermissions: ["assistant:use"], guardrailPassed: true }, resource: { id: "app-2026-004", type: "资助申请", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-02", ownerId: "demo-student-004", dataTags: ["APPLICATION", "MATERIAL"], sensitiveLevel: "P3", processState: "待校级复审", currentHandlerId: "demo-fund-admin" }, runtime: defaultRuntime({ occurredAt: workTime, timePolicy: "work-hours", geographicLevel: "L1", purpose: "生成审核辅助建议", confirmations: 1 }) },
  },
  {
    id: "counselor-agent-unregistered-tool", name: "辅导员Agent调用未注册工具", category: "Agent护栏", description: "验证Agent工具注册权限与角色权限必须取交集。", actorId: "demo-counselor", actorRole: "COUNSELOR",
    request: { permission: "assistant:use", operation: "READ", actorType: "agent", aiRiskLevel: "L1", agent: { agentCode: "counselor-agent-1", toolName: "read_other_department", toolRegistered: false, allowedRoles: ["COUNSELOR"], registeredPermissions: ["assistant:use"], guardrailPassed: true }, resource: { id: "app-2026-001", type: "资助申请", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", ownerId: "demo-student", dataTags: ["APPLICATION"], sensitiveLevel: "P2", processState: "待辅导员初审" }, runtime: defaultRuntime({ occurredAt: workTime, geographicLevel: "L2", confirmations: 1 }) },
  },
  {
    id: "data-admin-business-update", name: "数据管理员尝试业务修改", category: "越权阻断", description: "验证数据治理岗位无具体资助业务决策权。", actorId: "demo-data-admin", actorRole: "DATA_ADMIN",
    request: { permission: "data:quality-read", operation: "UPDATE", actorType: "human", aiRiskLevel: "L0", resource: { id: "app-2026-004", type: "资助申请", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-02", dataTags: ["APPLICATION"], sensitiveLevel: "P2", processState: "待校级复审" }, runtime: defaultRuntime({ occurredAt: workTime, geographicLevel: "L1" }) },
  },
  {
    id: "discipline-p5-authorized-read", name: "纪检双人授权读取P5案件", category: "正常放行", description: "验证P5仅纪检、任务范围、用途登记和双人授权。", actorId: "demo-discipline", actorRole: "DISCIPLINE",
    request: { permission: "discipline:case-manage", operation: "READ", actorType: "human", aiRiskLevel: "L0", resource: { id: "discipline-case-2026-01", type: "纪检案件", campusId: "campus-main", assignedTaskId: "discipline-case-2026-01", dataTags: ["DISCIPLINE_CASE", "EVIDENCE"], sensitiveLevel: "P5" }, runtime: defaultRuntime({ occurredAt: workTime, timePolicy: "work-hours", geographicLevel: "L1", purpose: "案件调查取证", confirmations: 2, approvedBy: ["discipline-a", "discipline-b"] }) },
  },
] as const;

function createSeedRecords(): PermissionDecisionRecord[] {
  return PERMISSION_SCENARIOS.map((scenario, index) => {
    const actor = identity(scenario.actorId);
    const decision = evaluateNineDimensionPermission(actor, scenario.request);
    return {
      id: `permission-seed-${String(index + 1).padStart(3, "0")}`,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      actorId: scenario.actorId,
      actorRole: scenario.actorRole,
      actorType: scenario.request.actorType,
      permission: scenario.request.permission,
      operation: scenario.request.operation,
      resourceId: scenario.request.resource.id,
      resourceType: scenario.request.resource.type,
      sensitiveLevel: scenario.request.resource.sensitiveLevel,
      geographicLevel: scenario.request.runtime.geographicLevel,
      decision,
      createdAt: `2026-08-04T${String(8 + index).padStart(2, "0")}:15:00+08:00`,
      initiatedBy: "system-policy-regression",
    };
  });
}

function loadRecords(): PermissionDecisionRecord[] {
  try {
    const parsed = JSON.parse(readFileSync(decisionsFile, "utf8")) as PermissionDecisionRecord[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch { /* initialize with deterministic regression decisions */ }
  return createSeedRecords();
}

type AccessControlGlobal = typeof globalThis & { __jhxtPermissionDecisions?: PermissionDecisionRecord[] };
const root = globalThis as AccessControlGlobal;
const records = root.__jhxtPermissionDecisions ?? loadRecords();
root.__jhxtPermissionDecisions = records;

function persistRecords() {
  try {
    mkdirSync(path.dirname(decisionsFile), { recursive: true });
    const temporary = `${decisionsFile}.tmp`;
    writeFileSync(temporary, JSON.stringify(records.slice(0, 200), null, 2), "utf8");
    renameSync(temporary, decisionsFile);
  } catch { /* development persistence is best-effort; in-memory data remains active */ }
}

function canReadAll(actor: ActorContext) { return GOVERNANCE_ROLES.includes(actor.role); }
export function canAccessPermissionCenter(actor: ActorContext) { return canReadAll(actor); }
export function listPermissionDecisions(actor: ActorContext) {
  const visible = canReadAll(actor) ? records : records.filter((item) => item.actorId === actor.userId);
  return visible.map((item) => structuredClone(item));
}
export function getPermissionDecision(actor: ActorContext, id: string) {
  const record = records.find((item) => item.id === id);
  if (!record || (!canReadAll(actor) && record.actorId !== actor.userId)) return null;
  return structuredClone(record);
}

export function accessControlOverview(actor: ActorContext) {
  const visible = listPermissionDecisions(actor);
  const denied = visible.filter((item) => item.decision.status === "DENY").length;
  const pending = visible.filter((item) => item.decision.status === "PENDING_APPROVAL").length;
  const byDimension = DIMENSION_DEFINITIONS.map((definition) => {
    const evaluations = visible.map((item) => item.decision.dimensions.find((dimension) => dimension.code === definition.code)).filter(Boolean);
    return { ...definition, total: evaluations.length, allowed: evaluations.filter((item) => item?.status === "ALLOW").length, denied: evaluations.filter((item) => item?.status === "DENY").length, pending: evaluations.filter((item) => item?.status === "PENDING_APPROVAL").length };
  });
  return {
    generatedAt: new Date().toISOString(),
    summary: { total: visible.length, allowed: visible.length - denied - pending, denied, pending, agent: visible.filter((item) => item.actorType === "agent").length, dimensions: 9 },
    byDimension,
    decisions: visible.slice(0, 100),
    scenarios: PERMISSION_SCENARIOS.map(({ request, ...scenario }) => ({ ...scenario, expectedStatus: evaluateNineDimensionPermission(identity(scenario.actorId), request).status })),
    engine: { version: "v2.0-nine-dimension", mode: "deterministic-and", persistence: ".runtime/permission-decisions.json", agentFormula: "角色权限 ∩ Agent工具注册权限 ∩ 九维权限 ∩ 安全护栏 ∩ 流程 ∩ 时间 ∩ 地理" },
  };
}

export function dimensionDetail(actor: ActorContext, code: string) {
  const definition = DIMENSION_DEFINITIONS.find((item) => item.code === code);
  if (!definition) return null;
  const decisions = listPermissionDecisions(actor).map((record) => ({ record, dimension: record.decision.dimensions.find((item) => item.code === code)! }));
  return {
    definition,
    summary: { total: decisions.length, allowed: decisions.filter((item) => item.dimension.status === "ALLOW").length, denied: decisions.filter((item) => item.dimension.status === "DENY").length, pending: decisions.filter((item) => item.dimension.status === "PENDING_APPROVAL").length },
    decisions,
  };
}

export function recordRuntimePermissionDecision(actor: ActorContext, input: { scenarioId: string; scenarioName: string; request: NineDimensionRequest; decision: NineDimensionDecision; initiatedBy: string; idempotencyKey?: string }) {
  const replay = input.idempotencyKey ? records.find((item) => item.initiatedBy === input.initiatedBy && item.idempotencyKey === input.idempotencyKey) : undefined;
  if (replay) return structuredClone(replay);
  const record: PermissionDecisionRecord = {
    id: `permission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenarioId: input.scenarioId,
    scenarioName: input.scenarioName,
    actorId: actor.userId,
    actorRole: actor.role,
    actorType: input.request.actorType,
    permission: input.request.permission,
    operation: input.request.operation,
    resourceId: input.request.resource.id,
    resourceType: input.request.resource.type,
    sensitiveLevel: input.request.resource.sensitiveLevel,
    geographicLevel: input.request.runtime.geographicLevel,
    decision: input.decision,
    createdAt: new Date().toISOString(),
    initiatedBy: input.initiatedBy,
    idempotencyKey: input.idempotencyKey,
  };
  records.unshift(record); if (records.length > 200) records.splice(200); persistRecords();
  writeAuditSnapshot({ taskId: record.id, actorId: actor.userId, actorRole: actor.role, action: "permission:evaluate", outcome: input.decision.status.toLocaleLowerCase(), evidenceSummary: `九维权限判定 ${input.decision.status}；场景 ${input.scenarioName}；拒绝维度 ${input.decision.deniedBy.join("、") || "无"}；待审批维度 ${input.decision.pendingBy.join("、") || "无"}。`, resource: { type: input.request.resource.type, id: input.request.resource.id, campusId: input.request.resource.campusId, departmentId: input.request.resource.departmentId, classId: input.request.resource.classId, sensitivity: input.request.resource.sensitiveLevel, workflowState: input.request.resource.processState }, permission: { decisionId: record.id, status: input.decision.status, deniedBy: input.decision.deniedBy, fieldMode: input.decision.fieldMode, nineDimensionSnapshot: Object.fromEntries(input.decision.dimensions.map(item => [item.code, { status: item.status, reason: item.reason, policyRef: item.policyRef }])) }, operationDetails: { permission: input.request.permission, operation: input.request.operation, requiredApprovals: input.decision.requiredApprovals }, context: { geographicLevel: input.request.runtime.geographicLevel, purpose: input.request.runtime.purpose } });
  return structuredClone(record);
}
export function simulatePermissionDecision(actor: ActorContext, input: { scenarioId: string; overrides?: SimulationOverrides; idempotencyKey: string }) {
  if (!canReadAll(actor)) return { success: false as const, code: "ROLE_DENIED", message: "当前岗位无权限运行全局权限策略模拟。" };
  if (!input.idempotencyKey) return { success: false as const, code: "IDEMPOTENCY_REQUIRED", message: "缺少幂等键，模拟请求已拒绝。" };
  const replay = records.find((item) => item.initiatedBy === actor.userId && item.idempotencyKey === input.idempotencyKey);
  if (replay) return { success: true as const, code: "IDEMPOTENT_REPLAY", message: "已返回同一幂等请求的原判定结果。", record: structuredClone(replay), replayed: true };
  const scenario = PERMISSION_SCENARIOS.find((item) => item.id === input.scenarioId);
  if (!scenario) return { success: false as const, code: "SCENARIO_NOT_FOUND", message: "权限测试场景不存在。" };
  const targetActor = identity(scenario.actorId);
  const overrides = input.overrides ?? {};
  const runtime: PermissionRuntimeContext = { ...scenario.request.runtime, ...overrides, approvedBy: scenario.request.runtime.approvedBy };
  const request: NineDimensionRequest = { ...scenario.request, runtime };
  const decision = evaluateNineDimensionPermission(targetActor, request);
  const record: PermissionDecisionRecord = {
    id: `permission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    actorId: scenario.actorId,
    actorRole: scenario.actorRole,
    actorType: request.actorType,
    permission: request.permission,
    operation: request.operation,
    resourceId: request.resource.id,
    resourceType: request.resource.type,
    sensitiveLevel: request.resource.sensitiveLevel,
    geographicLevel: request.runtime.geographicLevel,
    decision,
    createdAt: new Date().toISOString(),
    initiatedBy: actor.userId,
    idempotencyKey: input.idempotencyKey,
  };
  records.unshift(record);
  if (records.length > 200) records.splice(200);
  persistRecords();
  writeAuditSnapshot({ taskId: record.id, actorId: actor.userId, actorRole: actor.role, action: "permission:simulate", outcome: decision.status.toLocaleLowerCase(), evidenceSummary: `运行九维权限场景“${scenario.name}”，结果 ${decision.status}；拒绝维度 ${decision.deniedBy.join("、") || "无"}；本次仅模拟未执行业务操作。`, resource: { type: request.resource.type, id: request.resource.id, campusId: request.resource.campusId, departmentId: request.resource.departmentId, classId: request.resource.classId, sensitivity: request.resource.sensitiveLevel, workflowState: request.resource.processState }, permission: { decisionId: record.id, status: decision.status, deniedBy: decision.deniedBy, fieldMode: decision.fieldMode, nineDimensionSnapshot: Object.fromEntries(decision.dimensions.map(item => [item.code, { status: item.status, reason: item.reason, policyRef: item.policyRef }])) }, operationDetails: { simulation: true, permission: request.permission, operation: request.operation, requiredApprovals: decision.requiredApprovals }, context: { geographicLevel: runtime.geographicLevel, purpose: runtime.purpose } });
  return { success: true as const, code: "SIMULATION_COMPLETED", message: "九维策略模拟完成，未执行任何业务写操作。", record: structuredClone(record), replayed: false };
}



