import { createHash } from "node:crypto";
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ActorContext, SensitiveLevel } from "./authorization";
import type { RoleCode } from "./roles";

export const AUDIT_CATEGORIES = ["AUTH", "DATA_ACCESS", "DATA_CHANGE", "AI_OPERATION", "PERMISSION", "SYSTEM_CONFIG", "SECURITY_EVENT", "AI_WITHDRAW", "BUSINESS"] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
export const AUDIT_LEVELS = ["INFO", "WARN", "ERROR", "SECURITY", "CRITICAL"] as const;
export type AuditLevel = (typeof AUDIT_LEVELS)[number];
export type AuditOutcome = "SUCCESS" | "PARTIAL" | "FAILURE" | "DENIED" | "HUMAN_CONFIRMED" | "EXCEPTION";
export type AuditOperationType = "CREATE" | "READ" | "UPDATE" | "DELETE" | "EXPORT" | "EXECUTE" | "LOGIN" | "LOGOUT" | "VERIFY";

export interface AuditResourceEvidence {
  type: string;
  id?: string;
  campusId?: string;
  departmentId?: string;
  classId?: string;
  assignedTaskId?: string;
  sensitivity: SensitiveLevel;
  workflowState?: string;
}

export interface AuditPermissionEvidence {
  decisionId?: string;
  status?: "ALLOW" | "DENY" | "PENDING_APPROVAL" | "ESCALATE";
  deniedBy?: string[];
  fieldMode?: "full" | "masked" | "hidden";
  nineDimensionSnapshot?: Record<string, unknown>;
}

export interface AuditAiEvidence {
  agentCode?: string;
  agentName?: string;
  modelProvider?: string;
  model?: string;
  modelVersion?: string;
  promptVersion?: string;
  knowledgeVersion?: string;
  skillVersion?: string;
  workflowVersion?: string;
  traceId?: string;
  inputSummary?: string;
  inputDigest?: string;
  outputSummary?: string;
  outputDigest?: string;
  retrievalSources?: string[];
  toolCalls?: Array<{ tool: string; argsType: string; timestamp: string }>;
  xaiSummary?: string;
  advisoryOnly?: boolean;
  humanOverride?: string | null;
}

export interface AuditRequestContext {
  dataScope?: string;
  geographicLevel?: string;
  sessionId?: string;
  clientIp?: string;
  deviceFingerprint?: string;
  purpose?: string;
}

export interface AuditEvidenceInput {
  taskId: string;
  actorId: string;
  actorRole: RoleCode;
  actorType?: "human" | "agent" | "system";
  actorDepartment?: string;
  action: string;
  operationType?: AuditOperationType;
  category?: AuditCategory;
  level?: AuditLevel;
  outcome: string;
  evidenceSummary: string;
  resource?: Partial<AuditResourceEvidence> & Pick<AuditResourceEvidence, "type">;
  operationDetails?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ai?: AuditAiEvidence;
  permission?: AuditPermissionEvidence;
  context?: AuditRequestContext;
  evidenceRefs?: string[];
  errorCode?: string;
  errorMessage?: string;
  affectedRows?: number;
  createdAt?: string;
}

export interface AuditEvidenceRecord {
  id: string;
  sequence: number;
  schemaVersion: "audit-evidence/v2";
  taskId: string;
  timestamp: string;
  actor: {
    id: string;
    role: RoleCode;
    type: "human" | "agent" | "system";
    department?: string;
  };
  operation: {
    type: AuditOperationType;
    category: AuditCategory;
    level: AuditLevel;
    action: string;
    targetEntity: string;
    targetId?: string;
    fieldsChanged: string[];
    details: Record<string, unknown>;
  };
  context: AuditRequestContext & {
    dataSensitivity: SensitiveLevel;
    workflowState?: string;
    campusId?: string;
    departmentId?: string;
    classId?: string;
    permissionSnapshot?: AuditPermissionEvidence;
  };
  result: {
    status: AuditOutcome;
    errorCode?: string;
    errorMessage?: string;
    affectedRows: number;
  };
  evidence: {
    summary: string;
    snapshotBefore?: Record<string, unknown>;
    snapshotAfter?: Record<string, unknown>;
    references: string[];
    ai?: AuditAiEvidence;
    xaiSummary?: string;
  };
  retention: {
    years: number;
    policy: string;
    deletionRequiresApproval: boolean;
  };
  immutable: true;
  previousHash: string;
  recordHash: string;
}

export interface AuditEvidenceFilter {
  category?: AuditCategory;
  level?: AuditLevel;
  outcome?: AuditOutcome;
  keyword?: string;
  actorId?: string;
  actorRole?: RoleCode;
  agentCode?: string;
  taskId?: string;
  sensitivity?: SensitiveLevel | "HIGH";
  page?: number;
  pageSize?: number;
}

export interface AuditChainVerification {
  valid: boolean;
  total: number;
  verifiedAt: string;
  genesisHash: string | null;
  headHash: string | null;
  brokenAt?: string;
  storage: "append-only-jsonl";
  algorithm: "SHA-256";
}

interface AuditState {
  records: AuditEvidenceRecord[];
  initialized: boolean;
  filePath: string;
}

type GlobalWithAuditStore = typeof globalThis & { __jhxtAuditEvidenceStore?: AuditState };
const globalForAudit = globalThis as GlobalWithAuditStore;
const runtimeFile = join(process.cwd(), ".runtime", "audit-evidence-chain.jsonl");
const state: AuditState = globalForAudit.__jhxtAuditEvidenceStore ?? { records: [], initialized: false, filePath: runtimeFile };
globalForAudit.__jhxtAuditEvidenceStore = state;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function redactObject(input: Record<string, unknown> | undefined, sensitivity: SensitiveLevel): Record<string, unknown> | undefined {
  if (!input) return undefined;
  const alwaysProtectedKeys = /secret|api.?key|access.?token|password|credential/i;
  const protectedKeys = /prompt|response|rag.?context|reasoning|chain.?of.?thought|id.?card|bank.?account|phone|address|student.?name|student.?no|household/i;
  const walk = (value: unknown, key = ""): unknown => {
    if (alwaysProtectedKeys.test(key)) return "[REDACTED:SECRET_NEVER_STORED]";
    if ((sensitivity === "P4" || sensitivity === "P5") && protectedKeys.test(key)) return "[REDACTED:P4_MINIMUM_EVIDENCE]";
    if (Array.isArray(value)) return value.map(item => walk(item, key));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, item]) => [childKey, walk(item, childKey)]));
    return value;
  };
  return walk(input) as Record<string, unknown>;
}

function normalizeOutcome(outcome: string): AuditOutcome {
  const value = outcome.trim().toLocaleLowerCase();
  if (["denied", "blocked", "deny"].includes(value)) return "DENIED";
  if (["failure", "failed", "error"].includes(value)) return "FAILURE";
  if (["partial"].includes(value)) return "PARTIAL";
  if (["exception"].includes(value)) return "EXCEPTION";
  if (["human_confirmed", "confirmed"].includes(value)) return "HUMAN_CONFIRMED";
  return "SUCCESS";
}

function inferCategory(action: string): AuditCategory {
  const value = action.toLocaleLowerCase();
  if (value.includes("withdraw") || value.includes("撤回")) return "AI_WITHDRAW";
  if (/login|logout|mfa|password|session/.test(value)) return "AUTH";
  if (/prompt.?injection|security|incident|abnormal/.test(value)) return "SECURITY_EVENT";
  if (/permission|rbac|role:|access.?control/.test(value)) return "PERMISSION";
  if (/model.?config|mcp.?config|system.?config|setting:/.test(value)) return "SYSTEM_CONFIG";
  if (/^ai:|^agent:|^skill:|^plugin:|^mcp:|^memory:|workflow:run|material_review/.test(value)) return "AI_OPERATION";
  if (/export|read|view|query|search|retrieval/.test(value)) return "DATA_ACCESS";
  if (/create|update|delete|transition|approve|return|publish|close|resolve|submit|execute|sync|reconcile|adjust/.test(value)) return "DATA_CHANGE";
  return "BUSINESS";
}

function inferLevel(category: AuditCategory): AuditLevel {
  if (category === "AI_WITHDRAW") return "CRITICAL";
  if (category === "SECURITY_EVENT") return "SECURITY";
  if (category === "SYSTEM_CONFIG") return "ERROR";
  if (category === "PERMISSION") return "WARN";
  return "INFO";
}

function inferOperationType(action: string): AuditOperationType {
  const value = action.toLocaleLowerCase();
  if (/login/.test(value)) return "LOGIN";
  if (/logout/.test(value)) return "LOGOUT";
  if (/verify|mfa/.test(value)) return "VERIFY";
  if (/export/.test(value)) return "EXPORT";
  if (/delete|remove|destroy/.test(value)) return "DELETE";
  if (/create|submit|install|publish/.test(value)) return "CREATE";
  if (/read|view|query|search|retrieval|list/.test(value)) return "READ";
  if (/update|change|adjust|approve|return|close|resolve|transition|reconcile|sync|password/.test(value)) return "UPDATE";
  return "EXECUTE";
}

function retentionFor(sensitivity: SensitiveLevel, category: AuditCategory): AuditEvidenceRecord["retention"] {
  if (sensitivity === "P5" || category === "AI_WITHDRAW") return { years: 50, policy: "P5纪检/AI撤回记录长期保留", deletionRequiresApproval: true };
  if (sensitivity === "P4") return { years: 10, policy: "P4 AI决策记录加密保留", deletionRequiresApproval: true };
  return { years: 3, policy: "P0-P3基础审计记录", deletionRequiresApproval: false };
}

function hashPayload(record: Omit<AuditEvidenceRecord, "recordHash">): string {
  return digest(record);
}

function createRecord(input: AuditEvidenceInput, sequence: number, previousHash: string): AuditEvidenceRecord {
  const category = input.category ?? inferCategory(input.action);
  const level = input.level ?? inferLevel(category);
  const sensitivity = input.resource?.sensitivity ?? (category === "AI_WITHDRAW" ? "P5" : category === "AI_OPERATION" ? "P4" : "P2");
  const before = redactObject(input.before, sensitivity);
  const after = redactObject(input.after, sensitivity);
  const fieldsChanged = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})].filter(key => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])))];
  const timestamp = input.createdAt ?? new Date().toISOString();
  const id = `AUD-${timestamp.slice(0, 10).replaceAll("-", "")}-${String(sequence).padStart(9, "0")}`;
  const ai = input.ai ? { ...input.ai, inputSummary: input.ai.inputSummary?.slice(0, 500), outputSummary: input.ai.outputSummary?.slice(0, 500), xaiSummary: input.ai.xaiSummary?.slice(0, 1000) } : undefined;
  const withoutHash: Omit<AuditEvidenceRecord, "recordHash"> = {
    id,
    sequence,
    schemaVersion: "audit-evidence/v2",
    taskId: input.taskId,
    timestamp,
    actor: { id: input.actorId, role: input.actorRole, type: input.actorType ?? (ai ? "agent" : "human"), department: input.actorDepartment },
    operation: {
      type: input.operationType ?? inferOperationType(input.action),
      category,
      level,
      action: input.action,
      targetEntity: input.resource?.type ?? input.action.split(":")[0] ?? "unknown",
      targetId: input.resource?.id,
      fieldsChanged,
      details: redactObject(input.operationDetails, sensitivity) ?? {},
    },
    context: {
      ...(input.context ?? {}),
      dataSensitivity: sensitivity,
      workflowState: input.resource?.workflowState,
      campusId: input.resource?.campusId,
      departmentId: input.resource?.departmentId,
      classId: input.resource?.classId,
      permissionSnapshot: input.permission,
    },
    result: {
      status: normalizeOutcome(input.outcome),
      errorCode: input.errorCode,
      errorMessage: input.errorMessage?.slice(0, 1000),
      affectedRows: input.affectedRows ?? (normalizeOutcome(input.outcome) === "SUCCESS" || normalizeOutcome(input.outcome) === "HUMAN_CONFIRMED" ? 1 : 0),
    },
    evidence: {
      summary: input.evidenceSummary.slice(0, 2000),
      snapshotBefore: before,
      snapshotAfter: after,
      references: [...new Set(input.evidenceRefs ?? [])],
      ai,
      xaiSummary: ai?.xaiSummary,
    },
    retention: retentionFor(sensitivity, category),
    immutable: true,
    previousHash,
  };
  return { ...withoutHash, recordHash: hashPayload(withoutHash) };
}

const seedInputs: AuditEvidenceInput[] = [
  { taskId: "audit-task-2026-01", actorId: "demo-counselor", actorRole: "COUNSELOR", action: "application:approve", outcome: "success", evidenceSummary: "申请 app-2026-002 完成辅导员初审；人工确认；材料摘要哈希已留存。", resource: { type: "application", id: "app-2026-002", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", sensitivity: "P2", workflowState: "待院系复核" }, before: { status: "待辅导员初审", version: 1 }, after: { status: "待院系复核", version: 2 }, context: { dataScope: "class-agri-01", geographicLevel: "L1", sessionId: "SESS-DEMO-001", clientIp: "10.10.100.45", deviceFingerprint: "DEV-WIN-CHROME" }, createdAt: "2026-08-01T09:30:00+08:00" },
  { taskId: "grant-batch-2026-spring", actorId: "demo-fund-admin", actorRole: "FUND_ADMIN", action: "grant_batch:create", outcome: "success", evidenceSummary: "发放批次 FF2026SPRING001 已编制，等待独立业务审批。", resource: { type: "grant_batch", id: "grant-batch-2026-spring", campusId: "campus-main", sensitivity: "P3", workflowState: "pending_business_approval" }, after: { batchNo: "FF2026SPRING001", count: 1, amount: 12000, status: "pending_business_approval" }, createdAt: "2026-08-01T10:10:00+08:00" },
  { taskId: "ai-task-review-001", actorId: "demo-fund-admin", actorRole: "FUND_ADMIN", actorType: "agent", action: "ai:material_review", outcome: "human_confirmed", evidenceSummary: "AI完成材料一致性建议，处理人复核后采纳；仅留存P4最小必要证据。", resource: { type: "application", id: "app-2026-003", campusId: "campus-main", sensitivity: "P4", workflowState: "待院系复核" }, ai: { agentCode: "fund_admin-agent-1", agentName: "业务审核Agent", modelProvider: "DeepSeek", model: "deepseek-chat", modelVersion: "deepseek-chat-2026.08", promptVersion: "material-review-v3", knowledgeVersion: "policy-kb-2026.08.01", skillVersion: "material-check-v2.4", workflowVersion: "application-review-v5", traceId: "TRACE-AI-20260801-001", inputSummary: "困难认定申请材料一致性校验（个人信息已脱敏）", inputDigest: "sha256:seed-input-001", outputSummary: "发现1项金额佐证需要人工复核，未自动形成业务结论", outputDigest: "sha256:seed-output-001", retrievalSources: ["POLICY-2024-001-Art3", "MATERIAL-RULE-012"], toolCalls: [{ tool: "get_application_material_digest", argsType: "application_id", timestamp: "T+42ms" }], xaiSummary: "材料日期与申请期匹配，但医疗金额缺少发票汇总页；建议人工核验。AI建议仅供参考。", advisoryOnly: true, humanOverride: null }, permission: { decisionId: "PERM-SEED-AI-001", status: "ALLOW", fieldMode: "masked", nineDimensionSnapshot: { role: "ALLOW", organization: "ALLOW", dataScope: "ALLOW", time: "ALLOW", geography: "ALLOW", workflow: "ALLOW", aiRisk: "ALLOW", sensitivity: "ALLOW", operation: "ALLOW" } }, createdAt: "2026-08-01T11:40:00+08:00" },
  { taskId: "audit-task-2026-01", actorId: "demo-finance", actorRole: "FINANCE", action: "data:export", outcome: "denied", evidenceSummary: "导出字段包含超出财务岗位范围的家庭敏感字段，数据权限层拒绝请求。", resource: { type: "application_export", id: "export-request-001", campusId: "campus-main", sensitivity: "P4" }, permission: { decisionId: "PERM-SEED-EXPORT-001", status: "DENY", deniedBy: ["sensitivity", "operation"], fieldMode: "hidden", nineDimensionSnapshot: { role: "ALLOW", organization: "ALLOW", dataScope: "ALLOW", sensitivity: "DENY", operation: "DENY" } }, errorCode: "SENSITIVE_DENIED", affectedRows: 0, createdAt: "2026-08-02T08:20:00+08:00" },
  { taskId: "auth-session-20260802", actorId: "demo-sys-admin", actorRole: "SYS_ADMIN", action: "auth:login", operationType: "LOGIN", category: "AUTH", outcome: "success", evidenceSummary: "系统管理员通过MFA登录，设备指纹与地理位置校验通过。", resource: { type: "session", id: "SESS-ADMIN-001", campusId: "campus-main", sensitivity: "P1" }, context: { geographicLevel: "L1", sessionId: "SESS-ADMIN-001", clientIp: "10.10.0.12", deviceFingerprint: "DEV-ADMIN-001" }, createdAt: "2026-08-02T08:35:00+08:00" },
  { taskId: "permission-change-20260802", actorId: "demo-sys-admin", actorRole: "SYS_ADMIN", action: "permission:role_scope_update", category: "PERMISSION", outcome: "success", evidenceSummary: "调整外部审计员任务范围；变更前后值及审批单已冻结。", resource: { type: "role_assignment", id: "demo-audit-external", campusId: "campus-main", sensitivity: "P3" }, before: { assignedTaskIds: ["audit-task-2025-09"] }, after: { assignedTaskIds: ["audit-task-2025-09", "audit-task-2026-01"] }, evidenceRefs: ["approval-RBAC-20260802-01"], createdAt: "2026-08-02T09:10:00+08:00" },
  { taskId: "model-config-20260802", actorId: "demo-ai-ops", actorRole: "AI_OPS", action: "model_config:update", category: "SYSTEM_CONFIG", outcome: "human_confirmed", evidenceSummary: "模型路由成本上限由审批人员确认后更新；密钥值未写入审计记录。", resource: { type: "model_route", id: "deepseek-chat-default", campusId: "campus-main", sensitivity: "P3" }, before: { dailyBudget: 500, secret: "[NEVER_STORED]" }, after: { dailyBudget: 650, secret: "[NEVER_STORED]" }, evidenceRefs: ["approval-AI-OPS-20260802-03"], createdAt: "2026-08-02T09:40:00+08:00" },
  { taskId: "security-event-20260802", actorId: "guardrail-agent", actorRole: "AI_OPS", actorType: "system", action: "security:prompt_injection_blocked", category: "SECURITY_EVENT", outcome: "denied", evidenceSummary: "安全护栏检测到提示词注入尝试并阻断；原始提示词未留存，仅保留摘要和摘要哈希。", resource: { type: "ai_request", id: "REQ-GUARD-20260802-11", campusId: "campus-main", sensitivity: "P4" }, operationDetails: { attackType: "indirect_prompt_injection", prompt: "[RAW_PROMPT_NOT_STORED]", ruleId: "GRD-INJECTION-004" }, ai: { agentCode: "guardrail-agent", agentName: "AI安全护栏", modelVersion: "guardrail-rules-2026.08", inputSummary: "用户尝试要求模型绕过权限读取敏感信息（已脱敏）", inputDigest: "sha256:security-seed-011", outputSummary: "请求已拒绝", outputDigest: "sha256:security-output-011", xaiSummary: "命中提示词注入确定性规则GRD-INJECTION-004。", advisoryOnly: false }, errorCode: "PROMPT_INJECTION_BLOCKED", affectedRows: 0, createdAt: "2026-08-02T10:05:00+08:00" },
];

function ensureInitialized(): AuditState {
  if (state.initialized) return state;
  state.records = [];
  if (existsSync(state.filePath)) {
    const content = readFileSync(state.filePath, "utf8");
    for (const line of content.split(/\r?\n/).filter(Boolean)) {
      try { state.records.push(JSON.parse(line) as AuditEvidenceRecord); } catch { /* integrity endpoint reports chain truncation through invalid persisted data outside this demo adapter */ }
    }
  }
  if (!state.records.length) {
    mkdirSync(dirname(state.filePath), { recursive: true });
    let previousHash = "GENESIS";
    state.records = seedInputs.map((input, index) => {
      const record = createRecord(input, index + 1, previousHash);
      previousHash = record.recordHash;
      return record;
    });
    writeFileSync(state.filePath, `${state.records.map(record => JSON.stringify(record)).join("\n")}\n`, { encoding: "utf8", flag: "wx" });
  }
  state.initialized = true;
  return state;
}

const auditLockFile = `${runtimeFile}.lock`;
const auditLockWait = new Int32Array(new SharedArrayBuffer(4));

function readPersistedRecords(): AuditEvidenceRecord[] {
  if (!existsSync(runtimeFile)) return [];
  return readFileSync(runtimeFile, "utf8").split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line) as AuditEvidenceRecord]; } catch { return []; }
  });
}

function withAuditFileLock<T>(work: () => T): T {
  mkdirSync(dirname(runtimeFile), { recursive: true });
  let handle: number | null = null;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try { handle = openSync(auditLockFile, "wx"); break; }
    catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
      try { if (Date.now() - statSync(auditLockFile).mtimeMs > 30_000) unlinkSync(auditLockFile); } catch { /* another writer released it */ }
      Atomics.wait(auditLockWait, 0, 0, 10);
    }
  }
  if (handle === null) throw new Error("AUDIT_APPEND_LOCK_TIMEOUT");
  try { return work(); }
  finally { closeSync(handle); try { unlinkSync(auditLockFile); } catch { /* lock already released */ } }
}

let activeAuditLease = false;
/** DEMO ONLY: reserve the append lock before a synchronous business Gate. */
export function withAuditAppendLease<T>(work: () => T): T {
  if (activeAuditLease) throw new Error("AUDIT_LEASE_REENTRANT");
  return withAuditFileLock(() => {
    const current = ensureInitialized();
    // A malformed/truncated line must not be silently omitted from a release gate.
    const lines = readFileSync(current.filePath, "utf8").split(/\r?\n/).filter(Boolean);
    let records: AuditEvidenceRecord[];
    try { records = lines.map(line => JSON.parse(line) as AuditEvidenceRecord); }
    catch { throw new Error("AUDIT_CHAIN_CORRUPTED"); }
    current.records = records;
    if (!verifyAuditChain().valid) throw new Error("AUDIT_CHAIN_CORRUPTED");
    activeAuditLease = true;
    try { return work(); }
    finally { activeAuditLease = false; }
  });
}
function appendAuditEvidenceUnlocked(input: AuditEvidenceInput): AuditEvidenceRecord {
    const current = ensureInitialized();
    const persisted = readPersistedRecords();
    if (persisted.length) current.records = persisted;
    const previousHash = current.records.at(-1)?.recordHash ?? "GENESIS";
    const nextSequence = Math.max(0, ...current.records.map(item => item.sequence)) + 1;
    const record = createRecord(input, nextSequence, previousHash);
    appendFileSync(current.filePath, `${JSON.stringify(record)}\n`, { encoding: "utf8", flag: "a" });
    current.records.push(record);
    return structuredClone(record);
}
export function appendAuditEvidence(input: AuditEvidenceInput): AuditEvidenceRecord {
  return activeAuditLease ? appendAuditEvidenceUnlocked(input) : withAuditFileLock(() => appendAuditEvidenceUnlocked(input));
}

function canReadRecord(actor: ActorContext, record: AuditEvidenceRecord): boolean {
  if (!actor.authenticated) return false;
  if (["SYS_ADMIN", "EDU_BUREAU", "DISCIPLINE", "DATA_ADMIN"].includes(actor.role)) return !record.context.campusId || actor.campusIds.includes(record.context.campusId);
  if (actor.role === "AI_OPS") return ["AI_OPERATION", "SYSTEM_CONFIG", "SECURITY_EVENT", "AI_WITHDRAW"].includes(record.operation.category);
  if (actor.role === "AUDITOR") return Boolean(actor.assignedTaskIds?.includes(record.taskId) || record.operation.category === "AI_OPERATION" || record.operation.category === "SECURITY_EVENT");
  if (actor.role === "AUDIT_EXTERNAL") return actor.assignedTaskIds?.includes(record.taskId) ?? false;
  return record.actor.id === actor.userId;
}

export function canAccessAuditCenter(actor: ActorContext): boolean {
  return ["SYS_ADMIN", "AI_OPS", "EDU_BUREAU", "AUDITOR", "AUDIT_EXTERNAL", "DISCIPLINE", "DATA_ADMIN"].includes(actor.role);
}

export function listAuditEvidence(actor: ActorContext, filter: AuditEvidenceFilter = {}): { items: AuditEvidenceRecord[]; total: number; page: number; pageSize: number } {
  const current = ensureInitialized();
  const keyword = filter.keyword?.trim().toLocaleLowerCase();
  const matched = current.records.filter(record => canReadRecord(actor, record))
    .filter(record => !filter.category || record.operation.category === filter.category)
    .filter(record => !filter.level || record.operation.level === filter.level)
    .filter(record => !filter.outcome || record.result.status === filter.outcome)
    .filter(record => !filter.actorId || record.actor.id === filter.actorId)
    .filter(record => !filter.actorRole || record.actor.role === filter.actorRole)
    .filter(record => !filter.agentCode || record.evidence.ai?.agentCode === filter.agentCode)
    .filter(record => !filter.taskId || record.taskId === filter.taskId)
    .filter(record => !filter.sensitivity || (filter.sensitivity === "HIGH" ? ["P4", "P5"].includes(record.context.dataSensitivity) : record.context.dataSensitivity === filter.sensitivity))
    .filter(record => !keyword || `${record.id} ${record.taskId} ${record.actor.id} ${record.actor.role} ${record.operation.action} ${record.operation.targetId ?? ""} ${record.evidence.summary}`.toLocaleLowerCase().includes(keyword))
    .sort((left, right) => right.sequence - left.sequence);
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  return { items: structuredClone(matched.slice(offset, offset + pageSize)), total: matched.length, page, pageSize };
}

export function getAuditEvidence(actor: ActorContext, id: string): AuditEvidenceRecord | null {
  const record = ensureInitialized().records.find(item => item.id === id);
  return record && canReadRecord(actor, record) ? structuredClone(record) : null;
}

export interface AuditTaskEvidenceSummary {
  id: string;
  sequence: number;
  taskId: string;
  timestamp: string;
  actorId: string;
  actorRole: RoleCode;
  actorType: "human" | "agent" | "system";
  action: string;
  category: AuditCategory;
  level: AuditLevel;
  targetId?: string;
  outcome: AuditOutcome;
  affectedRows: number;
  recordHash: string;
  previousHash: string;
}

/** 最小化任务证据索引：不返回业务摘要、输入输出、P3/P4字段或原始快照。 */
export function listAuditTaskEvidenceIndex(taskId: string): AuditTaskEvidenceSummary[] {
  const normalized = taskId.trim();
  if (!normalized) return [];
  return ensureInitialized().records
    .filter(record => record.taskId === normalized)
    .sort((left, right) => left.sequence - right.sequence)
    .map(record => ({ id: record.id, sequence: record.sequence, taskId: record.taskId, timestamp: record.timestamp, actorId: record.actor.id, actorRole: record.actor.role, actorType: record.actor.type, action: record.operation.action, category: record.operation.category, level: record.operation.level, targetId: record.operation.targetId, outcome: record.result.status, affectedRows: record.result.affectedRows, recordHash: record.recordHash, previousHash: record.previousHash }));
}

export function verifyAuditChain(): AuditChainVerification {
  const records = ensureInitialized().records;
  let previousHash = "GENESIS";
  for (const record of records) {
    const { recordHash, ...withoutHash } = record;
    if (record.previousHash !== previousHash || hashPayload(withoutHash) !== recordHash) {
      return { valid: false, total: records.length, verifiedAt: new Date().toISOString(), genesisHash: records[0]?.recordHash ?? null, headHash: records.at(-1)?.recordHash ?? null, brokenAt: record.id, storage: "append-only-jsonl", algorithm: "SHA-256" };
    }
    previousHash = recordHash;
  }
  return { valid: true, total: records.length, verifiedAt: new Date().toISOString(), genesisHash: records[0]?.recordHash ?? null, headHash: records.at(-1)?.recordHash ?? null, storage: "append-only-jsonl", algorithm: "SHA-256" };
}


export interface AuditTaskChainVerification extends AuditChainVerification {
  taskId: string;
  checkpointSequence: number | null;
  globalChainValid: boolean;
  globalBrokenAt?: string;
  missingActions?: string[];
}

/** 验证指定任务在写入时形成的原始链路检查点；后续其他任务发生的链路事故不会倒推否定此前已冻结的有效证据。 */
export function verifyAuditTaskChain(taskId: string, requiredActions: readonly string[] = []): AuditTaskChainVerification {
  const records = ensureInitialized().records;
  const normalized = taskId.trim();
  const indexes = records.map((record, index) => ({ record, index })).filter(item => item.record.taskId === normalized);
  const global = verifyAuditChain();
  for (const { record, index } of indexes) {
    const { recordHash, ...withoutHash } = record;
    const expectedPrevious = index === 0 ? "GENESIS" : records[index - 1]?.recordHash ?? "GENESIS";
    if (record.previousHash !== expectedPrevious || hashPayload(withoutHash) !== recordHash) {
      return { valid: false, total: indexes.length, verifiedAt: new Date().toISOString(), genesisHash: indexes[0]?.record.recordHash ?? null, headHash: indexes.at(-1)?.record.recordHash ?? null, brokenAt: record.id, storage: "append-only-jsonl", algorithm: "SHA-256", taskId: normalized, checkpointSequence: indexes.at(-1)?.record.sequence ?? null, globalChainValid: global.valid, globalBrokenAt: global.brokenAt };
    }
  }
  const observed = new Set(indexes.map(item => item.record.operation.action));
  const missingActions = [...new Set(requiredActions)].filter(action => !observed.has(action));
  return { valid: indexes.length > 0 && missingActions.length === 0, total: indexes.length, verifiedAt: new Date().toISOString(), genesisHash: indexes[0]?.record.recordHash ?? null, headHash: indexes.at(-1)?.record.recordHash ?? null, storage: "append-only-jsonl", algorithm: "SHA-256", taskId: normalized, checkpointSequence: indexes.at(-1)?.record.sequence ?? null, globalChainValid: global.valid, globalBrokenAt: global.brokenAt, ...(missingActions.length ? { missingActions } : {}) };
}

export function auditEvidenceOverview(actor: ActorContext) {
  const visible = listAuditEvidence(actor, { pageSize: 100 }).items;
  const chain = verifyAuditChain();
  const count = (predicate: (record: AuditEvidenceRecord) => boolean) => visible.filter(predicate).length;
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: visible.length,
      success: count(record => ["SUCCESS", "HUMAN_CONFIRMED"].includes(record.result.status)),
      denied: count(record => record.result.status === "DENIED"),
      ai: count(record => record.operation.category === "AI_OPERATION" || Boolean(record.evidence.ai)),
      security: count(record => ["SECURITY", "CRITICAL"].includes(record.operation.level)),
      p4p5: count(record => ["P4", "P5"].includes(record.context.dataSensitivity)),
    },
    categories: AUDIT_CATEGORIES.map(category => ({ category, count: count(record => record.operation.category === category) })),
    levels: AUDIT_LEVELS.map(level => ({ level, count: count(record => record.operation.level === level) })),
    recent: visible.slice(0, 8),
    chain,
    compliance: {
      coverage: "人类与AI操作统一入链",
      p4Evidence: "摘要、来源、工具轨迹、模型版本、XAI；禁止原始Prompt/Response",
      updateDelete: "运行时无更新/删除接口，物理文件仅追加",
      retention: "P0-P3 3年 / P4 10年 / P5与AI撤回50年",
    },
  };
}

export function auditStorageStatus() {
  const current = ensureInitialized();
  return { mode: "append-only-jsonl" as const, file: current.filePath, records: current.records.length, integrity: verifyAuditChain() };
}


