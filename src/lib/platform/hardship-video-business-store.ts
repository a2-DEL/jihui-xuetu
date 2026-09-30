import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ActorContext } from "./authorization";
import type { RoleCode } from "./roles";
import { clearHardshipVideoReview, executeHardshipVideoReviewStage, getHardshipVideoReviewApplicationOverlay, getHardshipVideoReviewBusinessObjects, getHardshipVideoReviewProjections, getHardshipVideoReviewStatus, getHardshipVideoReviewStudentOverlay, getHardshipVideoReviewTicketOverlay, listHardshipVideoReviewNotices, markHardshipVideoReviewNoticeRead, resetHardshipVideoReview, type HardshipVideoReviewContext, type HardshipVideoReviewStageId, type HardshipVideoReviewStatus } from "./hardship-video-review-store";
import { clearHardshipVideoDisbursement, executeHardshipVideoDisbursementStage, getHardshipVideoDisbursementApplicationOverlay, getHardshipVideoDisbursementBusinessObjects, getHardshipVideoDisbursementStatus, getHardshipVideoDisbursementStudentOverlay, listHardshipVideoDisbursementNotices, markHardshipVideoDisbursementNoticeRead, type HardshipVideoDisbursementContext, type HardshipVideoDisbursementStageId } from "./hardship-video-disbursement-store";

export const HARDSHIP_VIDEO_SCENARIO_ID = "VIDEO-HARDSHIP-2026-001" as const;
export type HardshipVideoStageId = "notice" | "apply" | "precheck" | HardshipVideoReviewStageId | HardshipVideoDisbursementStageId;

export interface HardshipVideoApplicationProjection {
  id: string; studentName: string; studentNo: string; ownerId: string; campusId: string; departmentId: string; classId: string;
  projectName: string; requestedAmount: number; status: HardshipVideoReviewStatus | "已完成"; riskLevel: "中"; materialCompleteness: number;
  submittedAt: string; overdue: false; version: number; updatedAt: string; lastComment: string;
  submissionChannel: "web"; materialSubmissionMethod: "mixed"; academicYear: string; semester: string;
  applicantStatement: string; familyAnnualIncome: number; familyMembers: number; specialCircumstance: string;
  bankName: string; bankAccountLast4: string; materialCount: number; materialVerifiedCount: number;
  submissionReceiptNo: string; authorizationSources: string[]; precheckReportId?: string; precheckScore?: number;
  precheckWarnings: string[]; precheckWaiverConfirmed: true; intakeTicketId?: string;
  scenarioId: typeof HARDSHIP_VIDEO_SCENARIO_ID; scenarioRevision: number;
}
export interface HardshipVideoMaterialProjection {
  id: string; name: string; type: string; status: "verified"; completeness: number; source: string; sizeBytes: number;
  sha256: string; submittedAt: string; processingStatus: "completed"; detailPath: string;
}
export interface HardshipVideoPrecheckProjection {
  id: string; applicationId: string; projectCode: string; score: number; requiredDocuments: string[]; evidenceCount: number;
  missingCount: number; warnings: string[]; blockers: string[]; requiresWaiver: false; waiverConfirmed: true; status: "passed";
  disclaimer: string; generatedAt: string;
  aiAdvice: { status: "completed"; modelUsed: false; model: "material-precheck-skill-v3"; summary: string; suggestions: string[]; caution: string; generatedAt: string };
}
export interface HardshipVideoTicketProjection {
  id: string; applicationId: string; ownerId: string; campusId: string; departmentId: string; classId: string; projectName: string;
  receiptNo: string; status: "queued" | "forwarded" | "closed"; priority: "high"; handlerRole: "COUNSELOR" | "DEPT_ADMIN" | "FUND_ADMIN" | "SCHOOL_LEADER" | "FINANCE"; dueAt: string; issues: string[];
  precheckReportId: string; version: number; createdAt: string; updatedAt: string;
  timeline: Array<{ id: string; action: string; title: string; detail: string; actorId: string; actorRole: string; createdAt: string }>;
}
export interface HardshipVideoNoticeProjection {
  id: string; recipientId: string; applicationId: string; ticketId: string; type: "announcement" | "receipt" | "progress";
  title: string; content: string; channels: Array<"in_app" | "wechat_adapter">; deliveryStatus: "delivered"; createdAt: string;
  readAt?: string; actionRoute: string; actionLabel: string; scenarioId: typeof HARDSHIP_VIDEO_SCENARIO_ID;
}
export interface HardshipVideoCounselorTaskProjection {
  id: string; title: string; type: string; assignedRole: "COUNSELOR"; departmentId: string; classId: string; scope: string;
  studentCount: number; dueAt: string; priority: "high"; status: "pending" | "completed"; description: string; version: number; completedAt?: string;
  scenarioId: typeof HARDSHIP_VIDEO_SCENARIO_ID; applicationId: string; externalActionRoute: string;
}
export interface HardshipVideoStudentCaseProjection {
  id: string; studentCode: string; college: string; departmentId: string; className: string; classId: string; project: string;
  materialCompleteness: number; status: string; riskFlags: string[]; lastContact: string; aidHistory: string; followUp: string;
}
interface BusinessEvent { id: string; stageId: HardshipVideoStageId | "reset"; actorId: string; actorRole: RoleCode | "SYSTEM"; title: string; detail: string; createdAt: string }
interface BusinessState {
  schemaVersion: 1; scenarioId: typeof HARDSHIP_VIDEO_SCENARIO_ID; revision: number;
  lifecycle: "ready" | "notice_published" | "application_submitted" | "precheck_completed";
  notice?: HardshipVideoNoticeProjection; application?: HardshipVideoApplicationProjection;
  materials: HardshipVideoMaterialProjection[]; precheck?: HardshipVideoPrecheckProjection; ticket?: HardshipVideoTicketProjection;
  counselorTask?: HardshipVideoCounselorTaskProjection; studentCase?: HardshipVideoStudentCaseProjection;
  notices: HardshipVideoNoticeProjection[]; events: BusinessEvent[]; processedKeys: Array<{ scope: string; stageId: HardshipVideoStageId; createdAt: string }>;
  updatedAt: string;
}
export interface HardshipVideoStageExecutionResult {
  success: boolean; code: string; message: string; affectedRows: number; outputs: string[];
  businessObjects: Array<{ type: string; id: string; label: string; status: string; route: string; sensitivity: string; syncStatus: "pending" | "synced" | "blocked" }>;
}

type GlobalState = typeof globalThis & { __jhxtHardshipVideoBusiness?: BusinessState };
const globalState = globalThis as GlobalState;
const stateFile = join(process.cwd(), ".runtime", "hardship-video-business.json");
function now() { return new Date().toISOString(); }
function clone<T>(value: T): T { return structuredClone(value); }
function revisionCode(revision: number) { return String(revision).padStart(3, "0"); }
function initialState(revision: number, actorId = "system-migration", at = now()): BusinessState {
  return { schemaVersion: 1, scenarioId: HARDSHIP_VIDEO_SCENARIO_ID, revision, lifecycle: "ready", materials: [], notices: [], events: [{ id: `VIDEO-EVT-${revisionCode(revision)}-RESET`, stageId: "reset", actorId, actorRole: "SYSTEM", title: "视频业务场景已复位", detail: "通知、申请、预检、工单和岗位待办均恢复为未生成状态。", createdAt: at }], processedKeys: [], updatedAt: at };
}
function persist(state: BusinessState) { mkdirSync(dirname(stateFile), { recursive: true }); writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8"); }
function loadState(): BusinessState {
  if (globalState.__jhxtHardshipVideoBusiness) return globalState.__jhxtHardshipVideoBusiness;
  let state: BusinessState | null = null;
  if (existsSync(stateFile)) { try { const parsed = JSON.parse(readFileSync(stateFile, "utf8")) as BusinessState; if (parsed?.scenarioId === HARDSHIP_VIDEO_SCENARIO_ID && parsed.schemaVersion === 1) state = parsed; } catch { state = null; } }
  state ??= initialState(1); globalState.__jhxtHardshipVideoBusiness = state; persist(state); return state;
}
export function ensureHardshipVideoBusinessRevision(revision: number) { const state = loadState(); if (state.revision !== revision) resetHardshipVideoBusiness(revision, "system-scenario-sync"); }
export function resetHardshipVideoBusiness(revision: number, actorId: string, at = now()) { const state = initialState(revision, actorId, at); globalState.__jhxtHardshipVideoBusiness = state; clearHardshipVideoReview(actorId, HARDSHIP_VIDEO_SCENARIO_ID, revision, at); clearHardshipVideoDisbursement(actorId, HARDSHIP_VIDEO_SCENARIO_ID, revision, at); persist(state); return clone(state); }
function expectedRole(stageId: HardshipVideoStageId): RoleCode { const roles: Record<HardshipVideoStageId, RoleCode> = { notice: "FUND_ADMIN", apply: "STUDENT", precheck: "FUND_ADMIN", counselor: "COUNSELOR", department: "DEPT_ADMIN", school: "FUND_ADMIN", leader: "SCHOOL_LEADER", finance: "FINANCE", bank: "BANK", reconcile: "FINANCE" }; return roles[stageId]; }
function reviewContext(state: BusinessState): HardshipVideoReviewContext | null { return state.application && state.ticket ? { scenarioId: HARDSHIP_VIDEO_SCENARIO_ID, revision: state.revision, applicationId: state.application.id, ticketId: state.ticket.id, projectName: state.application.projectName, precheckId: state.precheck?.id, materialIds: state.materials.map(item => item.id), baselineApplicationVersion: state.application.version, baselineTicketVersion: state.ticket.version } : null; }
function disbursementContext(state: BusinessState): HardshipVideoDisbursementContext | null { const review = getHardshipVideoReviewStatus(); return state.application && review?.financeTaskId && review.status === "待发放" ? { scenarioId: HARDSHIP_VIDEO_SCENARIO_ID, revision: state.revision, applicationId: state.application.id, projectName: state.application.projectName, amount: state.application.requestedAmount, financeTaskId: review.financeTaskId, baselineApplicationVersion: review.applicationVersion, bankAccountLast4: state.application.bankAccountLast4 } : null; }
function businessObjects(state: BusinessState): HardshipVideoStageExecutionResult["businessObjects"] {
  const review = state.application ? getHardshipVideoReviewApplicationOverlay(state.application.id) : null;
  const disbursement = state.application ? getHardshipVideoDisbursementApplicationOverlay(state.application.id) : null;
  const applicationStatus = disbursement?.status ?? review?.status ?? (state.precheck ? "待辅导员初审" : state.application ? "待智能受理" : "尚未生成");
  const reviewObjects = getHardshipVideoReviewBusinessObjects(reviewContext(state) ?? undefined).filter(item => item.type !== "finance_task");
  return [
    { type: "policy", id: "policy-emergency-aid-2026", label: "学生临时困难补助管理办法", status: "场景基准已锁定", route: "/funding/management", sensitivity: "P0", syncStatus: "synced" },
    { type: "project", id: "project-video-hardship-2026", label: "2026秋季临时困难补助（视频场景）", status: state.notice ? "通知已发布" : "待发布通知", route: `/funding/management?scenario=${HARDSHIP_VIDEO_SCENARIO_ID}`, sensitivity: "P1", syncStatus: state.notice ? "synced" : "pending" },
    { type: "application", id: state.application?.id ?? "VIDEO-APP-PENDING", label: state.application ? "临时困难补助申请（李*）" : "学生申请（将在提交后生成）", status: applicationStatus, route: state.application ? `/application/detail?id=${state.application.id}` : `/application/create?scenario=${HARDSHIP_VIDEO_SCENARIO_ID}`, sensitivity: "P3·模拟数据", syncStatus: state.application ? "synced" : "pending" },
    { type: "intake_ticket", id: state.ticket?.id ?? "VIDEO-TICKET-PENDING", label: state.ticket ? "申请受理工单" : "受理工单（预检后生成）", status: state.ticket ? (getHardshipVideoReviewStatus()?.ticketStatus === "closed" ? "已关闭" : "岗位队列") : "尚未生成", route: state.ticket ? `/application/intake/${state.ticket.id}` : "/application/intake", sensitivity: "P2", syncStatus: state.ticket ? "synced" : "pending" },
    ...reviewObjects,
    ...getHardshipVideoDisbursementBusinessObjects(disbursementContext(state) ?? undefined),
  ];
}
function output(state: BusinessState, code: string, message: string, affectedRows: number, outputs: string[]): HardshipVideoStageExecutionResult { return { success: true, code, message, affectedRows, outputs, businessObjects: businessObjects(state) }; }
function event(state: BusinessState, stageId: HardshipVideoStageId, actor: ActorContext, title: string, detail: string) { state.events.push({ id: `VIDEO-EVT-${revisionCode(state.revision)}-${stageId.toUpperCase()}-${state.events.length + 1}`, stageId, actorId: actor.userId, actorRole: actor.role, title, detail, createdAt: now() }); }
export function executeHardshipVideoBusinessStage(actor: ActorContext, stageId: HardshipVideoStageId, revision: number, runId: string, key: string, humanComment?: string): HardshipVideoStageExecutionResult {
  ensureHardshipVideoBusinessRevision(revision); const state = loadState(); const role = expectedRole(stageId);
  if (actor.role !== role) return { success: false, code: "VIDEO_STAGE_ROLE_DENIED", message: `节点${stageId}必须由${role}执行。`, affectedRows: 0, outputs: [], businessObjects: businessObjects(state) };
  const scope = `${actor.userId}:${runId}:${key}`; if (state.processedKeys.some(item => item.scope === scope && item.stageId === stageId)) return output(state, "IDEMPOTENT_REPLAY", "该业务阶段已执行，本次返回原投影。", 0, [state.notice?.id, state.application?.id, state.precheck?.id, state.ticket?.id].filter((item): item is string => Boolean(item)));
  if (["counselor", "department", "school", "leader"].includes(stageId)) { const context = reviewContext(state); if (!context) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: "申请或受理工单尚未生成，不能执行四级审核。", affectedRows: 0, outputs: [], businessObjects: businessObjects(state) }; const result = executeHardshipVideoReviewStage(actor, stageId as HardshipVideoReviewStageId, context, runId, key, humanComment ?? "已核对业务事实、证据引用和岗位责任，同意进入下一节点。"); return { ...result, businessObjects: businessObjects(state) }; }
  if (["finance", "bank", "reconcile"].includes(stageId)) { const context = disbursementContext(state); if (!context) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: "校领导审批或财务交接任务尚未完成，不能执行资金链路。", affectedRows: 0, outputs: [], businessObjects: businessObjects(state) }; const result = executeHardshipVideoDisbursementStage(actor, stageId as HardshipVideoDisbursementStageId, context, runId, key, humanComment); return { ...result, businessObjects: businessObjects(state) }; }
  const at = now(); const rev = revisionCode(revision);
  if (stageId === "notice") {
    state.notice = { id: `VIDEO-NOTICE-${rev}`, recipientId: "demo-student", applicationId: "VIDEO-APP-PENDING", ticketId: "VIDEO-TICKET-PENDING", type: "announcement", title: "2026秋季临时困难补助开始申请", content: "如因重大疾病、自然灾害或家庭突发变故造成临时困难，可于规定时间内在线提交申请。小海豚将协助检查材料，但最终审核由责任岗位完成。", channels: ["in_app", "wechat_adapter"], deliveryStatus: "delivered", createdAt: at, actionRoute: `/application/create?scenario=${HARDSHIP_VIDEO_SCENARIO_ID}`, actionLabel: "立即申请", scenarioId: HARDSHIP_VIDEO_SCENARIO_ID };
    state.notices = [state.notice]; state.lifecycle = "notice_published"; event(state, stageId, actor, "资助通知已发布", "通知已定向投递给视频场景学生李明，并生成站内信与微信适配器投递记录。");
  } else if (stageId === "apply") {
    if (!state.notice) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: "资助通知尚未发布，不能提交申请。", affectedRows: 0, outputs: [], businessObjects: businessObjects(state) };
    const appId = `VIDEO-APP-${rev}`; const receipt = `VIDEO-RCP-${rev}`;
    state.materials = [
      { id: `VIDEO-MAT-${rev}-01`, name: "临时困难情况说明.pdf", type: "PDF结构化材料", status: "verified", completeness: 100, source: "材料解析插件 · 文本层/版面/实体抽取", sizeBytes: 184320, sha256: `sha256:video${rev}a1f09c0d4e8b`, submittedAt: at, processingStatus: "completed", detailPath: `/application/materials/VIDEO-MAT-${rev}-01` },
      { id: `VIDEO-MAT-${rev}-02`, name: "住院费用结算凭证.jpg", type: "图像材料", status: "verified", completeness: 100, source: "OCR模拟适配器 · 学生已核对字段", sizeBytes: 326400, sha256: `sha256:video${rev}b281cc98f310`, submittedAt: at, processingStatus: "completed", detailPath: `/application/materials/VIDEO-MAT-${rev}-02` },
      { id: `VIDEO-MAT-${rev}-03`, name: "家庭经济情况授权核验", type: "数据授权", status: "verified", completeness: 100, source: "学生明示授权 · 最小必要字段", sizeBytes: 1024, sha256: `sha256:video${rev}c6f78aa20d4b`, submittedAt: at, processingStatus: "completed", detailPath: `/application/materials/VIDEO-MAT-${rev}-03` },
    ];
    state.application = { id: appId, studentName: "李明", studentNo: "2024001001", ownerId: "demo-student", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", projectName: "2026秋季临时困难补助", requestedAmount: 2000, status: "待辅导员初审", riskLevel: "中", materialCompleteness: 100, submittedAt: at, overdue: false, version: 1, updatedAt: at, lastComment: "学生本人确认表单、三项材料摘要和数据授权范围后提交。", submissionChannel: "web", materialSubmissionMethod: "mixed", academicYear: "2026-2027", semester: "第一学期", applicantStatement: "家庭成员突发重大疾病产生集中医疗支出，短期生活与学习费用承压，申请临时困难补助。", familyAnnualIncome: 36000, familyMembers: 4, specialCircumstance: "家庭成员重大疾病，已提交医疗费用凭证。", bankName: "中国建设银行", bankAccountLast4: "6628", materialCount: 3, materialVerifiedCount: 3, submissionReceiptNo: receipt, authorizationSources: ["student-status", "low-income-registry"], precheckWarnings: [], precheckWaiverConfirmed: true, scenarioId: HARDSHIP_VIDEO_SCENARIO_ID, scenarioRevision: revision };
    state.notice.applicationId = appId; state.notice.actionRoute = `/application/detail?id=${appId}`; state.notice.actionLabel = "查看申请";
    state.notices.unshift({ id: `VIDEO-RECEIPT-${rev}`, recipientId: "demo-student", applicationId: appId, ticketId: "VIDEO-TICKET-PENDING", type: "receipt", title: "临时困难补助申请已提交", content: `申请${appId}已提交，材料解析插件完成3项材料处理，正在进入规则与AI预检。`, channels: ["in_app", "wechat_adapter"], deliveryStatus: "delivered", createdAt: at, actionRoute: `/application/detail?id=${appId}`, actionLabel: "查看申请", scenarioId: HARDSHIP_VIDEO_SCENARIO_ID });
    state.lifecycle = "application_submitted"; event(state, stageId, actor, "学生申请已提交", `生成申请${appId}、回执${receipt}和3项材料解析结果。`);
  } else {
    if (!state.application) return { success: false, code: "VIDEO_PRECONDITION_FAILED", message: "学生申请尚未提交，不能执行材料预检。", affectedRows: 0, outputs: [], businessObjects: businessObjects(state) };
    const preId = `VIDEO-PRE-${rev}`, ticketId = `VIDEO-INTAKE-${rev}`, taskId = `VIDEO-TASK-COUNSELOR-${rev}`;
    state.precheck = { id: preId, applicationId: state.application.id, projectCode: "PRJ-VIDEO-EMG-2026", score: 96, requiredDocuments: ["临时困难情况说明", "医疗费用佐证", "家庭经济情况授权"], evidenceCount: 3, missingCount: 0, warnings: ["医疗支出原件由辅导员在初审阶段人工核对"], blockers: [], requiresWaiver: false, waiverConfirmed: true, status: "passed", disclaimer: "材料预检Skill只检查完整性、一致性和低置信字段，不形成困难等级或审批结论。", generatedAt: at, aiAdvice: { status: "completed", modelUsed: false, model: "material-precheck-skill-v3", summary: "三类必需材料齐全，文件签名、版面分类和金额摘要一致；建议辅导员重点核验医疗票据原件。", suggestions: ["核验医疗票据原件与申请陈述时间范围", "谈话时确认突发支出对当前学习生活的实际影响"], caution: "本结果为辅助预检，不代表审核通过。", generatedAt: at } };
    const due = new Date(new Date(at).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    state.ticket = { id: ticketId, applicationId: state.application.id, ownerId: "demo-student", campusId: "campus-main", departmentId: "dept-agri", classId: "class-agri-01", projectName: state.application.projectName, receiptNo: state.application.submissionReceiptNo, status: "queued", priority: "high", handlerRole: "COUNSELOR", dueAt: due, issues: [], precheckReportId: preId, version: 1, createdAt: at, updatedAt: at, timeline: [{ id: `VIDEO-TL-${rev}-01`, action: "precheck_completed", title: "材料预检完成并进入辅导员队列", detail: "预检96分，无阻断项；医疗凭证原件需辅导员人工核验。", actorId: "fund_admin-agent-4", actorRole: "FUND_ADMIN", createdAt: at }, { id: `VIDEO-TL-${rev}-00`, action: "submitted", title: "学生在线提交申请", detail: "表单、三项材料与授权摘要已绑定。", actorId: "demo-student", actorRole: "STUDENT", createdAt: state.application.submittedAt }] };
    state.counselorTask = { id: taskId, title: "临时困难补助申请初审", type: "场景业务待办", assignedRole: "COUNSELOR", departmentId: "dept-agri", classId: "class-agri-01", scope: "农学2401班 · 李明", studentCount: 1, dueAt: due, priority: "high", status: "pending", description: `申请${state.application.id}材料预检96分，请核验医疗票据原件并形成初审意见。`, version: 1, scenarioId: HARDSHIP_VIDEO_SCENARIO_ID, applicationId: state.application.id, externalActionRoute: `/agent/monitor/collaboration?scenario=${HARDSHIP_VIDEO_SCENARIO_ID}` };
    state.studentCase = { id: `VIDEO-CASE-${rev}`, studentCode: "农学·24***01", college: "农学院", departmentId: "dept-agri", className: "农学2401班", classId: "class-agri-01", project: state.application.projectName, materialCompleteness: 100, status: "待辅导员初审", riskFlags: ["医疗支出原件待人工核验"], lastContact: at.slice(0, 10), aidHistory: "本学年首次临时补助申请", followUp: "通过场景人工闸门完成初审" };
    state.application.precheckReportId = preId; state.application.precheckScore = 96; state.application.precheckWarnings = [...state.precheck.warnings]; state.application.intakeTicketId = ticketId; state.application.updatedAt = at; state.application.version += 1; state.application.lastComment = "材料预检Skill完成，受理工单与辅导员待办已生成。";
    state.notices = state.notices.map(item => ({ ...item, ticketId })); state.notices.unshift({ id: `VIDEO-PROGRESS-${rev}`, recipientId: "demo-student", applicationId: state.application.id, ticketId, type: "progress", title: "材料预检完成，进入辅导员初审", content: `预检报告${preId}已生成，工单${ticketId}已进入辅导员队列。AI结果仅供辅助，最终由责任岗位审核。`, channels: ["in_app", "wechat_adapter"], deliveryStatus: "delivered", createdAt: at, actionRoute: `/application/intake/${ticketId}`, actionLabel: "查看受理工单", scenarioId: HARDSHIP_VIDEO_SCENARIO_ID });
    state.lifecycle = "precheck_completed"; const context = reviewContext(state); if (context) resetHardshipVideoReview(context, actor.userId, at); event(state, stageId, actor, "智能受理完成", `预检${preId}、工单${ticketId}和辅导员待办${taskId}已同源生成。`);
  }
  state.processedKeys.push({ scope, stageId, createdAt: at }); state.processedKeys = state.processedKeys.slice(-50); state.updatedAt = at; persist(state);
  const outputs = stageId === "notice" ? [state.notice!.id] : stageId === "apply" ? [state.application!.id, ...state.materials.map(item => item.id)] : [state.precheck!.id, state.ticket!.id, state.counselorTask!.id];
  return output(state, "VIDEO_BUSINESS_STAGE_COMPLETED", stageId === "notice" ? "资助通知已发布并送达学生通知中心。" : stageId === "apply" ? "学生申请、回执和材料解析结果已生成。" : "材料预检、受理工单和辅导员待办已生成。", outputs.length, outputs);
}
export function getHardshipVideoBusinessObjects(revision: number) { ensureHardshipVideoBusinessRevision(revision); return businessObjects(loadState()); }
export function getHardshipVideoApplicationProjection() { const item = loadState().application; if (!item) return null; const reviewOverlay = getHardshipVideoReviewApplicationOverlay(item.id); const disbursementOverlay = getHardshipVideoDisbursementApplicationOverlay(item.id); return clone({ ...item, ...(reviewOverlay ?? {}), ...(disbursementOverlay ?? {}) }); }
export function getHardshipVideoMaterialProjections(applicationId: string) { const state = loadState(); return state.application?.id === applicationId ? state.materials.map(clone) : []; }
export function getHardshipVideoMaterialDetail(materialId: string) {
  const state = loadState(); const item = state.materials.find(row => row.id === materialId); if (!item || !state.application) return null;
  const isImage = item.name.endsWith(".jpg");
  return { material: { id: item.id, applicationId: state.application.id, ownerId: state.application.ownerId, name: item.name, mimeType: isImage ? "image/jpeg" : item.name.endsWith(".pdf") ? "application/pdf" : "application/json", sizeBytes: item.sizeBytes, sha256: item.sha256.replace("sha256:", ""), uploadedAt: item.submittedAt }, processing: { id: `VIDEO-OCR-${item.id}`, materialId: item.id, ownerId: state.application.ownerId, applicationId: state.application.id, status: "completed", parserAdapter: isImage ? "video-ocr-adapter-v1" : "native-document-parser-v3", mimeType: isImage ? "image/jpeg" : "application/pdf", pageCount: 1, extractedTextPreview: isImage ? "住院费用结算凭证：已抽取日期、费用类别和脱敏金额摘要，学生已核对。" : "临时困难情况说明：家庭成员突发重大疾病导致集中医疗支出，申请临时困难补助。", extractedFields: [{ key: "document_type", label: "材料类型", value: item.type, confidence: .96, confirmed: true, source: "文件名、版面与文本语义分类" }, { key: "document_date", label: "材料日期", value: "2026-07-28", confidence: .91, confirmed: true, source: "日期实体抽取" }, ...(isImage ? [{ key: "amount", label: "费用金额", value: "****.00元", confidence: .89, confirmed: true, source: "金额实体规则（已脱敏）" }] : [])], classification: { label: isImage ? "医疗支出类" : "突发事件类", confidence: isImage ? .94 : .92 }, stages: [{ code: "signature", name: "文件签名与MIME复核", status: "passed", detail: `${isImage ? "JPEG" : "PDF"}魔数与声明类型一致；SHA-256摘要已冻结。` }, { code: "malware", name: "恶意特征扫描", status: "passed", detail: "确定性恶意特征扫描通过。" }, { code: "ocr", name: "OCR / 文本抽取", status: "completed", detail: isImage ? "OCR模拟适配器完成识别，关键字段已由学生核对。" : "从PDF文本层提取正文。" }, { code: "layout", name: "版面分析", status: "completed", detail: "识别标题、正文和凭证字段区。" }, { code: "entity", name: "实体抽取", status: "completed", detail: "日期、材料类型和金额摘要已结构化，敏感金额脱敏。" }, { code: "classification", name: "材料分类", status: "completed", detail: `${isImage ? "医疗支出类" : "突发事件类"}，置信度超过90%。` }], startedAt: item.submittedAt, completedAt: item.submittedAt, confirmedAt: item.submittedAt, confirmedBy: state.application.ownerId, version: 1 }, permission: { canConfirm: false, rawObjectDownload: false, reason: "视频场景展示结构化解析结果；原始材料对象不对管理岗位开放。" } };
}
export function getHardshipVideoPrecheckProjection(applicationId: string) { const state = loadState(); return state.application?.id === applicationId && state.precheck ? clone(state.precheck) : null; }
export function getHardshipVideoEligibilityProjection(applicationId: string) {
  const state = loadState(); if (state.application?.id !== applicationId) return null; const generatedAt = state.application.submittedAt;
  return { id: `VIDEO-ELG-${revisionCode(state.revision)}`, applicationId, generatedAt, project: { code: "temporary_aid", name: "临时困难补助", maximumAmount: 5000, defaultAmount: 2000, applicationStart: "2026-01-01", applicationEnd: "2026-12-31", requiredDocuments: ["临时困难情况说明", "医疗费用佐证", "家庭经济情况授权"], criteria: "发生疾病、灾害或家庭突发变故并提交可核验证据。", policyRef: "POL-EMERGENCY-AID-2026", active: true }, allowed: true, checks: [{ code: "IDENTITY_AUTHENTICATED", label: "身份与学籍", status: "passed", detail: "统一身份已认证，学籍模拟适配器返回全日制在籍。", source: "统一身份认证 / 学籍适配器" }, { code: "PROJECT_ACTIVE", label: "项目状态", status: "passed", detail: "视频场景项目已定向发布。", source: "POL-EMERGENCY-AID-2026" }, { code: "AMOUNT_LIMIT", label: "申请金额", status: "passed", detail: "申请2000元，未超过5000元项目上限。", source: "项目确定性金额规则" }, { code: "DUPLICATE_ACTIVE_APPLICATION", label: "同类在途申请", status: "passed", detail: "未发现本学年同项目在途申请。", source: "场景业务唯一性规则" }], blockingCodes: [], warningCodes: [], disclaimer: "资格报告只执行确定性规则，最终资助决定由责任岗位人工完成。" };
}
export function getHardshipVideoTicketProjection(ticketId: string) { const item = loadState().ticket; if (item?.id !== ticketId) return null; const overlay = getHardshipVideoReviewTicketOverlay(ticketId); return overlay ? clone({ ...item, ...overlay, timeline: [...overlay.timeline, ...item.timeline] }) : clone(item); }
export function listHardshipVideoTicketProjections(applicationIds: readonly string[]) { const item = loadState().ticket; if (!item || !applicationIds.includes(item.applicationId)) return []; const overlay = getHardshipVideoReviewTicketOverlay(item.id); return [overlay ? clone({ ...item, ...overlay, timeline: [...overlay.timeline, ...item.timeline] }) : clone(item)]; }
export function listHardshipVideoNotices(actor: ActorContext) { if (actor.role !== "STUDENT") return []; return [...listHardshipVideoDisbursementNotices(actor), ...listHardshipVideoReviewNotices(actor), ...loadState().notices.filter(item => item.recipientId === actor.userId).map(clone)]; }
export function markHardshipVideoNoticeRead(actor: ActorContext, noticeId: string) { const disbursementNotice = markHardshipVideoDisbursementNoticeRead(actor, noticeId); if (disbursementNotice) return disbursementNotice; const reviewNotice = markHardshipVideoReviewNoticeRead(actor, noticeId); if (reviewNotice) return reviewNotice; const state = loadState(); if (actor.role !== "STUDENT") return null; const item = state.notices.find(row => row.id === noticeId && row.recipientId === actor.userId); if (!item) return null; item.readAt ??= now(); persist(state); return clone(item); }
export function getHardshipVideoCounselorTaskProjection() { const item = loadState().counselorTask; if (!item) return null; const review = getHardshipVideoReviewProjections(item.applicationId).find(row => row.stageId === "counselor"); return review ? clone({ ...item, status: "completed" as const, version: item.version + 1, completedAt: review.completedAt }) : clone(item); }
export function getHardshipVideoStudentCaseProjection() { const state = loadState(); const item = state.studentCase; if (!item) return null; const reviewOverlay = state.application ? getHardshipVideoReviewStudentOverlay(state.application.id) : null; const disbursementOverlay = state.application ? getHardshipVideoDisbursementStudentOverlay(state.application.id) : null; return clone({ ...item, ...(reviewOverlay ?? {}), ...(disbursementOverlay ?? {}) }); }
export function getHardshipVideoBusinessStatus() { const state = loadState(); return { scenarioId: state.scenarioId, revision: state.revision, lifecycle: state.lifecycle, noticeId: state.notice?.id, applicationId: state.application?.id, precheckId: state.precheck?.id, ticketId: state.ticket?.id, counselorTaskId: state.counselorTask?.id, review: getHardshipVideoReviewStatus(), disbursement: getHardshipVideoDisbursementStatus(), events: state.events.length, updatedAt: state.updatedAt }; }
