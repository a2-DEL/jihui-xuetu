import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ActorContext } from "./authorization";

export const HARDSHIP_VIDEO_DISBURSEMENT_STAGES = ["finance", "bank", "reconcile"] as const;
export type HardshipVideoDisbursementStageId = (typeof HARDSHIP_VIDEO_DISBURSEMENT_STAGES)[number];
export type HardshipVideoDisbursementPhase = "awaiting_finance" | "awaiting_bank" | "receipt_received" | "completed";

export interface HardshipVideoDisbursementContext {
  scenarioId: string;
  revision: number;
  applicationId: string;
  projectName: string;
  amount: number;
  financeTaskId: string;
  baselineApplicationVersion: number;
  bankAccountLast4: string;
}

export interface HardshipVideoValidationCheck {
  code: string;
  label: string;
  status: "passed";
  detail: string;
  deterministic: true;
}

export interface HardshipVideoFinanceTaskOverlay {
  id: string;
  status: "pending" | "completed";
  version: number;
  completedAt?: string;
}

export interface HardshipVideoGrantBatch {
  id: string;
  batchNo: string;
  project: string;
  applicationIds: string[];
  students: number;
  amount: number;
  validAccounts: number;
  invalidAccounts: number;
  duplicateRecords: number;
  status: "double_confirmed" | "sent" | "completed";
  confirmations: Array<{ actorId: string; displayName: string; duty: "maker" | "reviewer"; signedAt: string; signature: string }>;
  bankFile: { name: string; sha256: string; recordCount: number; amount: number; encrypted: true; sizeBytes: number };
  bankFileHash: string;
  validationChecks: HardshipVideoValidationCheck[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface HardshipVideoBankTask {
  id: string;
  assignedTaskId: "grant-batch-2026-spring";
  batchId: string;
  batchNo: string;
  amount: number;
  count: number;
  accountView: string;
  requiredRole: "BANK";
  status: "pending_authorization" | "completed";
  scenarioId: string;
  applicationId: string;
  externalActionRoute: string;
  createdAt: string;
  completedAt?: string;
  version: number;
}

export interface HardshipVideoMcpCall {
  id: string;
  sequence: number;
  method: "initialize" | "tools/list" | "tools/call";
  tool?: "grant.batch.submit" | "grant.status.read" | "grant.receipt.pull";
  requestId: string;
  requestDigest: string;
  responseDigest: string;
  status: "success";
  latencyMs: number;
  requestSummary: string;
  responseSummary: string;
  createdAt: string;
}

export interface HardshipVideoMcpSession {
  id: string;
  serverName: "bank-grant-mcp";
  endpoint: "mock://bank/grant-mcp";
  protocolVersion: "2025-03-26";
  transport: "in-process-mock-adapter";
  authMode: "mTLS-simulated-certificate";
  certificateFingerprint: string;
  allowlist: ["grant.batch.submit", "grant.status.read", "grant.receipt.pull"];
  discoveredTools: ["grant.batch.submit", "grant.status.read", "grant.receipt.pull"];
  status: "connected";
  openedAt: string;
  closedAt: string;
}

export interface HardshipVideoBankReceipt {
  id: string;
  receiptNo: string;
  bankTaskId: string;
  batchId: string;
  expectedCount: number;
  actualCount: number;
  expectedAmount: number;
  actualAmount: number;
  failedCount: number;
  result: "SUCCESS";
  bankReference: string;
  sha256: string;
  receivedAt: string;
}

export interface HardshipVideoReconciliation {
  id: string;
  batchNo: string;
  expectedCount: number;
  actualCount: number;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  failedCount: number;
  duplicateReceiptCount: number;
  result: "matched";
  reason: string;
  ruleVersion: "grant-reconciliation-v3";
  completedAt: string;
  version: number;
}

export interface HardshipVideoVoucher {
  id: string;
  voucherNo: string;
  batchNo: string;
  debit: string;
  credit: string;
  amount: number;
  attachments: number;
  status: "draft";
  version: number;
  createdAt: string;
  controlNote: string;
}

export interface HardshipVideoArrivalNotice {
  id: string;
  recipientId: "demo-student";
  applicationId: string;
  ticketId: string;
  type: "progress";
  title: string;
  content: string;
  channels: Array<"in_app" | "wechat_adapter">;
  deliveryStatus: "delivered";
  createdAt: string;
  readAt?: string;
  actionRoute: string;
  actionLabel: string;
  scenarioId: string;
}

export interface HardshipVideoDisbursementExecutionResult {
  success: boolean;
  code: string;
  message: string;
  affectedRows: number;
  outputs: string[];
}

interface DisbursementEvent {
  id: string;
  stageId: HardshipVideoDisbursementStageId | "reset";
  actorId: string;
  actorRole: string;
  title: string;
  detail: string;
  createdAt: string;
}

interface DisbursementState {
  schemaVersion: 1;
  scenarioId: string;
  revision: number;
  applicationId: string;
  projectName: string;
  amount: number;
  financeTaskId: string;
  bankAccountLast4: string;
  phase: HardshipVideoDisbursementPhase;
  applicationStatus: "待发放" | "已完成";
  applicationVersion: number;
  financeTask: HardshipVideoFinanceTaskOverlay;
  validationChecks: HardshipVideoValidationCheck[];
  batch?: HardshipVideoGrantBatch;
  bankTask?: HardshipVideoBankTask;
  mcpSession?: HardshipVideoMcpSession;
  mcpCalls: HardshipVideoMcpCall[];
  receipt?: HardshipVideoBankReceipt;
  reconciliation?: HardshipVideoReconciliation;
  voucher?: HardshipVideoVoucher;
  arrivalNotice?: HardshipVideoArrivalNotice;
  processedKeys: Array<{ scope: string; stageId: HardshipVideoDisbursementStageId; createdAt: string }>;
  events: DisbursementEvent[];
  updatedAt: string;
}

type Root = typeof globalThis & { __jhxtHardshipVideoDisbursement?: DisbursementState };
const root = globalThis as Root;
const file = join(process.cwd(), ".runtime", "hardship-video-disbursement.json");
const now = () => new Date().toISOString();
const clone = <T>(value: T): T => structuredClone(value);
const rev = (revision: number) => String(revision).padStart(3, "0");
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function emptyState(scenarioId: string, revision: number, actorId: string, at: string): DisbursementState {
  return {
    schemaVersion: 1,
    scenarioId,
    revision,
    applicationId: "",
    projectName: "",
    amount: 0,
    financeTaskId: "",
    bankAccountLast4: "",
    phase: "awaiting_finance",
    applicationStatus: "待发放",
    applicationVersion: 0,
    financeTask: { id: "", status: "pending", version: 1 },
    validationChecks: [],
    mcpCalls: [],
    processedKeys: [],
    events: [{ id: `VIDEO-DISB-EVT-${rev(revision)}-RESET`, stageId: "reset", actorId, actorRole: "SYSTEM", title: "资金链路已清空", detail: "等待校领导审批后生成财务任务。", createdAt: at }],
    updatedAt: at,
  };
}

function initial(context: HardshipVideoDisbursementContext, actorId: string, at: string): DisbursementState {
  return {
    ...emptyState(context.scenarioId, context.revision, actorId, at),
    applicationId: context.applicationId,
    projectName: context.projectName,
    amount: context.amount,
    financeTaskId: context.financeTaskId,
    bankAccountLast4: context.bankAccountLast4,
    applicationVersion: context.baselineApplicationVersion,
    financeTask: { id: context.financeTaskId, status: "pending", version: 1 },
    events: [{ id: `VIDEO-DISB-EVT-${rev(context.revision)}-READY`, stageId: "reset", actorId, actorRole: "SYSTEM", title: "财务发放链路已就绪", detail: `财务任务${context.financeTaskId}已接入，等待确定性校验和双人分离复核。`, createdAt: at }],
  };
}

function persist(state: DisbursementState) {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  try { renameSync(temporary, file); }
  catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") throw error;
    copyFileSync(temporary, file);
    unlinkSync(temporary);
  }
}

function load(context?: HardshipVideoDisbursementContext): DisbursementState | null {
  if (root.__jhxtHardshipVideoDisbursement) {
    const current = root.__jhxtHardshipVideoDisbursement;
    if (context && (current.revision !== context.revision || current.applicationId !== context.applicationId)) return resetHardshipVideoDisbursement(context, "system-context-sync");
    if (context && !current.applicationId) return resetHardshipVideoDisbursement(context, "system-context-ready");
    return current;
  }
  let state: DisbursementState | null = null;
  if (existsSync(file)) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as DisbursementState;
      if (parsed?.schemaVersion === 1 && parsed.scenarioId) state = parsed;
    } catch { state = null; }
  }
  if (!state && context) state = initial(context, "system-init", now());
  if (state) { root.__jhxtHardshipVideoDisbursement = state; persist(state); }
  return state;
}

export function clearHardshipVideoDisbursement(actorId: string, scenarioId: string, revision: number, at = now()) {
  const state = emptyState(scenarioId, revision, actorId, at);
  root.__jhxtHardshipVideoDisbursement = state;
  persist(state);
}

export function resetHardshipVideoDisbursement(context: HardshipVideoDisbursementContext, actorId: string, at = now()) {
  const state = initial(context, actorId, at);
  root.__jhxtHardshipVideoDisbursement = state;
  persist(state);
  return clone(state);
}

const expectedRole: Record<HardshipVideoDisbursementStageId, "FINANCE" | "BANK"> = { finance: "FINANCE", bank: "BANK", reconcile: "FINANCE" };
const expectedPhase: Record<HardshipVideoDisbursementStageId, HardshipVideoDisbursementPhase> = { finance: "awaiting_finance", bank: "awaiting_bank", reconcile: "receipt_received" };

function event(state: DisbursementState, stageId: HardshipVideoDisbursementStageId, actor: ActorContext, title: string, detail: string, at: string) {
  state.events.push({ id: `VIDEO-DISB-EVT-${rev(state.revision)}-${stageId.toUpperCase()}-${state.events.length + 1}`, stageId, actorId: actor.userId, actorRole: actor.role, title, detail, createdAt: at });
}

function mcpCall(state: DisbursementState, input: Omit<HardshipVideoMcpCall, "id" | "sequence" | "requestDigest" | "responseDigest" | "status" | "createdAt"> & { request: unknown; response: unknown }, at: string) {
  const sequence = state.mcpCalls.length + 1;
  state.mcpCalls.push({
    id: `VIDEO-MCP-CALL-${rev(state.revision)}-${String(sequence).padStart(2, "0")}`,
    sequence,
    method: input.method,
    tool: input.tool,
    requestId: input.requestId,
    requestDigest: sha256(JSON.stringify(input.request)),
    responseDigest: sha256(JSON.stringify(input.response)),
    status: "success",
    latencyMs: input.latencyMs,
    requestSummary: input.requestSummary,
    responseSummary: input.responseSummary,
    createdAt: at,
  });
}

export function executeHardshipVideoDisbursementStage(
  actor: ActorContext,
  stageId: HardshipVideoDisbursementStageId,
  context: HardshipVideoDisbursementContext,
  runId: string,
  key: string,
  humanComment = "系统自动执行确定性对账。",
): HardshipVideoDisbursementExecutionResult {
  let state = load(context);
  if (!state) state = resetHardshipVideoDisbursement(context, "system-init");
  if (actor.role !== expectedRole[stageId]) return { success: false, code: "VIDEO_STAGE_ROLE_DENIED", message: `节点${stageId}必须由${expectedRole[stageId]}执行。`, affectedRows: 0, outputs: [] };
  const scope = `${actor.userId}:${runId}:${key}`;
  if (state.processedKeys.some(item => item.scope === scope && item.stageId === stageId)) {
    return { success: true, code: "IDEMPOTENT_REPLAY", message: "该资金节点已执行，本次返回持久化结果。", affectedRows: 0, outputs: outputIds(state, stageId) };
  }
  if (state.phase !== expectedPhase[stageId]) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: `资金链路当前为${state.phase}，不能执行${stageId}节点。`, affectedRows: 0, outputs: [] };
  const at = now();
  const code = rev(state.revision);
  let message = "";
  let outputs: string[] = [];

  if (stageId === "finance") {
    const availableBudget = 1680000 - 940000;
    state.validationChecks = [
      { code: "BUDGET_AVAILABLE", label: "预算余额", status: "passed", detail: `临时困难补助专项可用余额${availableBudget.toLocaleString("zh-CN")}元，本批占用${state.amount.toLocaleString("zh-CN")}元。`, deterministic: true },
      { code: "AMOUNT_COUNT_BALANCE", label: "金额与笔数平衡", status: "passed", detail: `1笔申请×${state.amount.toLocaleString("zh-CN")}元＝批次总额${state.amount.toLocaleString("zh-CN")}元。`, deterministic: true },
      { code: "ACCOUNT_MINIMUM_FIELDS", label: "账户最小字段", status: "passed", detail: `仅向银行任务传递收款账号尾号${state.bankAccountLast4}及加密账户令牌。`, deterministic: true },
      { code: "DUPLICATE_DISBURSEMENT", label: "重复发放", status: "passed", detail: "场景幂等键、申请号和学年项目联合检查未发现重复发放。", deterministic: true },
      { code: "DUAL_CONTROL_SEPARATION", label: "双人职责分离", status: "passed", detail: "制单人demo-finance与复核人finance-reviewer-002身份不同。", deterministic: true },
    ];
    const payload = JSON.stringify({ scenarioId: state.scenarioId, applicationId: state.applicationId, amount: state.amount, count: 1, accountToken: `acct-token-${code}-${state.bankAccountLast4}` });
    const fileDigest = sha256(payload);
    state.batch = {
      id: `VIDEO-BATCH-${code}`,
      batchNo: `JF202608-VIDEO-${code}`,
      project: state.projectName,
      applicationIds: [state.applicationId],
      students: 1,
      amount: state.amount,
      validAccounts: 1,
      invalidAccounts: 0,
      duplicateRecords: 0,
      status: "double_confirmed",
      confirmations: [
        { actorId: actor.userId, displayName: "钱会计（制单）", duty: "maker", signedAt: at, signature: `SIG-${actor.userId}-${fileDigest.slice(0, 12)}` },
        { actorId: "finance-reviewer-002", displayName: "周复核（复核）", duty: "reviewer", signedAt: at, signature: `SIG-finance-reviewer-002-${fileDigest.slice(12, 24)}` },
      ],
      bankFile: { name: `grant-${code}.jhf`, sha256: fileDigest, recordCount: 1, amount: state.amount, encrypted: true, sizeBytes: Buffer.byteLength(payload) },
      bankFileHash: `SHA256:${fileDigest}`,
      validationChecks: state.validationChecks,
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    state.bankTask = { id: `VIDEO-BANK-TASK-${code}`, assignedTaskId: "grant-batch-2026-spring", batchId: state.batch.id, batchNo: state.batch.batchNo, amount: state.amount, count: 1, accountView: `****${state.bankAccountLast4}`, requiredRole: "BANK", status: "pending_authorization", scenarioId: state.scenarioId, applicationId: state.applicationId, externalActionRoute: `/agent/monitor/collaboration?scenario=${state.scenarioId}`, createdAt: at, version: 1 };
    state.financeTask = { id: state.financeTaskId, status: "completed", version: 2, completedAt: at };
    state.phase = "awaiting_bank";
    message = "财务确定性校验与模拟双人分离复核完成，银行任务已生成。";
    outputs = [state.financeTask.id, state.batch.id, state.bankTask.id, state.batch.bankFile.sha256];
    event(state, stageId, actor, "财务双人复核完成", `${state.batch.batchNo}通过5项确定性校验；${humanComment.trim()} 银行文件摘要${fileDigest.slice(0, 16)}…。`, at);
  } else if (stageId === "bank") {
    if (!state.batch || !state.bankTask) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: "财务批次或银行任务不存在。", affectedRows: 0, outputs: [] };
    const sessionId = `VIDEO-MCP-SESSION-${code}`;
    const session: HardshipVideoMcpSession = { id: sessionId, serverName: "bank-grant-mcp", endpoint: "mock://bank/grant-mcp", protocolVersion: "2025-03-26", transport: "in-process-mock-adapter", authMode: "mTLS-simulated-certificate", certificateFingerprint: `SHA256:${sha256(`cert:${code}`).slice(0, 32)}`, allowlist: ["grant.batch.submit", "grant.status.read", "grant.receipt.pull"], discoveredTools: ["grant.batch.submit", "grant.status.read", "grant.receipt.pull"], status: "connected", openedAt: at, closedAt: at };
    state.mcpSession = session;
    state.mcpCalls = [];
    const callBase = `mcp-${code}`;
    mcpCall(state, { method: "initialize", requestId: `${callBase}-01`, latencyMs: 18, requestSummary: "协商MCP协议版本与客户端能力", responseSummary: "bank-grant-mcp接受协议2025-03-26", request: { protocolVersion: session.protocolVersion, clientInfo: { name: "jihuixuetu-agent-os", version: "6.0" } }, response: { protocolVersion: session.protocolVersion, serverInfo: { name: session.serverName, version: "1.2.0-mock" } } }, at);
    mcpCall(state, { method: "tools/list", requestId: `${callBase}-02`, latencyMs: 12, requestSummary: "发现银行服务端工具", responseSummary: "发现3个工具，全部命中租户允许列表", request: {}, response: { tools: session.discoveredTools } }, at);
    mcpCall(state, { method: "tools/call", tool: "grant.batch.submit", requestId: `${callBase}-03`, latencyMs: 46, requestSummary: `提交${state.batch.batchNo}：1人，${state.amount}元，仅含最小字段`, responseSummary: `银行任务${state.bankTask.id}已受理`, request: { name: "grant.batch.submit", arguments: { batchNo: state.batch.batchNo, fileSha256: state.batch.bankFile.sha256, recordCount: 1, amount: state.amount, accountToken: `acct-token-${code}-${state.bankAccountLast4}` } }, response: { accepted: true, taskId: state.bankTask.id, status: "PROCESSING" } }, at);
    mcpCall(state, { method: "tools/call", tool: "grant.status.read", requestId: `${callBase}-04`, latencyMs: 25, requestSummary: `查询${state.bankTask.id}处理状态`, responseSummary: "银行模拟清算完成，1笔成功、0笔失败", request: { name: "grant.status.read", arguments: { taskId: state.bankTask.id } }, response: { taskId: state.bankTask.id, status: "COMPLETED", successCount: 1, failedCount: 0 } }, at);
    const receiptNo = `BANK-RCP-202608-${code}`;
    const receiptPayload = { receiptNo, taskId: state.bankTask.id, batchNo: state.batch.batchNo, actualCount: 1, actualAmount: state.amount, failedCount: 0, result: "SUCCESS" };
    mcpCall(state, { method: "tools/call", tool: "grant.receipt.pull", requestId: `${callBase}-05`, latencyMs: 31, requestSummary: `拉取${state.bankTask.id}可验证回盘`, responseSummary: `${receiptNo}回盘已返回并通过摘要校验`, request: { name: "grant.receipt.pull", arguments: { taskId: state.bankTask.id } }, response: receiptPayload }, at);
    const receiptSha = sha256(JSON.stringify(receiptPayload));
    state.receipt = { id: `VIDEO-BANK-RECEIPT-${code}`, receiptNo, bankTaskId: state.bankTask.id, batchId: state.batch.id, expectedCount: 1, actualCount: 1, expectedAmount: state.amount, actualAmount: state.amount, failedCount: 0, result: "SUCCESS", bankReference: `SIM-BANK-${code}-${receiptSha.slice(0, 8)}`, sha256: receiptSha, receivedAt: at };
    state.bankTask.status = "completed";
    state.bankTask.completedAt = at;
    state.bankTask.version += 1;
    state.batch.status = "sent";
    state.batch.version += 1;
    state.batch.updatedAt = at;
    state.phase = "receipt_received";
    message = "银行人员授权后，MCP完成握手、工具发现、提交、状态查询和回盘拉取。";
    outputs = [session.id, ...state.mcpCalls.map(item => item.id), state.receipt.id, state.receipt.sha256];
    event(state, stageId, actor, "银行MCP回盘完成", `${humanComment.trim()} 5次JSON-RPC交互均已持久化，回盘${receiptNo}为1笔成功、0笔失败。`, at);
  } else {
    if (!state.batch || !state.receipt) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: "银行回盘不存在，不能执行对账。", affectedRows: 0, outputs: [] };
    const difference = state.receipt.actualAmount - state.receipt.expectedAmount;
    if (difference !== 0 || state.receipt.actualCount !== state.receipt.expectedCount || state.receipt.failedCount !== 0) return { success: false, code: "VIDEO_RECONCILIATION_EXCEPTION", message: "银行回盘存在金额、笔数或失败项差异，必须转人工处置。", affectedRows: 0, outputs: [] };
    state.reconciliation = { id: `VIDEO-RECON-${code}`, batchNo: state.batch.batchNo, expectedCount: 1, actualCount: 1, expectedAmount: state.amount, actualAmount: state.amount, difference: 0, failedCount: 0, duplicateReceiptCount: 0, result: "matched", reason: "应发与实发金额、笔数、失败项及回盘幂等键全部一致。", ruleVersion: "grant-reconciliation-v3", completedAt: at, version: 1 };
    state.voucher = { id: `VIDEO-VOUCHER-${code}`, voucherNo: `草稿-202608-${code}`, batchNo: state.batch.batchNo, debit: "学生资助支出/临时困难补助", credit: "银行存款", amount: state.amount, attachments: 6, status: "draft", version: 1, createdAt: at, controlNote: "只生成凭证草稿，不由Agent自动记账或归档。" };
    state.arrivalNotice = { id: `VIDEO-ARRIVAL-${code}`, recipientId: "demo-student", applicationId: state.applicationId, ticketId: `VIDEO-INTAKE-${code}`, type: "progress", title: "临时困难补助已到账", content: `您申请的${state.projectName}已完成银行发放与银校对账，模拟到账金额${state.amount.toLocaleString("zh-CN")}元。回盘号${state.receipt.receiptNo}。`, channels: ["in_app", "wechat_adapter"], deliveryStatus: "delivered", createdAt: at, actionRoute: `/application/detail?id=${state.applicationId}`, actionLabel: "查看完整进度", scenarioId: state.scenarioId };
    state.batch.status = "completed";
    state.batch.version += 1;
    state.batch.updatedAt = at;
    state.applicationStatus = "已完成";
    state.applicationVersion += 1;
    state.phase = "completed";
    message = "自动对账平衡，申请已完结，到账通知和会计凭证草稿已生成。";
    outputs = [state.reconciliation.id, state.voucher.id, state.arrivalNotice.id, state.applicationId];
    event(state, stageId, actor, "银校闭环完成", `${state.reconciliation.reason} 学生到账通知已投递；会计凭证保持人工复核草稿。`, at);
  }

  state.processedKeys.push({ scope, stageId, createdAt: at });
  state.processedKeys = state.processedKeys.slice(-100);
  state.updatedAt = at;
  persist(state);
  return { success: true, code: "VIDEO_BUSINESS_STAGE_COMPLETED", message, affectedRows: outputs.length, outputs };
}

function outputIds(state: DisbursementState, stageId: HardshipVideoDisbursementStageId): string[] {
  if (stageId === "finance") return [state.financeTask.id, state.batch?.id, state.bankTask?.id].filter((item): item is string => Boolean(item));
  if (stageId === "bank") return [state.mcpSession?.id, ...state.mcpCalls.map(item => item.id), state.receipt?.id].filter((item): item is string => Boolean(item));
  return [state.reconciliation?.id, state.voucher?.id, state.arrivalNotice?.id].filter((item): item is string => Boolean(item));
}

export function getHardshipVideoDisbursementApplicationOverlay(applicationId: string) {
  const state = load();
  return state?.applicationId === applicationId && state.phase === "completed" ? { status: state.applicationStatus, version: state.applicationVersion, updatedAt: state.updatedAt, lastComment: "银行回盘与银校对账已完成，学生到账通知已送达。", grantBatchId: state.batch?.id } : null;
}

export function getHardshipVideoDisbursementStudentOverlay(applicationId: string) {
  const state = load();
  if (!state || state.applicationId !== applicationId || state.phase !== "completed") return null;
  return { status: "已完成", followUp: "模拟补助已到账，银行回盘和银校对账证据可追溯。", lastContact: state.updatedAt.slice(0, 10) };
}

export function getHardshipVideoFinanceTaskOverlay(taskId: string) {
  const state = load();
  return state?.financeTask.id === taskId ? clone(state.financeTask) : null;
}

export function listHardshipVideoDisbursementNotices(actor: ActorContext) {
  const state = load();
  return state?.arrivalNotice && actor.role === "STUDENT" && actor.userId === state.arrivalNotice.recipientId ? [clone(state.arrivalNotice)] : [];
}

export function markHardshipVideoDisbursementNoticeRead(actor: ActorContext, noticeId: string) {
  const state = load();
  if (!state?.arrivalNotice || actor.role !== "STUDENT" || actor.userId !== state.arrivalNotice.recipientId || noticeId !== state.arrivalNotice.id) return null;
  state.arrivalNotice.readAt ??= now();
  persist(state);
  return clone(state.arrivalNotice);
}

export function getHardshipVideoFinanceProjection() {
  const state = load();
  if (!state?.applicationId) return null;
  return clone({
    revision: state.revision,
    phase: state.phase,
    financeTask: state.financeTask,
    validationChecks: state.validationChecks,
    batch: state.batch,
    bankTask: state.bankTask,
    receipt: state.receipt,
    reconciliation: state.reconciliation,
    voucher: state.voucher,
    completedAt: state.reconciliation?.completedAt,
  });
}

export function getHardshipVideoBankSnapshot(actor: ActorContext) {
  if (!["BANK", "FINANCE", "FUND_ADMIN", "FUND_LEADER", "SCHOOL_LEADER", "AUDITOR", "AUDIT_EXTERNAL"].includes(actor.role)) return null;
  const state = load();
  if (!state?.applicationId) return { scenarioId: state?.scenarioId ?? "VIDEO-HARDSHIP-2026-001", phase: "not_ready", bankTask: null, batch: null, session: null, calls: [], receipt: null, reconciliation: null, security: { dataMode: "simulated", externalMoneyMovement: false, accountFieldMode: "masked", directWriteAllowed: false } };
  return clone({
    scenarioId: state.scenarioId,
    revision: state.revision,
    phase: state.phase,
    bankTask: state.bankTask ?? null,
    batch: state.batch ? { id: state.batch.id, batchNo: state.batch.batchNo, project: state.batch.project, count: state.batch.students, amount: state.batch.amount, status: state.batch.status, bankFileHash: state.batch.bankFileHash, confirmations: state.batch.confirmations.map(item => ({ ...item, signature: `${item.signature.slice(0, 12)}…` })) } : null,
    session: state.mcpSession ?? null,
    calls: state.mcpCalls,
    receipt: state.receipt ?? null,
    reconciliation: state.reconciliation ?? null,
    security: { dataMode: "simulated", externalMoneyMovement: false, accountFieldMode: "masked", directWriteAllowed: false, adapter: "in-process deterministic MCP mock", truthfulness: "调用、请求摘要、响应摘要和状态变化均真实持久化；不连接真实银行资金网络。" },
  });
}

export function getHardshipVideoDisbursementBusinessObjects(context?: HardshipVideoDisbursementContext) {
  const state = load(context);
  const revision = context?.revision ?? state?.revision ?? 1;
  const code = rev(revision);
  const ready = Boolean(state?.applicationId);
  const financeDone = Boolean(state?.batch);
  const bankDone = Boolean(state?.receipt && state.mcpSession);
  const reconcileDone = state?.phase === "completed";
  return [
    { type: "finance_task", id: state?.financeTask.id || context?.financeTaskId || "VIDEO-FINANCE-TASK-PENDING", label: "财务发放交接任务", status: !ready ? "尚未生成" : state?.financeTask.status === "completed" ? "已完成双人复核" : "待财务处理", route: "/finance#tasks", sensitivity: "P3·最小必要字段", syncStatus: (ready && state?.financeTask.id ? "synced" : "pending") as "synced" | "pending" },
    { type: "grant_batch", id: state?.batch?.id ?? `VIDEO-BATCH-PENDING-${code}`, label: "临时困难补助发放批次", status: state?.batch?.status ?? "尚未生成", route: "/finance#batches", sensitivity: "P3·加密银行文件", syncStatus: (financeDone ? "synced" : "pending") as "synced" | "pending" },
    { type: "bank_task", id: state?.bankTask?.id ?? `VIDEO-BANK-TASK-PENDING-${code}`, label: "银行授权与发放任务", status: state?.bankTask?.status ?? "尚未生成", route: "/bank/portal", sensitivity: "P3·账号仅尾号", syncStatus: (state?.bankTask ? "synced" : "pending") as "synced" | "pending" },
    { type: "mcp_session", id: state?.mcpSession?.id ?? `VIDEO-MCP-SESSION-PENDING-${code}`, label: "银行MCP会话与工具调用", status: bankDone ? `${state!.mcpCalls.length}次调用成功` : "等待银行授权", route: "/bank/portal#mcp", sensitivity: "P2·请求响应摘要", syncStatus: (bankDone ? "synced" : "pending") as "synced" | "pending" },
    { type: "bank_receipt", id: state?.receipt?.id ?? `VIDEO-BANK-RECEIPT-PENDING-${code}`, label: "银行可验证回盘", status: state?.receipt?.result ?? "尚未返回", route: "/bank/portal#receipt", sensitivity: "P2·回盘摘要", syncStatus: (state?.receipt ? "synced" : "pending") as "synced" | "pending" },
    { type: "reconciliation", id: state?.reconciliation?.id ?? `VIDEO-RECON-PENDING-${code}`, label: "银校自动对账结果", status: state?.reconciliation?.result ?? "等待回盘", route: "/finance#reconciliation", sensitivity: "P1", syncStatus: (reconcileDone ? "synced" : "pending") as "synced" | "pending" },
    { type: "arrival_notice", id: state?.arrivalNotice?.id ?? `VIDEO-ARRIVAL-PENDING-${code}`, label: "学生到账通知", status: state?.arrivalNotice?.deliveryStatus ?? "尚未投递", route: "/application/notifications", sensitivity: "P1", syncStatus: (reconcileDone ? "synced" : "pending") as "synced" | "pending" },
  ];
}

export function getHardshipVideoDisbursementStatus() {
  const state = load();
  return state ? clone({ revision: state.revision, applicationId: state.applicationId, phase: state.phase, applicationStatus: state.applicationStatus, applicationVersion: state.applicationVersion, financeTask: state.financeTask, batchId: state.batch?.id, batchStatus: state.batch?.status, bankTaskId: state.bankTask?.id, bankTaskStatus: state.bankTask?.status, mcpSessionId: state.mcpSession?.id, mcpCallIds: state.mcpCalls.map(item => item.id), receiptId: state.receipt?.id, reconciliationId: state.reconciliation?.id, voucherId: state.voucher?.id, arrivalNoticeId: state.arrivalNotice?.id, updatedAt: state.updatedAt }) : null;
}
