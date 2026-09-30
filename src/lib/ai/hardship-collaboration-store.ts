import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { completeWithDeepSeek, isModelConfigured } from "./model-gateway";
import { getHardshipAssetManifest, recordHardshipAssetExecution, type HardshipAssetManifestItem } from "./studio-store";
import type { ActorContext, AiRiskLevel } from "@/lib/platform/authorization";
import { DEMO_IDENTITIES, toActorContext } from "@/lib/platform/demo-identities";
import { defaultRuntime, evaluateNineDimensionPermission, type NineDimensionDecision } from "@/lib/platform/nine-dimension-engine";
import { ROLE_GOVERNANCE_POLICIES } from "@/lib/platform/role-context";
import { ROLE_PROFILES, type RoleCode } from "@/lib/platform/roles";
import { listDemoAssignedBankBatchIds, writeAuditSnapshot } from "@/lib/platform/demo-store";
import { ensureHardshipVideoBusinessRevision, executeHardshipVideoBusinessStage, getHardshipVideoBusinessObjects, resetHardshipVideoBusiness, type HardshipVideoStageId } from "@/lib/platform/hardship-video-business-store";
import { getHardshipVideoDisbursementStatus } from "@/lib/platform/hardship-video-disbursement-store";
import { withDemoVideoGateRollback } from "./demo-video-gate-rollback";

export const VIDEO_HARDSHIP_SCENARIO_ID = "VIDEO-HARDSHIP-2026-001" as const;
export type CollaborationRunStatus = "ready" | "running" | "paused" | "awaiting_human" | "completed" | "failed";
export type CollaborationStageStatus = "pending" | "working" | "awaiting_human" | "completed" | "failed";
export type CollaborationMessageType = "command" | "plan" | "assignment" | "progress" | "gate" | "handoff" | "result" | "security";
export type CollaborationTraceKind = "WORKFLOW" | "MODEL" | "RAG" | "SKILL" | "PLUGIN" | "MCP" | "PERMISSION" | "AUDIT";

export interface CollaborationStage {
  id: string; sequence: number; phase: string; title: string; roleCode: RoleCode; roleName: string;
  agentCode: string; agentName: string; status: CollaborationStageStatus; humanGate: boolean; requiredRole?: RoleCode;
  toolName: string; riskLevel: AiRiskLevel; assetIds: string[]; businessRoute: string; businessState: string;
  actionSummary: string; expectedResult: string; result?: string;
  permission?: Pick<NineDimensionDecision, "status" | "allowed" | "code" | "fieldMode" | "dimensions" | "formula" | "evaluatedAt">;
  evidenceId?: string; startedAt?: string; completedAt?: string; durationMs?: number;
  confirmedBy?: { actorId: string; role: RoleCode; comment: string; confirmedAt: string; transactionId?: string }; attempts: number;
}
export interface CollaborationMessage {
  id: string; sequence: number; senderType: "dolphin" | "agent" | "human" | "system"; senderCode: string;
  senderName: string; senderRole?: RoleCode; avatar: string; type: CollaborationMessageType; content: string;
  stageId?: string; evidenceRefs: string[]; createdAt: string;
}
export interface CollaborationTrace {
  id: string; stageId?: string; kind: CollaborationTraceKind; name: string; version: string;
  status: "success" | "blocked" | "waiting"; latencyMs: number; detail: string; evidenceId?: string; createdAt: string;
}
export interface VideoScenarioContext {
  id: typeof VIDEO_HARDSHIP_SCENARIO_ID; revision: number; mode: "video"; dataMode: "simulated";
  implementationStage: "V3-0" | "V3-1" | "V3-2" | "V3-3" | "V3-4";
  implementedThroughStage: number; syncStatus: "ready" | "running" | "awaiting_business_adapter" | "completed";
  isActive: boolean; resetAt?: string; resetBy?: string; resetReason?: string; archivedAt?: string;
}
export interface CollaborationBusinessObject {
  type: string; id: string; label: string; status: string; route: string; sensitivity: string;
  syncStatus?: "pending" | "synced" | "blocked";
}
export interface CollaborationRun {
  id: string; runNo: string; workflowId: "workflow-temporary-hardship-grant"; workflowVersion: number; title: string;
  command: string; status: CollaborationRunStatus; currentStageIndex: number; stages: CollaborationStage[];
  messages: CollaborationMessage[]; traces: CollaborationTrace[];
  planning: { source: "deepseek" | "deterministic-fallback"; model: string; summary: string; tokenUsage: number; latencyMs: number };
  businessObjects: CollaborationBusinessObject[]; scenario?: VideoScenarioContext;
  createdBy: string; createdByRole: RoleCode; createdAt: string; updatedAt: string; finishedAt?: string; version: number;
  processedKeys: string[];
  summary?: { result: string; elapsedMs: number; completedStages: number; evidenceCount: number; modelCalls: number; skillCalls: number; mcpCalls: number };
}
export interface CollaborationSnapshot {
  mode: "persistent-workflow-runtime" | "persistent-video-scenario-runtime";
  scenario?: VideoScenarioContext & { activeRunId: string; resetCount: number; stateHash: string };
  template: { id: string; name: string; version: number; installed: boolean; nodeCount: number; humanGates: number; riskLevel: string };
  assets: HardshipAssetManifestItem[];
  runs: Array<{ id: string; runNo: string; title: string; status: CollaborationRunStatus; progress: number; currentStage: string; createdAt: string; updatedAt: string; scenarioId?: string; revision?: number }>;
  selectedRun: CollaborationRun;
  viewer: { role: RoleCode; roleName: string; canCreate: boolean; canStart: boolean; canReset: boolean; canControl: boolean; canConfirmCurrentGate: boolean };
  safeguards: string[];
}
interface VideoScenarioRegistry { id: typeof VIDEO_HARDSHIP_SCENARIO_ID; activeRunId: string; resetCount: number; updatedAt: string }
interface OperationReceipt { scope: string; action: "reset_scenario"; runId: string; createdAt: string }
interface PersistentState { schemaVersion: 2; runs: CollaborationRun[]; videoScenario: VideoScenarioRegistry; operationReceipts: OperationReceipt[] }
interface OperationResult { success: boolean; code: string; message: string; data?: CollaborationRun }
type GlobalState = typeof globalThis & { __jhxtHardshipCollaboration?: PersistentState };
const globalState = globalThis as GlobalState;
const stateFile = join(process.cwd(), ".runtime", "hardship-collaboration-runs.json");
const fixedSeedTime = "2026-08-04T09:00:00+08:00";

const DEFINITIONS: ReadonlyArray<Omit<CollaborationStage, "status" | "roleName" | "agentName" | "attempts">> = [
  { id: "notice", sequence: 1, phase: "项目启动", title: "发布临时困难补助通知", roleCode: "FUND_ADMIN", agentCode: "fund_admin-agent-2", humanGate: true, requiredRole: "FUND_ADMIN", toolName: "notice.draft", riskLevel: "L2", assetIds: ["policy-rag-emergency-aid"], businessRoute: "/funding/management", businessState: "待通知发布", actionSummary: "检索政策依据，生成受众范围、办理时限与材料清单草案。", expectedResult: "通知经资助中心人工确认后定向发布。" },
  { id: "apply", sequence: 2, phase: "学生申请", title: "学生在线申请与材料提交", roleCode: "STUDENT", agentCode: "student-agent-2", humanGate: true, requiredRole: "STUDENT", toolName: "application.submit", riskLevel: "L1", assetIds: ["studio-plugin-parser"], businessRoute: "/application/create", businessState: "待学生提交", actionSummary: "申请助手引导填报，解析插件完成OCR、版面分析、实体抽取和文件哈希。", expectedResult: "学生确认结构化信息与授权范围后提交申请。" },
  { id: "precheck", sequence: 3, phase: "智能受理", title: "规则校验与AI预审", roleCode: "FUND_ADMIN", agentCode: "fund_admin-agent-4", humanGate: false, toolName: "material.precheck", riskLevel: "L2", assetIds: ["studio-skill-material-precheck"], businessRoute: "/application/intake", businessState: "规则预检中", actionSummary: "确定性资格规则先校验，模型仅生成缺项、矛盾与低置信度提示。", expectedResult: "形成带引用的预检报告，异常进入人工受理。" },
  { id: "counselor", sequence: 4, phase: "班级初审", title: "辅导员初审与关怀核实", roleCode: "COUNSELOR", agentCode: "counselor-agent-2", humanGate: true, requiredRole: "COUNSELOR", toolName: "review.counselor", riskLevel: "L2", assetIds: ["studio-skill-material-precheck"], businessRoute: "/frontline-center?view=tasks", businessState: "待辅导员初审", actionSummary: "整理证据、定位矛盾项并生成谈话核实清单，不代替初审决定。", expectedResult: "辅导员结合事实完成人工初审并签名。" },
  { id: "department", sequence: 5, phase: "院系汇总", title: "院系复核与批量上报", roleCode: "DEPT_ADMIN", agentCode: "dept_admin-agent-2", humanGate: true, requiredRole: "DEPT_ADMIN", toolName: "review.department", riskLevel: "L2", assetIds: ["workflow-temporary-hardship-grant"], businessRoute: "/frontline-center?view=quotas", businessState: "待院系复核", actionSummary: "检查重复申请、异常记录与院系名额边界，生成汇总表草案。", expectedResult: "院系管理员复核异常后形成校级上报批次。" },
  { id: "school", sequence: 6, phase: "校级审核", title: "资助中心校级复审", roleCode: "FUND_ADMIN", agentCode: "fund_admin-agent-1", humanGate: true, requiredRole: "FUND_ADMIN", toolName: "review.school", riskLevel: "L3", assetIds: ["workflow-temporary-hardship-grant"], businessRoute: "/application/all?view=pending", businessState: "待校级复审", actionSummary: "执行业务一致性、政策合规和跨院系标准检查，生成送审摘要。", expectedResult: "资助中心确认建议并提交校领导审批。" },
  { id: "leader", sequence: 7, phase: "领导审批", title: "校领导审批关键风险", roleCode: "SCHOOL_LEADER", agentCode: "school_leader-agent-2", humanGate: true, requiredRole: "SCHOOL_LEADER", toolName: "decision.brief", riskLevel: "L4", assetIds: ["workflow-temporary-hardship-grant"], businessRoute: "/decision-center?view=exceptions", businessState: "待领导审批", actionSummary: "生成一页式决策摘要、预算影响和例外事项解释，只提供建议。", expectedResult: "校领导完成不可替代的人工审批。" },
  { id: "finance", sequence: 8, phase: "财务执行", title: "生成发放批次并双人复核", roleCode: "FINANCE", agentCode: "finance-agent-1", humanGate: true, requiredRole: "FINANCE", toolName: "grant.prepare", riskLevel: "L3", assetIds: ["workflow-temporary-hardship-grant"], businessRoute: "/finance?view=batches", businessState: "待财务双签", actionSummary: "校验预算占用、账户脱敏信息、重复发放、总额与笔数平衡。", expectedResult: "经办与复核双人确认后生成银行任务。" },
  { id: "bank", sequence: 9, phase: "银行发放", title: "银行MCP发放与回盘", roleCode: "BANK", agentCode: "bank-agent-2", humanGate: true, requiredRole: "BANK", toolName: "grant.batch.submit", riskLevel: "L3", assetIds: ["studio-mcp-bank-grant"], businessRoute: "/bank-cooperation/reconciliation", businessState: "待银行授权", actionSummary: "通过MCP允许列表提交最小必要字段，查询任务状态并拉取银行回盘。", expectedResult: "银行人员授权后返回可验证回盘。" },
  { id: "reconcile", sequence: 10, phase: "银校闭环", title: "对账、到账通知与审计归档", roleCode: "FINANCE", agentCode: "finance-agent-3", humanGate: false, toolName: "grant.reconcile", riskLevel: "L2", assetIds: ["studio-skill-grant-reconciliation"], businessRoute: "/finance?view=reconciliation", businessState: "自动对账中", actionSummary: "核对金额、笔数、失败项与幂等键，形成到账通知和全链路归档。", expectedResult: "对账平衡，学生收到到账通知，证据链完整。" },
];
const FALLBACK_PLAN = "已拆解为通知、申请、受理、三级审核、领导审批、财务、银行与对账10个受控节点；8个人工闸门不可由Agent绕过。";

function now() { return new Date().toISOString(); }
function digest(value: string) { return createHash("sha256").update(value).digest("hex").slice(0, 16); }
function clone<T>(value: T): T { return structuredClone(value); }
function roleActor(role: RoleCode): ActorContext {
  const identity = DEMO_IDENTITIES.find(item => item.role === role);
  if (!identity) throw new Error(`DEMO_ROLE_IDENTITY_MISSING:${role}`);
  const actor = toActorContext(identity);
  return role === 'BANK' ? { ...actor, assignedTaskIds: listDemoAssignedBankBatchIds(actor.userId) } : actor;
}
function roleAgent(role: RoleCode, code: string) {
  const agent = ROLE_GOVERNANCE_POLICIES[role].agentTeam.find(item => item.code === code);
  if (!agent) throw new Error(`ROLE_AGENT_MISSING:${code}`);
  return agent;
}
function stageDefinitions(): CollaborationStage[] {
  return DEFINITIONS.map(definition => ({ ...definition, roleName: ROLE_PROFILES[definition.roleCode].name, agentName: roleAgent(definition.roleCode, definition.agentCode).name, status: "pending", attempts: 0 }));
}
function message(run: CollaborationRun, input: Omit<CollaborationMessage, "id" | "sequence" | "createdAt" | "evidenceRefs"> & { evidenceRefs?: string[] }) {
  run.messages.push({ ...input, id: `MSG-${randomUUID()}`, sequence: run.messages.length + 1, evidenceRefs: input.evidenceRefs ?? [], createdAt: now() });
}
function trace(run: CollaborationRun, input: Omit<CollaborationTrace, "id" | "createdAt">) {
  run.traces.push({ ...input, id: `TRACE-${randomUUID()}`, createdAt: now() });
}
function assetKind(assetId: string): CollaborationTraceKind {
  if (assetId.startsWith("policy-rag")) return "RAG";
  const asset = getHardshipAssetManifest().find(item => item.id === assetId);
  if (asset?.kind === "skill") return "SKILL";
  if (asset?.kind === "mcp") return "MCP";
  if (asset?.kind === "plugin") return "PLUGIN";
  return "WORKFLOW";
}
function assetVersion(assetId: string) {
  if (assetId.startsWith("policy-rag")) return "policy-kb-2026.08";
  return `v${getHardshipAssetManifest().find(item => item.id === assetId)?.version ?? 1}`;
}
function runProgress(run: CollaborationRun) { return Math.round(run.stages.filter(stage => stage.status === "completed").length / run.stages.length * 100); }
function currentStage(run: CollaborationRun) { return run.stages.find(stage => stage.status !== "completed") ?? run.stages.at(-1)!; }
function persist(state: PersistentState) {
  mkdirSync(dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(state, null, 2), { encoding: "utf8", mode: 0o600, flag: "wx" });
  try { renameSync(temporary, stateFile); } catch (error) { unlinkSync(temporary); throw error; }
}
function businessObjects() {
  return [
    { type: "policy", id: "policy-emergency-aid-2026", label: "学生临时困难补助管理办法", status: "已引用", route: "/funding/management", sensitivity: "P0" },
    { type: "project", id: "project-emergency-2026", label: "2026秋季临时困难补助", status: "模拟运行", route: "/funding/management", sensitivity: "P1" },
    { type: "application", id: "app-2026-003", label: "临时困难补助申请（赵*）", status: "流程关联", route: "/application/detail?id=app-2026-003", sensitivity: "P3·已脱敏" },
    { type: "grant_batch", id: "batch-002", label: "JF202608-002 临时困难补助", status: "已校验", route: "/finance?view=batches", sensitivity: "P3·最小字段" },
  ];
}
function videoBusinessObjects(revision: number): CollaborationBusinessObject[] { ensureHardshipVideoBusinessRevision(revision); return getHardshipVideoBusinessObjects(revision); }
function createReadyVideoRun(revision: number, reset?: { actorId: string; actorRole: RoleCode; reason: string; at: string }): CollaborationRun {
  const time = reset?.at ?? now();
  const run: CollaborationRun = {
    id: `HGR-VIDEO-${String(revision).padStart(3, "0")}-${randomUUID().slice(0, 8)}`,
    runNo: `VIDEO-HGR-${String(revision).padStart(3, "0")}`,
    workflowId: "workflow-temporary-hardship-grant", workflowVersion: 6,
    title: "临时困难补助视频场景", command: "小海豚，请执行临时困难补助全链路协同演示。",
    status: "ready", currentStageIndex: 0, stages: stageDefinitions(), messages: [], traces: [],
    planning: { source: "deterministic-fallback", model: "pending", summary: "场景已就绪，等待资助中心下达启动指令。", tokenUsage: 0, latencyMs: 0 },
    businessObjects: videoBusinessObjects(revision),
    scenario: { id: VIDEO_HARDSHIP_SCENARIO_ID, revision, mode: "video", dataMode: "simulated", implementationStage: "V3-4", implementedThroughStage: 10, syncStatus: "ready", isActive: true, ...(reset ? { resetAt: reset.at, resetBy: reset.actorId, resetReason: reset.reason } : {}) },
    createdBy: reset?.actorId ?? "demo-fund-admin", createdByRole: reset?.actorRole ?? "FUND_ADMIN", createdAt: time, updatedAt: time, version: 1, processedKeys: [],
  };
  message(run, { senderType: "system", senderCode: "scenario-controller", senderName: "视频场景控制器", avatar: "控", type: "security", content: `固定场景 ${VIDEO_HARDSHIP_SCENARIO_ID} · 修订 ${revision} 已就绪。当前未产生申请、待办、资金或银行写入。` });
  trace(run, { kind: "WORKFLOW", name: "临时困难补助视频场景", version: "v6", status: "waiting", latencyMs: 0, detail: "10节点DAG与8个人工闸门已加载；等待人工启动。" });
  return run;
}
function seedCompletedRun(): CollaborationRun {
  const stages = stageDefinitions().map((stage, index) => ({
    ...stage, status: "completed" as const, result: stage.expectedResult,
    startedAt: new Date(new Date(fixedSeedTime).getTime() + index * 90000).toISOString(),
    completedAt: new Date(new Date(fixedSeedTime).getTime() + index * 90000 + 42000).toISOString(),
    durationMs: 420 + index * 37, attempts: 1,
    ...(stage.humanGate && stage.requiredRole ? { confirmedBy: { actorId: DEMO_IDENTITIES.find(item => item.role === stage.requiredRole)?.id ?? "demo-human", role: stage.requiredRole, comment: "已核对模拟业务对象、权限范围与证据摘要，同意进入下一节点。", confirmedAt: new Date(new Date(fixedSeedTime).getTime() + index * 90000 + 40000).toISOString() } } : {}),
  }));
  const run: CollaborationRun = {
    id: "HGR-DEMO-COMPLETED", runNo: "HGR-20260804-001", workflowId: "workflow-temporary-hardship-grant", workflowVersion: 5,
    title: "临时困难补助全链路协同（已完成样例）", command: "小海豚，请协调各岗位完成一笔临时困难补助，从通知到银行到账并归档。",
    status: "completed", currentStageIndex: 10, stages, messages: [], traces: [],
    planning: { source: "deepseek", model: "deepseek-chat", summary: FALLBACK_PLAN, tokenUsage: 486, latencyMs: 2380 },
    businessObjects: businessObjects(), createdBy: "demo-fund-admin", createdByRole: "FUND_ADMIN", createdAt: fixedSeedTime,
    updatedAt: "2026-08-04T09:18:00+08:00", finishedAt: "2026-08-04T09:18:00+08:00", version: 12, processedKeys: [],
    summary: { result: "10个节点全部完成；模拟补助2000元已回盘并对账平衡。", elapsedMs: 1080000, completedStages: 10, evidenceCount: 28, modelCalls: 2, skillCalls: 5, mcpCalls: 3 },
  };
  message(run, { senderType: "human", senderCode: "demo-fund-admin", senderName: "孙管理员", senderRole: "FUND_ADMIN", avatar: "人", type: "command", content: run.command });
  message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "plan", content: `任务已受理。${FALLBACK_PLAN}` });
  for (const stage of stages) {
    message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "assignment", stageId: stage.id, content: `任务 ${String(stage.sequence).padStart(2, "0")} 已分派给${stage.agentName}：${stage.actionSummary}` });
    message(run, { senderType: "agent", senderCode: stage.agentCode, senderName: stage.agentName, senderRole: stage.roleCode, avatar: "AG", type: "result", stageId: stage.id, content: `${stage.result} 已向小海豚汇报并携带审计证据。`, evidenceRefs: [`AUD-SEED-${stage.sequence}`, ...stage.assetIds] });
    if (stage.confirmedBy) message(run, { senderType: "human", senderCode: stage.confirmedBy.actorId, senderName: ROLE_PROFILES[stage.confirmedBy.role].name, senderRole: stage.confirmedBy.role, avatar: "人", type: "gate", stageId: stage.id, content: `人工闸门已确认：${stage.confirmedBy.comment}` });
    for (const assetId of stage.assetIds) trace(run, { stageId: stage.id, kind: assetKind(assetId), name: assetId, version: assetVersion(assetId), status: "success", latencyMs: 36 + stage.sequence * 11, detail: "已安装资产在允许列表与版本锁定条件下执行。" });
    trace(run, { stageId: stage.id, kind: "PERMISSION", name: "九维权限交集", version: "policy-v2", status: "success", latencyMs: 12, detail: "9/9维通过；字段按岗位最小披露。" });
    trace(run, { stageId: stage.id, kind: "AUDIT", name: "SHA-256审计证据链", version: "audit-evidence/v2", status: "success", latencyMs: 8, detail: `证据 AUD-SEED-${stage.sequence} 已追加且链完整。`, evidenceId: `AUD-SEED-${stage.sequence}` });
  }
  message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "result", content: "全部子任务已完成：补助已到账、对账平衡、学生已收到通知，28份证据已进入不可抵赖审计链。" });
  return run;
}
function normalizeState(input: unknown): PersistentState {
  const raw = input && typeof input === "object" ? input as Partial<PersistentState> & { runs?: CollaborationRun[] } : {};
  const runs = Array.isArray(raw.runs) ? raw.runs : [seedCompletedRun()];
  let videoScenario = raw.videoScenario;
  let changed = raw.schemaVersion !== 2 || !Array.isArray(raw.operationReceipts);
  if (!videoScenario || videoScenario.id !== VIDEO_HARDSHIP_SCENARIO_ID || !runs.some(run => run.id === videoScenario?.activeRunId && run.scenario?.id === VIDEO_HARDSHIP_SCENARIO_ID)) {
    const existing = runs.find(run => run.scenario?.id === VIDEO_HARDSHIP_SCENARIO_ID && run.scenario.isActive);
    const ready = existing ?? createReadyVideoRun(1);
    if (!existing) runs.unshift(ready);
    videoScenario = { id: VIDEO_HARDSHIP_SCENARIO_ID, activeRunId: ready.id, resetCount: Math.max(0, ready.scenario!.revision - 1), updatedAt: ready.updatedAt };
    changed = true;
  }
  for (const run of runs) if (run.scenario?.id === VIDEO_HARDSHIP_SCENARIO_ID) {
    run.scenario.isActive = run.id === videoScenario.activeRunId;
    if (run.scenario.isActive) { if (run.scenario.implementationStage !== "V3-4" || run.scenario.implementedThroughStage < 10) { run.scenario.implementationStage = "V3-4"; run.scenario.implementedThroughStage = 10; changed = true; } ensureHardshipVideoBusinessRevision(run.scenario.revision); run.businessObjects = getHardshipVideoBusinessObjects(run.scenario.revision); }
  }
  const state: PersistentState = { schemaVersion: 2, runs: runs.slice(0, 30), videoScenario, operationReceipts: Array.isArray(raw.operationReceipts) ? raw.operationReceipts.slice(-100) : [] };
  if (changed) persist(state);
  return state;
}
function loadState(): PersistentState {
  if (globalState.__jhxtHardshipCollaboration) {
    const normalized = normalizeState(globalState.__jhxtHardshipCollaboration);
    globalState.__jhxtHardshipCollaboration = normalized;
    return normalized;
  }
  let raw: unknown = null;
  if (existsSync(stateFile)) {
    try { raw = JSON.parse(readFileSync(stateFile, "utf8")) as unknown; }
    catch { throw new Error("COLLABORATION_STATE_CORRUPTED"); }
    if (!raw || typeof raw !== "object" || !Array.isArray((raw as PersistentState).runs)) throw new Error("COLLABORATION_STATE_CORRUPTED");
  }
  const state = normalizeState(raw);
  globalState.__jhxtHardshipCollaboration = state;
  return state;
}
function canCreate(actor: ActorContext) { return ["FUND_ADMIN", "AI_OPS", "SYS_ADMIN"].includes(actor.role); }
function trimRuns(state: PersistentState) { const active = state.runs.find(run => run.id === state.videoScenario.activeRunId); const others = state.runs.filter(run => run.id !== state.videoScenario.activeRunId); state.runs = active ? [active, ...others.slice(0, 29)] : others.slice(0, 30); }
function activeVideoRun(state = loadState()) { return state.runs.find(run => run.id === state.videoScenario.activeRunId && run.scenario?.id === VIDEO_HARDSHIP_SCENARIO_ID); }
function receiptScope(actor: ActorContext, key: string) { return `${actor.userId}:${key}`; }
function canControl(actor: ActorContext, run: CollaborationRun) { return run.scenario ? canCreate(actor) : actor.userId === run.createdBy || ["AI_OPS", "SYS_ADMIN"].includes(actor.role); }
function replay(run: CollaborationRun, key: string) { return run.processedKeys.includes(key); }
function markProcessed(run: CollaborationRun, key: string) { run.processedKeys.push(key); run.processedKeys = run.processedKeys.slice(-100); }
function denied(message: string): OperationResult { return { success: false, code: "ROLE_DENIED", message }; }
function locateRun(id: string) { return loadState().runs.find(run => run.id === id); }
function update(run: CollaborationRun) { run.version += 1; run.updatedAt = now(); persist(loadState()); }

function addAuditForStage(run: CollaborationRun, stage: CollaborationStage, permission: NineDimensionDecision, result: string, executed = true) {
  const skillId = stage.assetIds.find(id => id.includes("skill"));
  const evidence = writeAuditSnapshot({
    taskId: run.id, actorId: stage.agentCode, actorRole: stage.roleCode, actorType: "agent",
    action: `agent:hardship:${stage.id}`, outcome: executed ? "success" : "waiting_business_adapter", evidenceSummary: result,
    resource: { type: "hardship_workflow_stage", id: stage.id, campusId: "campus-main", departmentId: ["COUNSELOR", "DEPT_ADMIN"].includes(stage.roleCode) ? "dept-agri" : undefined, classId: stage.roleCode === "COUNSELOR" ? "class-agri-01" : undefined, assignedTaskId: stage.roleCode === "BANK" ? "grant-batch-2026-spring" : undefined, sensitivity: "P2", workflowState: stage.businessState },
    ai: { agentCode: stage.agentCode, agentName: stage.agentName, modelProvider: ["precheck", "leader"].includes(stage.id) ? "DeepSeek" : "deterministic-runtime", model: ["precheck", "leader"].includes(stage.id) ? "deepseek-chat" : "rules-engine", modelVersion: "2026.08", promptVersion: `${stage.id}-v1`, knowledgeVersion: "policy-kb-2026.08", skillVersion: skillId ? assetVersion(skillId) : undefined, workflowVersion: "temporary-hardship-v6", traceId: `TRACE-${stage.id}-${digest(result)}`, inputSummary: `临时困难补助${stage.phase}脱敏任务`, inputDigest: digest(`${stage.id}:input`), outputSummary: result, outputDigest: digest(result), retrievalSources: ["notice", "precheck"].includes(stage.id) ? ["POL-EMERGENCY-AID-2026", "MATERIAL-RULE-012"] : [], toolCalls: executed ? [{ tool: stage.toolName, argsType: "masked-business-reference", timestamp: now() }] : [], xaiSummary: "输出由已注册业务规则、授权证据与最小必要数据生成；AI不替代人工结论。", advisoryOnly: stage.humanGate, humanOverride: null },
    permission: { status: permission.status, deniedBy: permission.deniedBy, fieldMode: permission.fieldMode, nineDimensionSnapshot: Object.fromEntries(permission.dimensions.map(item => [item.code, item.status])) },
    context: { dataScope: ROLE_PROFILES[stage.roleCode].dataScope, geographicLevel: stage.roleCode === "FINANCE" ? "L1" : "L2", purpose: "临时困难补助多Agent协同" }, operationDetails: { runId: run.id, stageId: stage.id, stageSequence: stage.sequence, workflowId: run.workflowId, workflowVersion: run.workflowVersion }, evidenceRefs: [run.id, stage.id, ...stage.assetIds],
  });
  return evidence.id;
}
function evaluateAgentStage(stage: CollaborationStage) {
  const actor = roleActor(stage.roleCode);
  return evaluateNineDimensionPermission(actor, {
    permission: "assistant:use", operation: "READ",
    resource: { id: "app-2026-003", type: "hardship_workflow_task", campusId: "campus-main", departmentId: ["COUNSELOR", "DEPT_ADMIN"].includes(stage.roleCode) ? "dept-agri" : undefined, classId: stage.roleCode === "COUNSELOR" ? "class-agri-01" : undefined, ownerId: stage.roleCode === "STUDENT" ? actor.userId : undefined, assignedTaskId: stage.roleCode === "BANK" ? "grant-batch-2026-spring" : undefined, dataTags: ["PUBLIC"], academicYear: "2026-2027", sensitiveLevel: stage.roleCode === "SCHOOL_LEADER" ? "P1" : "P2" },
    runtime: defaultRuntime({ geographicLevel: stage.roleCode === "FINANCE" ? "L1" : "L2", purpose: "临时困难补助多Agent协同", confirmations: 1, approvedBy: ["workflow-system"] }),
    actorType: "agent", aiRiskLevel: stage.riskLevel === "L4" ? "L0" : stage.riskLevel,
    agent: { agentCode: stage.agentCode, toolName: stage.toolName, toolRegistered: true, allowedRoles: [stage.roleCode], registeredPermissions: ["assistant:use"], guardrailPassed: true },
  });
}

export async function startVideoScenario(actor: ActorContext, scenarioId: string, expectedVersion: number, command: string, key: string): Promise<OperationResult> {
  if (scenarioId !== VIDEO_HARDSHIP_SCENARIO_ID) return { success: false, code: "SCENARIO_NOT_FOUND", message: "视频场景不存在。" };
  if (!canCreate(actor)) return denied("只有资助中心、AI运维或系统管理员可启动视频场景。");
  if (command.trim().length < 10 || command.length > 500) return { success: false, code: "COMMAND_INVALID", message: "任务指令需为10—500字。" };
  const state = loadState(); const run = activeVideoRun(state);
  if (!run) return { success: false, code: "NOT_FOUND", message: "活动视频场景不存在。" };
  if (replay(run, key)) return { success: true, code: "IDEMPOTENT_REPLAY", message: "场景已启动，本次返回原实例。", data: clone(run) };
  if (run.version !== expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "场景已更新，请刷新后重试。", data: clone(run) };
  if (run.status !== "ready") return { success: false, code: "STATE_DENIED", message: "只有就绪状态的场景可以启动；如需重演请先复位。", data: clone(run) };
  const started = Date.now();
  let planning: CollaborationRun["planning"] = { source: "deterministic-fallback", model: "rules-orchestrator-v2", summary: FALLBACK_PLAN, tokenUsage: 0, latencyMs: 0 };
  if (isModelConfigured()) {
    try {
      const response = await completeWithDeepSeek([
        { role: "system", content: "你是冀慧学途的小海豚总调度Agent。仅基于模拟场景输出不超过120字的分工摘要；不得形成审批决定，不得要求敏感字段，不得跳过人工闸门。" },
        { role: "user", content: `${command.trim()}。固定流程：通知→学生申请→规则与AI预检→辅导员初审→院系汇总→校级复审→校领导审批→财务双签→银行MCP→对账归档。` },
      ], { temperature: 0, maxTokens: 180 });
      planning = { source: "deepseek", model: response.model, summary: response.content.slice(0, 240), tokenUsage: response.usage.totalTokens, latencyMs: Date.now() - started };
    } catch { planning.latencyMs = Date.now() - started; }
  }
  run.command = command.trim(); run.planning = planning; run.status = "running"; run.scenario!.syncStatus = "running"; run.messages = []; run.traces = [];
  message(run, { senderType: "human", senderCode: actor.userId, senderName: ROLE_PROFILES[actor.role].name, senderRole: actor.role, avatar: "人", type: "command", content: run.command });
  message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "plan", content: `任务已受理。${planning.summary}` });
  for (const stage of run.stages) message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "assignment", stageId: stage.id, content: `${String(stage.sequence).padStart(2, "0")}号子任务已分派给${stage.agentName}；人工责任岗位：${stage.requiredRole ? ROLE_PROFILES[stage.requiredRole].name : "系统自动节点"}。` });
  trace(run, { kind: "WORKFLOW", name: "临时困难补助视频场景", version: "v6", status: "success", latencyMs: 9, detail: "固定场景DAG加载完成，10个节点、8个人工闸门与真实性门禁生效。" });
  trace(run, { kind: "MODEL", name: planning.model, version: "gateway-route-2026.08", status: "success", latencyMs: planning.latencyMs, detail: planning.source === "deepseek" ? `模型完成受控任务分解，使用${planning.tokenUsage} tokens。` : "模型不可用，确定性编排器完成安全降级。" });
  recordHardshipAssetExecution("workflow-temporary-hardship-grant"); markProcessed(run, key); update(run);
  writeAuditSnapshot({ taskId: run.id, actorId: actor.userId, actorRole: actor.role, action: "video_scenario:start", outcome: "success", evidenceSummary: `启动固定视频场景 ${scenarioId} 修订${run.scenario!.revision}；模型来源${planning.source}；尚未产生业务写入。`, resource: { type: "video_scenario", id: scenarioId, campusId: "campus-main", sensitivity: "P1", workflowState: "running" }, before: { status: "ready" }, after: { status: "running", runId: run.id, revision: run.scenario!.revision }, operationDetails: { nodeCount: 10, humanGates: 8, model: planning.model }, context: { dataScope: "school", geographicLevel: "L2", purpose: "视频场景启动" } });
  return { success: true, code: "SCENARIO_STARTED", message: "固定视频场景已启动，小海豚已完成任务分解。", data: clone(run) };
}

export function resetVideoScenario(actor: ActorContext, scenarioId: string, expectedVersion: number, comment: string, key: string): OperationResult {
  if (scenarioId !== VIDEO_HARDSHIP_SCENARIO_ID) return { success: false, code: "SCENARIO_NOT_FOUND", message: "视频场景不存在。" };
  if (!canCreate(actor)) return denied("只有资助中心、AI运维或系统管理员可复位视频场景。");
  if (comment.trim().length < 6 || comment.length > 300) return { success: false, code: "COMMENT_INVALID", message: "复位依据需为6—300字。" };
  const state = loadState(); const scope = receiptScope(actor, key); const priorReceipt = state.operationReceipts.find(item => item.scope === scope && item.action === "reset_scenario");
  if (priorReceipt) { const replayed = locateRun(priorReceipt.runId); return replayed ? { success: true, code: "IDEMPOTENT_REPLAY", message: "该场景已复位，本次返回同一修订。", data: clone(replayed) } : { success: false, code: "NOT_FOUND", message: "复位回执对应实例不存在。" }; }
  const previous = activeVideoRun(state); if (!previous) return { success: false, code: "NOT_FOUND", message: "活动视频场景不存在。" };
  if (previous.version !== expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "场景已更新，请刷新后重试。", data: clone(previous) };
  const at = now(); previous.scenario!.isActive = false; previous.scenario!.archivedAt = at; previous.updatedAt = at;
  const revision = previous.scenario!.revision + 1; resetHardshipVideoBusiness(revision, actor.userId, at); const next = createReadyVideoRun(revision, { actorId: actor.userId, actorRole: actor.role, reason: comment.trim(), at });
  state.runs.unshift(next); state.videoScenario = { id: VIDEO_HARDSHIP_SCENARIO_ID, activeRunId: next.id, resetCount: state.videoScenario.resetCount + 1, updatedAt: at };
  state.operationReceipts.push({ scope, action: "reset_scenario", runId: next.id, createdAt: at }); state.operationReceipts = state.operationReceipts.slice(-100); trimRuns(state); persist(state);
  writeAuditSnapshot({ taskId: next.id, actorId: actor.userId, actorRole: actor.role, action: "video_scenario:reset", outcome: "human_confirmed", evidenceSummary: `固定视频场景复位为修订${revision}；旧实例只读归档；复位未改动其他模拟业务数据。`, resource: { type: "video_scenario", id: scenarioId, campusId: "campus-main", sensitivity: "P1", workflowState: "ready" }, before: { runId: previous.id, status: previous.status, version: previous.version }, after: { runId: next.id, status: next.status, revision }, operationDetails: { humanConfirmed: true, comment: comment.trim(), resetCount: state.videoScenario.resetCount }, context: { dataScope: "school", geographicLevel: "L2", purpose: "视频场景复位" } });
  return { success: true, code: "SCENARIO_RESET", message: `场景已复位为修订${revision}，业务写入仍为零。`, data: clone(next) };
}

export async function createCollaborationRun(actor: ActorContext, command: string, key: string): Promise<OperationResult> {
  if (!canCreate(actor)) return denied("只有资助中心、AI运维或系统管理员可创建跨角色协同运行。其他岗位可处理分配给本岗的人工闸门。");
  if (command.trim().length < 10 || command.length > 500) return { success: false, code: "COMMAND_INVALID", message: "任务指令需为10—500字。" };
  const state = loadState();
  const cached = state.runs.find(run => run.processedKeys.includes(key));
  if (cached) return { success: true, code: "IDEMPOTENT_REPLAY", message: "该运行已创建，本次返回原实例。", data: clone(cached) };
  const started = Date.now();
  let planning: CollaborationRun["planning"] = { source: "deterministic-fallback", model: "rules-orchestrator-v2", summary: FALLBACK_PLAN, tokenUsage: 0, latencyMs: 0 };
  if (isModelConfigured()) {
    try {
      const response = await completeWithDeepSeek([
        { role: "system", content: "你是冀慧学途的小海豚总调度Agent。只基于给定的模拟任务输出不超过120字的分工摘要；不得形成审批决定，不得要求敏感字段，不得跳过人工闸门。" },
        { role: "user", content: `${command.trim()}。固定流程：通知→学生申请→规则与AI预检→辅导员初审→院系汇总→校级复审→校领导审批→财务双签→银行MCP→对账归档。` },
      ], { temperature: 0, maxTokens: 180 });
      planning = { source: "deepseek", model: response.model, summary: response.content.slice(0, 240), tokenUsage: response.usage.totalTokens, latencyMs: Date.now() - started };
    } catch { planning.latencyMs = Date.now() - started; }
  }
  const time = now(); const sequence = state.runs.length + 1;
  const run: CollaborationRun = {
    id: `HGR-${randomUUID()}`, runNo: `HGR-${time.slice(0, 10).replaceAll("-", "")}-${String(sequence).padStart(3, "0")}`,
    workflowId: "workflow-temporary-hardship-grant", workflowVersion: 5, title: "临时困难补助跨角色协同", command: command.trim(),
    status: "running", currentStageIndex: 0, stages: stageDefinitions(), messages: [], traces: [], planning,
    businessObjects: businessObjects(), createdBy: actor.userId, createdByRole: actor.role, createdAt: time, updatedAt: time,
    version: 1, processedKeys: [key],
  };
  message(run, { senderType: "human", senderCode: actor.userId, senderName: ROLE_PROFILES[actor.role].name, senderRole: actor.role, avatar: "人", type: "command", content: run.command });
  message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "plan", content: `任务已受理。${planning.summary}` });
  for (const stage of run.stages) message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "assignment", stageId: stage.id, content: `${String(stage.sequence).padStart(2, "0")}号子任务已分派给${stage.agentName}；人工责任岗位：${stage.requiredRole ? ROLE_PROFILES[stage.requiredRole].name : "系统自动节点"}。` });
  trace(run, { kind: "WORKFLOW", name: "临时困难补助全链路协同", version: "v5", status: "success", latencyMs: 9, detail: "已安装工作流DAG加载完成，10个节点与8个人工闸门校验通过。" });
  trace(run, { kind: "MODEL", name: planning.model, version: "gateway-route-2026.08", status: "success", latencyMs: planning.latencyMs, detail: planning.source === "deepseek" ? `真实模型完成受控任务分解，使用${planning.tokenUsage} tokens。` : "模型不可用，确定性编排器完成安全降级。" });
  recordHardshipAssetExecution("workflow-temporary-hardship-grant");
  writeAuditSnapshot({ taskId: run.id, actorId: actor.userId, actorRole: actor.role, action: "workflow:run:create", outcome: "success", evidenceSummary: `创建临时困难补助协同运行 ${run.runNo}；工作流v6；计划来源 ${planning.source}；未执行任何未经确认的业务写入。`, resource: { type: "workflow_run", id: run.id, campusId: "campus-main", sensitivity: "P2", workflowState: "running" }, operationDetails: { workflowId: run.workflowId, nodeCount: 10, humanGates: 8, model: planning.model }, context: { dataScope: "school", geographicLevel: "L2", purpose: "临时困难补助跨角色协同" } });
  state.runs.unshift(run); trimRuns(state); persist(state);
  return { success: true, code: "RUN_CREATED", message: "小海豚已完成真实任务分解，10个子任务已进入协同队列。", data: clone(run) };
}

export function advanceCollaborationRun(actor: ActorContext, runId: string, expectedVersion: number, key: string): OperationResult {
  const run = locateRun(runId); if (!run) return { success: false, code: "NOT_FOUND", message: "协同运行不存在。" };
  if (!canControl(actor, run)) return denied("只有场景总调度责任人、AI运维或系统管理员可以推进Agent执行；各责任岗位只能确认分配给本岗的人工闸门。");
  if (replay(run, key)) return { success: true, code: "IDEMPOTENT_REPLAY", message: "该节点已处理。", data: clone(run) };
  if (run.version !== expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "运行状态已更新，请刷新后继续。", data: clone(run) };
  if (run.status === "ready") return { success: false, code: "SCENARIO_NOT_STARTED", message: "场景尚未启动。", data: clone(run) };
  if (run.status === "paused") return { success: false, code: "RUN_PAUSED", message: "运行已暂停，请先恢复。", data: clone(run) };
  if (run.status === "awaiting_human") return { success: false, code: "HUMAN_GATE_WAITING", message: "当前节点等待责任岗位人工确认。", data: clone(run) };
  if (run.status === "completed") return { success: true, code: "RUN_COMPLETED", message: "运行已完成。", data: clone(run) };
  const stage = currentStage(run); stage.status = "working"; stage.startedAt = now(); stage.attempts += 1;
  message(run, { senderType: "agent", senderCode: stage.agentCode, senderName: stage.agentName, senderRole: stage.roleCode, avatar: "AG", type: "progress", stageId: stage.id, content: `已接收任务，正在执行：${stage.actionSummary}` });
  const permission = evaluateAgentStage(stage);
  stage.permission = { status: permission.status, allowed: permission.allowed, code: permission.code, fieldMode: permission.fieldMode, dimensions: permission.dimensions, formula: permission.formula, evaluatedAt: permission.evaluatedAt };
  trace(run, { stageId: stage.id, kind: "PERMISSION", name: "九维权限交集", version: "policy-v2", status: permission.allowed ? "success" : "blocked", latencyMs: 11, detail: `${permission.dimensions.filter(item => item.status === "ALLOW").length}/9维通过；${permission.reason}` });
  if (!permission.allowed) {
    stage.status = "failed"; stage.result = permission.reason; run.status = "failed";
    message(run, { senderType: "system", senderCode: "guardrail", senderName: "确定性安全护栏", avatar: "盾", type: "security", stageId: stage.id, content: `节点已阻断：${permission.reason}` });
    writeAuditSnapshot({ taskId: run.id, actorId: stage.agentCode, actorRole: stage.roleCode, actorType: "agent", action: `agent:hardship:${stage.id}`, outcome: "denied", evidenceSummary: permission.reason, resource: { type: "workflow_stage", id: stage.id, campusId: "campus-main", sensitivity: "P2" }, permission: { status: permission.status, deniedBy: permission.deniedBy, fieldMode: permission.fieldMode, nineDimensionSnapshot: Object.fromEntries(permission.dimensions.map(item => [item.code, item.status])) }, affectedRows: 0 });
    markProcessed(run, key); update(run); return { success: false, code: "PERMISSION_BLOCKED", message: permission.reason, data: clone(run) };
  }
  const adapterConfigured = !run.scenario || stage.sequence <= run.scenario.implementedThroughStage;
  const isImplementedVideoStage = Boolean(run.scenario && adapterConfigured && ["notice", "apply", "precheck", "counselor", "department", "school", "leader", "finance", "bank", "reconcile"].includes(stage.id));
  let businessMessage = ""; let businessOutputs: string[] = []; let affectedRows = 0; let assetExecuted = !run.scenario;
  if (run.scenario && isImplementedVideoStage && !stage.humanGate) {
    const execution = executeHardshipVideoBusinessStage(roleActor(stage.roleCode), stage.id as HardshipVideoStageId, run.scenario.revision, run.id, `business-${key}`);
    if (!execution.success) { stage.status = "failed"; stage.result = execution.message; run.status = "failed"; message(run, { senderType: "system", senderCode: "business-adapter", senderName: "场景业务适配器", avatar: "业", type: "security", stageId: stage.id, content: `业务写入失败：${execution.message}` }); markProcessed(run, key); update(run); return { success: false, code: execution.code, message: execution.message, data: clone(run) }; }
    run.businessObjects = execution.businessObjects; businessMessage = execution.message; businessOutputs = execution.outputs; affectedRows = execution.affectedRows; assetExecuted = true; run.scenario.syncStatus = "running";
  }
  for (const assetId of stage.assetIds) {
    const kind = assetKind(assetId); const version = assetVersion(assetId);
    const traceStatus = assetExecuted ? "success" : "waiting";
    const detail = assetExecuted ? (businessMessage ? `${businessMessage} 输出：${businessOutputs.join("、")}` : kind === "MCP" ? "MCP握手、工具发现与允许列表检查通过；等待银行人员授权资金操作。" : kind === "RAG" ? "检索到2条有效政策依据，引用版本已冻结。" : "已安装资产在沙盒、版本锁定与数据边界内运行。") : adapterConfigured ? `执行器已接通；${stage.humanGate ? "等待责任岗位人工确认后执行实际业务写入。" : "等待前置业务条件。"}` : `${run.scenario?.implementationStage ?? "当前阶段"}真实性门禁：${kind}执行器尚未接通，本节点不会伪造调用。`;
    trace(run, { stageId: stage.id, kind, name: assetId, version, status: traceStatus, latencyMs: assetExecuted ? 35 + stage.sequence * 13 : 0, detail });
    if (assetExecuted && !assetId.startsWith("policy-rag")) recordHardshipAssetExecution(assetId);
  }
  const result = assetExecuted && businessMessage ? `${businessMessage} ${stage.expectedResult}` : adapterConfigured ? `${stage.expectedResult} Agent已完成受控分析与草稿生成，等待责任岗位人工确认后写入原系统。` : `${stage.title}的调度与权限预检已完成；${run.scenario?.implementationStage ?? "当前阶段"}尚未接通本节点原业务适配器。`;
  if (run.scenario && !adapterConfigured) run.scenario.syncStatus = "awaiting_business_adapter";
  stage.result = result; stage.durationMs = assetExecuted ? 160 + stage.sequence * 47 : 24; stage.evidenceId = addAuditForStage(run, stage, permission, result, assetExecuted);
  trace(run, { stageId: stage.id, kind: "AUDIT", name: "SHA-256审计证据链", version: "audit-evidence/v2", status: "success", latencyMs: 8, detail: `最小必要证据已追加，证据号 ${stage.evidenceId}；影响记录 ${affectedRows}。`, evidenceId: stage.evidenceId });
  message(run, { senderType: "agent", senderCode: stage.agentCode, senderName: stage.agentName, senderRole: stage.roleCode, avatar: "AG", type: "result", stageId: stage.id, content: `${result} 已向小海豚汇报。`, evidenceRefs: [stage.evidenceId, ...stage.assetIds, ...businessOutputs] });
  if (stage.humanGate && stage.requiredRole) {
    stage.status = "awaiting_human"; run.status = "awaiting_human";
    message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "gate", stageId: stage.id, content: `已完成${stage.title}的AI辅助部分。现在请求“${ROLE_PROFILES[stage.requiredRole].name}”核对证据并人工确认；确认成功后才写入原业务页面。`, evidenceRefs: [stage.evidenceId] });
  } else {
    if (run.scenario && !adapterConfigured) { stage.status = "failed"; run.status = "failed"; }
    else { stage.status = "completed"; stage.completedAt = now(); run.currentStageIndex = stage.sequence; message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "handoff", stageId: stage.id, content: stage.sequence < run.stages.length ? `${stage.title}已完成，业务对象、最小数据和证据包已交接至${run.stages[stage.sequence].agentName}。` : "最后一个执行节点已完成，正在生成总报告。", evidenceRefs: [stage.evidenceId, ...businessOutputs] }); if (stage.sequence === run.stages.length) finishRun(run); }
  }
  markProcessed(run, key); update(run);
  return { success: true, code: run.status === "awaiting_human" ? "HUMAN_GATE_CREATED" : "STAGE_COMPLETED", message: run.status === "awaiting_human" ? `已到达人工闸门，等待${ROLE_PROFILES[stage.requiredRole!].name}确认。` : "Agent节点执行完成并已交接。", data: clone(run) };
}

export function confirmCollaborationGate(actor: ActorContext, runId: string, expectedVersion: number, comment: string, key: string): OperationResult {
  const run = locateRun(runId); if (!run) return { success: false, code: "NOT_FOUND", message: "协同运行不存在。" };
  if (replay(run, key)) return { success: true, code: "IDEMPOTENT_REPLAY", message: "该人工闸门已确认。", data: clone(run) };
  if (run.version !== expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "运行状态已更新，请刷新后重试。", data: clone(run) };
  const stage = currentStage(run);
  if (run.status !== "awaiting_human" || stage.status !== "awaiting_human" || !stage.requiredRole) return { success: false, code: "GATE_NOT_WAITING", message: "当前没有等待确认的人工闸门。", data: clone(run) };
  if (actor.role !== stage.requiredRole) return denied(`当前闸门必须由“${ROLE_PROFILES[stage.requiredRole].name}”确认；当前岗位为“${ROLE_PROFILES[actor.role].name}”。`);
  if (comment.trim().length < 6 || comment.length > 300) return { success: false, code: "COMMENT_INVALID", message: "人工意见需为6—300字。" };
  if (run.scenario && stage.sequence > run.scenario.implementedThroughStage) return { success: false, code: "BUSINESS_ADAPTER_PENDING", message: `真实性门禁已阻止假完成：节点“${stage.title}”尚未接通原系统业务写入适配器。`, data: clone(run) };
  return withDemoVideoGateRollback((transactionId) => {
  // Recheck the disk version UNDER the audit lease: a second worker may have
  // completed the Gate after this process loaded its in-memory Run.
  const persisted = JSON.parse(readFileSync(stateFile, "utf8")) as PersistentState;
  const latest = persisted.runs.find(item => item.id === runId);
  if (!latest || latest.version !== expectedVersion || latest.status !== "awaiting_human") {
    delete globalState.__jhxtHardshipCollaboration;
    // Discard this worker's stale demo projections after another worker commits.
    const caches = globalThis as typeof globalThis & {
      __jhxtHardshipVideoBusiness?: unknown; __jhxtHardshipVideoReview?: unknown; __jhxtHardshipVideoDisbursement?: unknown;
    };
    delete caches.__jhxtHardshipVideoBusiness;
    delete caches.__jhxtHardshipVideoReview;
    delete caches.__jhxtHardshipVideoDisbursement;
    return { success: false, code: "VERSION_CONFLICT", message: "运行状态已更新，请刷新后重试。", data: latest ? clone(latest) : undefined };
  }
  let businessOutputs: string[] = []; let affectedRows = 0; let businessMessage = "";
  if (run.scenario && ["notice", "apply", "precheck", "counselor", "department", "school", "leader", "finance", "bank", "reconcile"].includes(stage.id)) {
    const execution = executeHardshipVideoBusinessStage(actor, stage.id as HardshipVideoStageId, run.scenario.revision, run.id, `business-${transactionId}-${key}`, comment.trim());
    if (!execution.success) return { success: false, code: execution.code, message: execution.message, data: clone(run) };
    run.businessObjects = execution.businessObjects; businessOutputs = execution.outputs; affectedRows = execution.affectedRows; businessMessage = execution.message; run.scenario.syncStatus = "running";
    for (const assetId of stage.assetIds) { const kind = assetKind(assetId); trace(run, { stageId: stage.id, kind, name: assetId, version: assetVersion(assetId), status: "success", latencyMs: 42 + stage.sequence * 11, detail: `${execution.message} 输出：${execution.outputs.join("、")}` }); if (!assetId.startsWith("policy-rag")) recordHardshipAssetExecution(assetId); }
    stage.result = `${execution.message} ${stage.expectedResult}`;
    message(run, { senderType: "agent", senderCode: stage.agentCode, senderName: stage.agentName, senderRole: stage.roleCode, avatar: "AG", type: "result", stageId: stage.id, content: `人工确认后业务适配器执行成功：${execution.message}`, evidenceRefs: [...execution.outputs, ...stage.assetIds] });
  }
  if (process.env.JHXT_TEST_GATE_FAILURE === "after_business" && process.env.NODE_ENV !== "production") throw new Error("DEMO_GATE_INJECTED_FAILURE");
  const confirmedAt = now();
  stage.confirmedBy = { actorId: actor.userId, role: actor.role, comment: comment.trim(), confirmedAt, transactionId }; stage.status = "completed"; stage.completedAt = confirmedAt; run.currentStageIndex = stage.sequence; run.status = "running";
  message(run, { senderType: "human", senderCode: actor.userId, senderName: ROLE_PROFILES[actor.role].name, senderRole: actor.role, avatar: "人", type: "gate", stageId: stage.id, content: `人工闸门已确认：${comment.trim()}`, evidenceRefs: [transactionId, ...(stage.evidenceId ? [stage.evidenceId] : []), ...businessOutputs] });
  message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "handoff", stageId: stage.id, content: stage.sequence < run.stages.length ? `收到${ROLE_PROFILES[actor.role].name}的人工确认。已将任务、最小数据和证据包交接给${run.stages[stage.sequence].agentName}。` : "已收到最终人工确认。", evidenceRefs: [transactionId] });
  markProcessed(run, key); update(run);
  if (process.env.JHXT_TEST_GATE_FAILURE === "after_run_persist" && process.env.NODE_ENV !== "production") throw new Error("DEMO_GATE_INJECTED_FAILURE");
  const receipt: OperationResult = { success: true, code: "GATE_CONFIRMED", message: "人工确认已冻结并写入审计证据链，工作流可继续。", data: clone(run) };
  writeAuditSnapshot({ taskId: run.id, actorId: actor.userId, actorRole: actor.role, actorType: "human", action: `workflow:human_gate:${stage.id}`, outcome: "human_confirmed", evidenceSummary: `${ROLE_PROFILES[actor.role].name}确认节点“${stage.title}”；${businessMessage || "人工意见已冻结"}；Agent未代替决定。`, resource: { type: "workflow_human_gate", id: stage.id, campusId: "campus-main", sensitivity: "P2", workflowState: "confirmed" }, operationDetails: { runId: run.id, transactionId, stageId: stage.id, expectedRole: stage.requiredRole, humanConfirmed: true, affectedRows, businessOutputs }, context: { dataScope: ROLE_PROFILES[actor.role].dataScope, geographicLevel: actor.role === "FINANCE" ? "L1" : "L2", purpose: "临时困难补助人工闸门确认" }, evidenceRefs: [...(stage.evidenceId ? [stage.evidenceId] : []), ...businessOutputs] });
  return receipt;
  });
}

function finishRun(run: CollaborationRun) {
  if (run.scenario && run.businessObjects.some(item => item.type !== "policy" && item.syncStatus !== "synced")) {
    run.status = "failed"; run.scenario.syncStatus = "awaiting_business_adapter";
    message(run, { senderType: "system", senderCode: "truthfulness-guard", senderName: "真实性门禁", avatar: "盾", type: "security", content: "业务对象尚未全部同步，系统拒绝将视频场景标记为完成。" });
    return;
  }
  run.status = "completed";
  if (run.scenario) run.scenario.syncStatus = "completed"; run.finishedAt = now();
  const elapsed = Math.max(1, new Date(run.finishedAt).getTime() - new Date(run.createdAt).getTime());
  const disbursement = run.scenario ? getHardshipVideoDisbursementStatus() : null;
  run.summary = {
    result: "10个节点全部完成；模拟补助2000元已回盘并对账平衡。", elapsedMs: elapsed, completedStages: run.stages.length,
    evidenceCount: run.traces.filter(item => item.kind === "AUDIT" && item.status === "success").length,
    modelCalls: run.traces.filter(item => item.kind === "MODEL" && item.status === "success").length,
    skillCalls: run.traces.filter(item => item.kind === "SKILL" && item.status === "success").length,
    mcpCalls: disbursement?.mcpCallIds.length ?? run.traces.filter(item => item.kind === "MCP" && item.status === "success").length,
  };
  message(run, { senderType: "dolphin", senderCode: "dolphin-orchestrator", senderName: "小海豚·总调度", avatar: "🐬", type: "result", content: `全部子任务已完成。${run.summary.result} 全过程权限、模型、Skill、MCP与人工意见均有审计证据。` });
  writeAuditSnapshot({ taskId: run.id, actorId: "dolphin-orchestrator", actorRole: run.createdByRole, actorType: "agent", action: "workflow:run:complete", outcome: "success", evidenceSummary: `临时困难补助协同运行 ${run.runNo} 已完成10/10节点；全过程人工闸门均已确认。`, resource: { type: "workflow_run", id: run.id, campusId: "campus-main", sensitivity: "P2", workflowState: "completed" }, after: { status: "completed", completedStages: 10, evidenceCount: run.summary.evidenceCount }, ai: { agentCode: "dolphin-orchestrator", agentName: "小海豚·总调度", modelProvider: run.planning.source, model: run.planning.model, workflowVersion: "temporary-hardship-v6", traceId: `TRACE-${run.id}`, outputSummary: run.summary.result, advisoryOnly: true }, context: { dataScope: "school", geographicLevel: "L2", purpose: "多Agent协同结果汇总" } });
}

export function controlCollaborationRun(actor: ActorContext, runId: string, action: "pause" | "resume" | "retry", expectedVersion: number, key: string): OperationResult {
  const run = locateRun(runId); if (!run) return { success: false, code: "NOT_FOUND", message: "协同运行不存在。" };
  if (!canControl(actor, run)) return denied("只有运行创建人、AI运维或系统管理员可暂停、恢复或重试运行。人工确认仍必须由责任岗位完成。");
  if (replay(run, key)) return { success: true, code: "IDEMPOTENT_REPLAY", message: "控制操作已处理。", data: clone(run) };
  if (run.version !== expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "运行状态已更新，请刷新后重试。", data: clone(run) };
  if (action === "pause") { if (run.status !== "running") return { success: false, code: "STATE_DENIED", message: "只有运行中的实例可以暂停。" }; run.status = "paused"; }
  if (action === "resume") { if (run.status !== "paused") return { success: false, code: "STATE_DENIED", message: "只有已暂停实例可以恢复。" }; run.status = "running"; }
  if (action === "retry") { const stage = currentStage(run); if (run.status !== "failed" || stage.status !== "failed") return { success: false, code: "STATE_DENIED", message: "只有失败节点可以重试。" }; stage.status = "pending"; stage.result = undefined; stage.permission = undefined; run.status = "running"; }
  markProcessed(run, key); update(run);
  writeAuditSnapshot({ taskId: run.id, actorId: actor.userId, actorRole: actor.role, action: `workflow:run:${action}`, outcome: "success", evidenceSummary: `运行 ${run.runNo} 执行${action}；版本 ${run.version}。`, resource: { type: "workflow_run", id: run.id, campusId: "campus-main", sensitivity: "P1", workflowState: run.status } });
  return { success: true, code: "RUN_CONTROLLED", message: action === "pause" ? "运行已安全暂停。" : action === "resume" ? "运行已恢复。" : "失败节点已重置，可重新执行。", data: clone(run) };
}

export function getCollaborationSnapshot(actor: ActorContext, runId?: string, scenarioId: string = VIDEO_HARDSHIP_SCENARIO_ID): CollaborationSnapshot {
  const state = loadState();
  const selected = runId ? state.runs.find(run => run.id === runId) : scenarioId === VIDEO_HARDSHIP_SCENARIO_ID ? activeVideoRun(state) : undefined;
  if (!selected) throw new Error("COLLABORATION_RUN_MISSING");
  const stage = currentStage(selected); const scenarioRuns = selected.scenario ? state.runs.filter(run => run.scenario?.id === selected.scenario?.id) : state.runs.filter(run => !run.scenario);
  const scenario = selected.scenario ? { ...selected.scenario, activeRunId: state.videoScenario.activeRunId, resetCount: state.videoScenario.resetCount, stateHash: digest(JSON.stringify({ id: selected.id, version: selected.version, status: selected.status, stage: selected.currentStageIndex, revision: selected.scenario.revision })) } : undefined;
  return {
    mode: selected.scenario ? "persistent-video-scenario-runtime" : "persistent-workflow-runtime",
    ...(scenario ? { scenario } : {}),
    template: { id: "workflow-temporary-hardship-grant", name: "临时困难补助全链路协同", version: selected.workflowVersion, installed: true, nodeCount: 10, humanGates: DEFINITIONS.filter(item => item.humanGate).length, riskLevel: "L3" },
    assets: getHardshipAssetManifest(),
    runs: scenarioRuns.map(run => ({ id: run.id, runNo: run.runNo, title: run.title, status: run.status, progress: runProgress(run), currentStage: currentStage(run).title, createdAt: run.createdAt, updatedAt: run.updatedAt, scenarioId: run.scenario?.id, revision: run.scenario?.revision })),
    selectedRun: clone(selected),
    viewer: { role: actor.role, roleName: ROLE_PROFILES[actor.role].name, canCreate: canCreate(actor), canStart: selected.status === "ready" && canCreate(actor) && selected.scenario?.isActive === true, canReset: canCreate(actor) && selected.scenario?.isActive === true, canControl: selected.status !== "ready" && canControl(actor, selected), canConfirmCurrentGate: selected.status === "awaiting_human" && stage.requiredRole === actor.role },
    safeguards: ["固定场景单一真值", "九维权限交集", "Agent工具允许列表", "业务适配器真实性门禁", "人工闸门不可绕过", "幂等与乐观锁", "SHA-256只追加审计链"],
  };
}


