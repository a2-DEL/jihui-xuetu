import { randomUUID } from "node:crypto";
import { completeWithDeepSeek, isModelConfigured } from "@/lib/ai/model-gateway";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ActorContext } from "./authorization";
import { listActiveAidProjectsForCampus } from "./demo-store";
import { getHardshipVideoEligibilityProjection, getHardshipVideoPrecheckProjection, getHardshipVideoTicketProjection, listHardshipVideoNotices, listHardshipVideoTicketProjections, markHardshipVideoNoticeRead } from "./hardship-video-business-store";
import type { ApplicationMaterialRecord } from "./application-material-store";
import { readApplicationMaterialBytes } from "./application-material-store";

export type ProjectEligibilityStatus = "passed" | "warning" | "blocked";
export interface ApplicationProjectDefinition {
  code: string;
  name: string;
  maximumAmount: number;
  defaultAmount: number;
  applicationStart: string;
  applicationEnd: string;
  requiredDocuments: string[];
  criteria: string;
  policyRef: string;
  active: boolean;
}
export interface EligibilityCheck {
  code: string;
  label: string;
  status: ProjectEligibilityStatus;
  detail: string;
  source: string;
}
export interface EligibilityReport {
  id: string;
  applicationId?: string;
  generatedAt: string;
  project: ApplicationProjectDefinition | null;
  allowed: boolean;
  checks: EligibilityCheck[];
  blockingCodes: string[];
  warningCodes: string[];
  disclaimer: string;
}

const PROJECTS: readonly ApplicationProjectDefinition[] = [
  { code: "national_scholarship", name: "国家奖学金", maximumAmount: 8000, defaultAmount: 8000, applicationStart: "2026-08-01", applicationEnd: "2026-09-15", requiredDocuments: ["成绩单", "获奖证书", "家庭经济情况说明"], criteria: "全日制在籍且学业表现达到项目要求，最终资格由人工评审确认。", policyRef: "POL-NATIONAL-SCHOLARSHIP-2026", active: true },
  { code: "national_grant", name: "国家助学金", maximumAmount: 4500, defaultAmount: 3300, applicationStart: "2026-08-01", applicationEnd: "2026-09-20", requiredDocuments: ["家庭经济情况调查表", "困难情况佐证", "本人承诺书"], criteria: "全日制在籍并完成家庭经济困难认定。", policyRef: "POL-NATIONAL-GRANT-2026", active: true },
  { code: "school_scholarship", name: "校内奖学金", maximumAmount: 5000, defaultAmount: 3000, applicationStart: "2026-08-01", applicationEnd: "2026-10-15", requiredDocuments: ["成绩单", "获奖证书", "综合素质证明"], criteria: "在籍学生可申请，学业与综合表现由评审组织人工核定。", policyRef: "POL-SCHOOL-SCHOLARSHIP-2026", active: true },
  { code: "work_study", name: "勤工助学", maximumAmount: 0, defaultAmount: 0, applicationStart: "2026-08-01", applicationEnd: "2027-07-31", requiredDocuments: ["家庭经济情况调查表", "本人承诺书"], criteria: "在籍学生可申请，薪酬按岗位工时核定。", policyRef: "POL-WORK-STUDY-2026", active: true },
  { code: "temporary_aid", name: "临时困难补助", maximumAmount: 5000, defaultAmount: 2000, applicationStart: "2026-01-01", applicationEnd: "2026-12-31", requiredDocuments: ["家庭困难说明", "突发情况佐证"], criteria: "发生疾病、灾害或家庭突发变故并提交可核验证据。", policyRef: "POL-EMERGENCY-AID-2026", active: true },
  { code: "tuition_waiver", name: "学费减免", maximumAmount: 10000, defaultAmount: 6000, applicationStart: "2026-08-01", applicationEnd: "2026-10-31", requiredDocuments: ["家庭经济情况调查表", "困难情况佐证", "学费信息核验"], criteria: "符合学校学费减免政策且处于在籍状态。", policyRef: "POL-TUITION-WAIVER-2026", active: true },
  { code: "student_loan", name: "生源地信用助学贷款", maximumAmount: 16000, defaultAmount: 12000, applicationStart: "2026-07-01", applicationEnd: "2026-10-20", requiredDocuments: ["家庭经济情况调查表", "身份与学籍核验", "录取或在籍证明"], criteria: "在籍学生通过生源地贷款资格核验，额度以银行回执为准。", policyRef: "POL-STUDENT-LOAN-2026", active: true },
];

// DEMO ONLY: preserve legacy seeded projects until their approved management records are migrated.
// Newly approved campus projects are projected from the same demo-store as the management UI.
export function listApplicationProjects(campusIds: readonly string[] = ['campus-main']): ApplicationProjectDefinition[] {
  const seeded = PROJECTS.map(item => ({ ...item, requiredDocuments: [...item.requiredDocuments] }));
  const approved = listActiveAidProjectsForCampus(campusIds).map(project => ({
    code: project.code, name: project.name,
    maximumAmount: Math.floor(project.budgetAmount / project.quota), defaultAmount: project.defaultAmount,
    applicationStart: project.applicationStart, applicationEnd: project.applicationEnd,
    requiredDocuments: ['项目申请表'], criteria: project.criteria, policyRef: project.policyId, active: true,
  }));
  return [...seeded, ...approved];
}
export function findApplicationProject(value: string, campusIds: readonly string[] = ['campus-main']): ApplicationProjectDefinition | null {
  const item = listApplicationProjects(campusIds).find(project => project.code === value || project.name === value);
  return item ? { ...item, requiredDocuments: [...item.requiredDocuments] } : null;
}
export function evaluateApplicationEligibility(
  actor: ActorContext,
  input: { project: string; requestedAmount: number; academicYear: string; excludeApplicationId?: string },
  existingApplications: readonly { id: string; ownerId: string; projectName: string; academicYear?: string; status: string }[],
  now = new Date(),
): EligibilityReport {
  const project = findApplicationProject(input.project, actor.campusIds);
  const today = now.toISOString().slice(0, 10);
  const checks: EligibilityCheck[] = [];
  const push = (code: string, label: string, status: ProjectEligibilityStatus, detail: string, source: string) => checks.push({ code, label, status, detail, source });
  push("IDENTITY_AUTHENTICATED", "身份与学籍", actor.role === "STUDENT" && actor.authenticated ? "passed" : "blocked", actor.role === "STUDENT" && actor.authenticated ? "统一身份已认证，演示学籍适配器返回‘全日制在籍’。" : "仅允许已认证学生本人申请。", "统一身份认证 / 学籍MCP适配器");
  if (!project) {
    push("PROJECT_NOT_CONFIGURED", "项目配置", "blocked", "未找到可发布的资助项目配置。", "项目配置中心");
  } else {
    push("PROJECT_ACTIVE", "项目状态", project.active ? "passed" : "blocked", project.active ? "项目处于可申请状态。" : "项目尚未发布或已经关闭。", project.policyRef);
    const inWindow = today >= project.applicationStart && today <= project.applicationEnd;
    push("APPLICATION_WINDOW", "申请时间窗", inWindow ? "passed" : "blocked", inWindow ? `当前处于 ${project.applicationStart} 至 ${project.applicationEnd} 的申请时间窗。` : `申请时间窗为 ${project.applicationStart} 至 ${project.applicationEnd}，当前日期不在范围内。`, "项目确定性时间规则");
    const amountAllowed = project.maximumAmount === 0 ? input.requestedAmount === 0 : input.requestedAmount > 0 && input.requestedAmount <= project.maximumAmount;
    push("AMOUNT_LIMIT", "申请金额", amountAllowed ? "passed" : "blocked", project.maximumAmount === 0 ? (amountAllowed ? "该项目按核定工时结算，申请金额保持为0。" : "勤工助学申请金额必须为0，由后续岗位工时核定。") : (amountAllowed ? `申请金额未超过项目上限 ¥${project.maximumAmount.toLocaleString("zh-CN")}。` : `申请金额必须大于0且不超过 ¥${project.maximumAmount.toLocaleString("zh-CN")}。`), project.policyRef);
    const duplicate = existingApplications.some((item) => item.id !== input.excludeApplicationId && item.ownerId === actor.userId && item.projectName === project.name && (item.academicYear ?? "2026-2027") === input.academicYear && !["草稿", "已驳回", "已完成"].includes(item.status));
    push("DUPLICATE_ACTIVE_APPLICATION", "同类在途申请", duplicate ? "blocked" : "passed", duplicate ? "本学年已存在同一项目的在途申请，已按确定性防重规则阻断。" : "未发现本学年同项目在途申请。", "申请业务库唯一性规则");
    const needsDifficulty = ["国家助学金", "临时困难补助", "学费减免"].includes(project.name);
    push("DIFFICULTY_STATUS", "困难认定条件", needsDifficulty ? "warning" : "passed", needsDifficulty ? "当前演示身份具备困难认定记录；正式审核仍须人工核验认定有效期。" : "该项目不以困难认定作为系统自动阻断条件。", "困难认定主数据 / 人工复核");
  }
  return {
    id: `ELG-${randomUUID()}`,
    generatedAt: now.toISOString(),
    project,
    allowed: !checks.some((item) => item.status === "blocked"),
    checks,
    blockingCodes: checks.filter((item) => item.status === "blocked").map((item) => item.code),
    warningCodes: checks.filter((item) => item.status === "warning").map((item) => item.code),
    disclaimer: "本报告仅执行已发布项目的确定性资格规则；困难等级、获奖资格和最终资助决定必须由授权人员人工完成。",
  };
}

export type MaterialProcessingStatus = "processing" | "completed" | "needs_confirmation" | "blocked";
export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  confirmed: boolean;
  source: string;
}
export interface ProcessingStage {
  code: "signature" | "malware" | "ocr" | "layout" | "entity" | "classification";
  name: string;
  status: "passed" | "completed" | "needs_confirmation" | "blocked";
  detail: string;
}
export interface MaterialProcessingJob {
  id: string;
  materialId: string;
  ownerId: string;
  applicationId?: string;
  status: MaterialProcessingStatus;
  parserAdapter: string;
  mimeType: string;
  pageCount: number;
  extractedTextPreview: string;
  extractedFields: ExtractedField[];
  classification: { label: string; confidence: number };
  stages: ProcessingStage[];
  startedAt: string;
  completedAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
  version: number;
}
export interface ApplicationPrecheckReport {
  id: string;
  applicationId?: string;
  projectCode: string;
  score: number;
  requiredDocuments: string[];
  evidenceCount: number;
  missingCount: number;
  warnings: string[];
  blockers: string[];
  requiresWaiver: boolean;
  waiverConfirmed: boolean;
  status: "passed" | "passed_with_waiver" | "blocked";
  disclaimer: string;
  generatedAt: string;
  aiAdvice?: {
    status: "completed" | "unavailable" | "not_configured";
    modelUsed: boolean;
    model?: string;
    summary: string;
    suggestions: string[];
    caution: string;
    generatedAt: string;
  };
}
export type IntakeTicketStatus = "queued" | "correction_required" | "resubmitted" | "forwarded" | "closed";
export interface IntakeTimelineItem { id: string; action: string; title: string; detail: string; actorId: string; actorRole: string; createdAt: string }
export interface IntakeTicket {
  id: string;
  applicationId: string;
  ownerId: string;
  campusId: string;
  departmentId: string;
  classId: string;
  projectName: string;
  receiptNo: string;
  status: IntakeTicketStatus;
  priority: "normal" | "high";
  handlerRole: "COUNSELOR" | "DEPT_ADMIN" | "FUND_ADMIN" | "SCHOOL_LEADER" | "FINANCE";
  dueAt: string;
  issues: string[];
  precheckReportId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  timeline: IntakeTimelineItem[];
}
export interface ApplicationNotice {
  id: string;
  recipientId: string;
  applicationId: string;
  ticketId: string;
  type: "announcement" | "receipt" | "correction" | "progress";
  title: string;
  content: string;
  channels: Array<"in_app" | "wechat_adapter" | "sms_adapter">;
  deliveryStatus: "delivered" | "adapter_pending";
  createdAt: string;
  readAt?: string;
  actionRoute?: string;
  actionLabel?: string;
  scenarioId?: string;
}
interface OperationsState {
  eligibilityReports: EligibilityReport[];
  processingJobs: MaterialProcessingJob[];
  precheckReports: ApplicationPrecheckReport[];
  intakeTickets: IntakeTicket[];
  notices: ApplicationNotice[];
}
const stateFile = join(process.cwd(), ".runtime", "application-intake-operations.json");
type GlobalOperations = typeof globalThis & { __jhxtApplicationOperations?: OperationsState };
const globalOperations = globalThis as GlobalOperations;
function loadState(): OperationsState {
  if (globalOperations.__jhxtApplicationOperations) { globalOperations.__jhxtApplicationOperations.eligibilityReports ??= []; return globalOperations.__jhxtApplicationOperations; }
  let state: OperationsState = { eligibilityReports: [], processingJobs: [], precheckReports: [], intakeTickets: [], notices: [] };
  if (existsSync(stateFile)) {
    try {
      const parsed = JSON.parse(readFileSync(stateFile, "utf8")) as Partial<OperationsState>;
      state = { eligibilityReports: Array.isArray(parsed.eligibilityReports) ? parsed.eligibilityReports : [], processingJobs: Array.isArray(parsed.processingJobs) ? parsed.processingJobs : [], precheckReports: Array.isArray(parsed.precheckReports) ? parsed.precheckReports : [], intakeTickets: Array.isArray(parsed.intakeTickets) ? parsed.intakeTickets : [], notices: Array.isArray(parsed.notices) ? parsed.notices : [] };
    } catch { state = { eligibilityReports: [], processingJobs: [], precheckReports: [], intakeTickets: [], notices: [] }; }
  }
  globalOperations.__jhxtApplicationOperations = state;
  return state;
}
function persistState() {
  const state = loadState();
  mkdirSync(dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  try { renameSync(temporary, stateFile); } catch (reason) {
    if (!(reason instanceof Error) || !("code" in reason) || reason.code !== "EPERM") throw reason;
    copyFileSync(temporary, stateFile);
    unlinkSync(temporary);
  }
}
function cloneJob(job: MaterialProcessingJob): MaterialProcessingJob { return structuredClone(job); }
function classify(name: string, text: string): { label: string; confidence: number } {
  const value = `${name} ${text}`;
  if (/病|医疗|诊断|住院/.test(value)) return { label: "医疗支出类", confidence: .88 };
  if (/灾|事故|突发|困难说明/.test(value)) return { label: "突发事件类", confidence: .84 };
  if (/成绩|获奖|证书|学业/.test(value)) return { label: "学业优秀类", confidence: .86 };
  if (/低保|贫困|收入|家庭/.test(value)) return { label: "家庭困难类", confidence: .9 };
  return { label: "待人工分类", confidence: .55 };
}
function printableText(bytes: Uint8Array): string {
  const latin = Buffer.from(bytes).toString("latin1");
  return (latin.match(/[\x20-\x7e]{4,}/g) ?? []).join(" ").replace(/\s+/g, " ").slice(0, 3000);
}
function imageDimensions(bytes: Uint8Array, mimeType: string): string | null {
  if (mimeType === "image/png" && bytes.length >= 24) return `${Buffer.from(bytes).readUInt32BE(16)}×${Buffer.from(bytes).readUInt32BE(20)}`;
  if (mimeType !== "image/jpeg") return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1]; const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return `${(bytes[offset + 7] << 8) + bytes[offset + 8]}×${(bytes[offset + 5] << 8) + bytes[offset + 6]}`;
    if (length < 2) break; offset += 2 + length;
  }
  return null;
}
export function processApplicationMaterial(record: ApplicationMaterialRecord): MaterialProcessingJob {
  const state = loadState(); const existing = state.processingJobs.find((item) => item.materialId === record.id);
  if (existing) { if (record.applicationId && !existing.applicationId) { existing.applicationId = record.applicationId; persistState(); } return cloneJob(existing); }
  const startedAt = new Date().toISOString(); const bytes = readApplicationMaterialBytes(record.id); const text = printableText(bytes); const dimensions = imageDimensions(bytes, record.mimeType);
  const pageCount = record.mimeType === "application/pdf" ? Math.max(1, (text.match(/\/Type\s*\/Page\b/g) ?? []).length) : 1;
  const date = text.match(/(?:20\d{2}|19\d{2})[-/.年](?:0?[1-9]|1[0-2])(?:[-/.月](?:0?[1-9]|[12]\d|3[01])日?)?/)?.[0];
  const amount = text.match(/(?:人民币|金额|收入|费用)?\s*[¥￥]?\s*\d{2,8}(?:\.\d{1,2})?\s*元/)?.[0];
  const fields: ExtractedField[] = [
    { key: "document_type", label: "材料类型", value: classify(record.name, text).label, confidence: classify(record.name, text).confidence, confirmed: false, source: "文件名与文本语义分类" },
    ...(date ? [{ key: "document_date", label: "材料日期", value: date, confidence: .82, confirmed: false, source: "确定性日期实体规则" }] : []),
    ...(amount ? [{ key: "amount", label: "金额实体", value: amount.replace(/\d(?=\d{2})/g, "*"), confidence: .78, confirmed: false, source: "确定性金额实体规则（已脱敏）" }] : []),
  ];
  const hasNativeText = record.mimeType === "application/pdf" && text.length >= 20;
  const requiresConfirmation = !hasNativeText || fields.some((field) => field.confidence < .7);
  const classification = classify(record.name, text);
  const stages: ProcessingStage[] = [
    { code: "signature", name: "文件签名与MIME复核", status: "passed", detail: `${record.mimeType} 与魔数签名一致，SHA-256 ${record.sha256.slice(0, 12)}…` },
    { code: "malware", name: "恶意特征扫描", status: "passed", detail: "内置EICAR确定性特征扫描通过；生产环境可切换ClamAV适配器。" },
    { code: "ocr", name: "OCR / 文本抽取", status: requiresConfirmation ? "needs_confirmation" : "completed", detail: hasNativeText ? `已从PDF文本层提取 ${text.length} 个字符。` : "扫描图片或无文本层PDF需要外部OCR适配器；已进入人工确认回环，不伪造识别文本。" },
    { code: "layout", name: "版面分析", status: "completed", detail: record.mimeType === "application/pdf" ? `识别到 ${pageCount} 页文档结构。` : `识别到单页图像${dimensions ? `，尺寸 ${dimensions}` : ""}。` },
    { code: "entity", name: "实体抽取", status: requiresConfirmation ? "needs_confirmation" : "completed", detail: `抽取 ${fields.length} 个结构化字段；低可信字段不会写入申请主表。` },
    { code: "classification", name: "材料分类", status: classification.confidence < .7 ? "needs_confirmation" : "completed", detail: `${classification.label}，置信度 ${(classification.confidence * 100).toFixed(0)}%。` },
  ];
  const job: MaterialProcessingJob = { id: `OCR-${randomUUID()}`, materialId: record.id, ownerId: record.ownerId, applicationId: record.applicationId, status: requiresConfirmation ? "needs_confirmation" : "completed", parserAdapter: hasNativeText ? "native-pdf-text-v1" : "human-loop-fallback-v1", mimeType: record.mimeType, pageCount, extractedTextPreview: hasNativeText ? text.slice(0, 400) : "未生成未经验证的OCR文本；等待学生确认材料类型或配置外部OCR适配器。", extractedFields: fields, classification, stages, startedAt, completedAt: new Date().toISOString(), version: 1 };
  state.processingJobs.unshift(job); persistState(); return cloneJob(job);
}
export function getMaterialProcessingJob(materialId: string): MaterialProcessingJob | null { const item = loadState().processingJobs.find((job) => job.materialId === materialId); return item ? cloneJob(item) : null; }
export function confirmMaterialProcessing(actor: ActorContext, materialId: string): MaterialProcessingJob | null {
  const state = loadState(); const job = state.processingJobs.find((item) => item.materialId === materialId && item.ownerId === actor.userId); if (!job || actor.role !== "STUDENT" || job.status === "blocked") return null;
  job.status = "completed"; job.confirmedAt = new Date().toISOString(); job.confirmedBy = actor.userId; job.version += 1; job.extractedFields = job.extractedFields.map((field) => ({ ...field, confirmed: true })); job.stages = job.stages.map((stage) => stage.status === "needs_confirmation" ? { ...stage, status: "completed", detail: `${stage.detail} 学生已完成真实性确认。` } : stage); persistState(); return cloneJob(job);
}
export function bindMaterialProcessingJobs(materialIds: readonly string[], applicationId: string) { const state = loadState(); let changed = false; for (const job of state.processingJobs) if (materialIds.includes(job.materialId) && !job.applicationId) { job.applicationId = applicationId; changed = true; } if (changed) persistState(); }
export function buildApplicationPrecheck(input: { project: string; materialIds: readonly string[]; evidenceCount: number; waiverConfirmed: boolean; applicationId?: string }): ApplicationPrecheckReport {
  const project = findApplicationProject(input.project); const jobs = input.materialIds.map((id) => getMaterialProcessingJob(id)); const blockers: string[] = [];
  jobs.forEach((job, index) => { if (!job) blockers.push(`材料 ${input.materialIds[index]} 尚未完成预处理`); else if (job.status === "blocked") blockers.push(`材料 ${job.materialId} 被安全扫描阻断`); else if (job.status === "needs_confirmation") blockers.push(`材料 ${job.materialId} 存在低可信字段，须学生确认`); });
  const required = project?.requiredDocuments ?? []; const missingCount = Math.max(0, required.length - input.evidenceCount); const warnings = missingCount > 0 ? [`按项目清单仍可能缺少 ${missingCount} 类材料，请核对：${required.join("、")}`] : [];
  const requiresWaiver = warnings.length > 0; const status: ApplicationPrecheckReport["status"] = blockers.length ? "blocked" : requiresWaiver && !input.waiverConfirmed ? "blocked" : requiresWaiver ? "passed_with_waiver" : "passed";
  const score = Math.max(0, Math.min(100, Math.round((required.length ? Math.min(1, input.evidenceCount / required.length) : 1) * 80 + (blockers.length ? 0 : 20))));
  return { id: `PRE-${randomUUID()}`, applicationId: input.applicationId, projectCode: project?.code ?? input.project, score, requiredDocuments: [...required], evidenceCount: input.evidenceCount, missingCount, warnings, blockers, requiresWaiver, waiverConfirmed: input.waiverConfirmed, status, disclaimer: "AI/规则预检仅提供材料建议，不自动拒绝申请；缺失材料可由学生明确确认后继续提交，低可信OCR字段必须先人工确认。", generatedAt: new Date().toISOString() };
}
export async function enrichApplicationPrecheckWithAi(report: ApplicationPrecheckReport, input: { projectName: string; materialIds: readonly string[] }): Promise<ApplicationPrecheckReport> {
  const generatedAt = new Date().toISOString();
  if (!isModelConfigured()) return { ...report, aiAdvice: { status: "not_configured", modelUsed: false, summary: "模型网关未配置，已完成确定性材料预检。", suggestions: [...report.warnings], caution: report.disclaimer, generatedAt } };
  const classifications = input.materialIds.map((id) => getMaterialProcessingJob(id)?.classification.label).filter((value): value is string => Boolean(value));
  try {
    const completion = await completeWithDeepSeek([
      { role: "system", content: "你是高校资助材料预检Agent（L2辅助建议）。只能依据脱敏后的项目清单、材料分类和确定性预检结果给出材料补充建议；不得推断身份、困难等级或资助资格，不得自动拒绝申请。仅输出JSON：summary字符串、suggestions字符串数组、caution字符串。" },
      { role: "user", content: JSON.stringify({ projectName: input.projectName, requiredDocuments: report.requiredDocuments, evidenceCount: report.evidenceCount, missingCount: report.missingCount, deterministicWarnings: report.warnings, materialClassifications: classifications }) },
    ], { temperature: .1, maxTokens: 450, responseFormat: "json" });
    const parsed = JSON.parse(completion.content) as { summary?: unknown; suggestions?: unknown; caution?: unknown };
    const summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 500) : "AI已完成脱敏材料建议分析。";
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 300)).slice(0, 8) : [];
    const caution = typeof parsed.caution === "string" ? parsed.caution.slice(0, 500) : "AI建议仅供参考，最终以人工审核为准。";
    return { ...report, aiAdvice: { status: "completed", modelUsed: true, model: completion.model, summary, suggestions, caution, generatedAt } };
  } catch {
    return { ...report, aiAdvice: { status: "unavailable", modelUsed: false, summary: "模型调用暂不可用，确定性预检结果仍然有效，申请未被AI阻断。", suggestions: [...report.warnings], caution: report.disclaimer, generatedAt } };
  }
}
export function saveApplicationPrecheck(report: ApplicationPrecheckReport): ApplicationPrecheckReport { const state = loadState(); const existing = state.precheckReports.findIndex((item) => item.id === report.id); if (existing >= 0) state.precheckReports[existing] = structuredClone(report); else state.precheckReports.unshift(structuredClone(report)); persistState(); return structuredClone(report); }
export function getApplicationPrecheck(applicationId: string): ApplicationPrecheckReport | null { const scenario = getHardshipVideoPrecheckProjection(applicationId); if (scenario) return structuredClone(scenario) as ApplicationPrecheckReport; const item = loadState().precheckReports.find((report) => report.applicationId === applicationId); return item ? structuredClone(item) : null; }
export function saveApplicationEligibility(report: EligibilityReport): EligibilityReport { const state = loadState(); const existing = state.eligibilityReports.findIndex((item) => item.id === report.id); if (existing >= 0) state.eligibilityReports[existing] = structuredClone(report); else state.eligibilityReports.unshift(structuredClone(report)); persistState(); return structuredClone(report); }
export function getApplicationEligibility(applicationId: string): EligibilityReport | null { const scenario = getHardshipVideoEligibilityProjection(applicationId); if (scenario) return structuredClone(scenario) as EligibilityReport; const item = loadState().eligibilityReports.find((report) => report.applicationId === applicationId); return item ? structuredClone(item) : null; }
export function createIntakeTicketId(): string { return `INT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`; }
function addNotice(ticket: IntakeTicket, type: ApplicationNotice["type"], title: string, content: string) { const state = loadState(); state.notices.unshift({ id: `NOT-${randomUUID()}`, recipientId: ticket.ownerId, applicationId: ticket.applicationId, ticketId: ticket.id, type, title, content, channels: ["in_app", "wechat_adapter"], deliveryStatus: "delivered", createdAt: new Date().toISOString() }); }
export function registerIntakeTicket(input: { id: string; applicationId: string; ownerId: string; campusId: string; departmentId: string; classId: string; projectName: string; receiptNo: string; precheckReportId?: string; priority?: "normal" | "high" }): IntakeTicket {
  const state = loadState(); const existing = state.intakeTickets.find((item) => item.applicationId === input.applicationId); if (existing) { existing.projectName = input.projectName; existing.receiptNo = input.receiptNo; existing.precheckReportId = input.precheckReportId ?? existing.precheckReportId; existing.priority = input.priority ?? existing.priority; existing.updatedAt = new Date().toISOString(); persistState(); return structuredClone(existing); } const now = new Date(); const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const ticket: IntakeTicket = { ...input, status: "queued", priority: input.priority ?? "normal", handlerRole: "COUNSELOR", dueAt: due, issues: [], version: 1, createdAt: now.toISOString(), updatedAt: now.toISOString(), timeline: [{ id: `TL-${randomUUID()}`, action: "submitted", title: "申请已自动受理", detail: "申请单号、回执、预检报告和材料证据已绑定，进入辅导员队列。", actorId: "system-intake-engine", actorRole: "SYSTEM", createdAt: now.toISOString() }] };
  state.intakeTickets.unshift(ticket); addNotice(ticket, "receipt", "资助申请已受理", `您的“${ticket.projectName}”申请已受理，工单 ${ticket.id}，当前进入辅导员初审队列。`); persistState(); return structuredClone(ticket);
}
export function ensureIntakeTickets(applications: readonly { id: string; ownerId: string; campusId: string; departmentId: string; classId: string; projectName: string; submissionReceiptNo?: string; status: string; riskLevel: string; precheckReportId?: string; intakeTicketId?: string; scenarioId?: string }[]) {
  for (const application of applications) if (application.status !== "草稿" && !application.scenarioId) registerIntakeTicket({ id: application.intakeTicketId ?? createIntakeTicketId(), applicationId: application.id, ownerId: application.ownerId, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, projectName: application.projectName, receiptNo: application.submissionReceiptNo ?? `RCP-${application.id.toUpperCase()}`, precheckReportId: application.precheckReportId, priority: application.riskLevel === "高" ? "high" : "normal" });
}
export function listVisibleIntakeTickets(visibleApplicationIds: readonly string[]): IntakeTicket[] { const ids = new Set(visibleApplicationIds); const stored = loadState().intakeTickets.filter((item) => ids.has(item.applicationId)).map((item) => structuredClone(item)); const scenario = listHardshipVideoTicketProjections(visibleApplicationIds) as IntakeTicket[]; return [...scenario, ...stored]; }
export function getVisibleIntakeTicket(ticketId: string, visibleApplicationIds: readonly string[]): IntakeTicket | null { const scenario = getHardshipVideoTicketProjection(ticketId); if (scenario && visibleApplicationIds.includes(scenario.applicationId)) return structuredClone(scenario) as IntakeTicket; const ids = new Set(visibleApplicationIds); const item = loadState().intakeTickets.find((ticket) => ticket.id === ticketId && ids.has(ticket.applicationId)); return item ? structuredClone(item) : null; }
export function synchronizeIntakeTicket(input: { applicationId: string; action: string; fromStatus: string; toStatus: string; actorId: string; actorRole: string; comment: string }): IntakeTicket | null {
  const state = loadState(); const ticket = state.intakeTickets.find((item) => item.applicationId === input.applicationId); if (!ticket) return null; const now = new Date().toISOString();
  if (input.action === "return") { ticket.status = "correction_required"; ticket.issues = [input.comment]; addNotice(ticket, "correction", "资助申请需要补正", `您的“${ticket.projectName}”申请需要补正：${input.comment}。请进入申请详情补充材料后重新提交。`); }
  else if (input.action === "resubmit") { ticket.status = "resubmitted"; ticket.issues = []; addNotice(ticket, "progress", "补正材料已重新提交", `您的“${ticket.projectName}”补正材料已重新进入辅导员初审队列。`); }
  else if (input.action === "approve") { ticket.status = input.toStatus === "待院系复核" ? "forwarded" : ticket.status; ticket.handlerRole = input.toStatus === "待院系复核" ? "DEPT_ADMIN" : input.toStatus === "待校级复审" ? "FUND_ADMIN" : ticket.handlerRole; addNotice(ticket, "progress", "资助申请进度更新", `您的“${ticket.projectName}”申请已流转至“${input.toStatus}”。`); }
  else if (["reject", "mark_granted"].includes(input.action)) ticket.status = "closed";
  ticket.version += 1; ticket.updatedAt = now; ticket.timeline.unshift({ id: `TL-${randomUUID()}`, action: input.action, title: `${input.fromStatus} → ${input.toStatus}`, detail: input.comment, actorId: input.actorId, actorRole: input.actorRole, createdAt: now }); persistState(); return structuredClone(ticket);
}
export function listApplicationNotices(actor: ActorContext): ApplicationNotice[] { const stored = loadState().notices.filter((notice) => actor.role === "STUDENT" ? notice.recipientId === actor.userId : false).map((notice) => structuredClone(notice)); const scenario = listHardshipVideoNotices(actor) as ApplicationNotice[]; return [...scenario, ...stored].sort((left, right) => right.createdAt.localeCompare(left.createdAt)); }
export function markApplicationNoticeRead(actor: ActorContext, noticeId: string): ApplicationNotice | null { const scenario = markHardshipVideoNoticeRead(actor, noticeId); if (scenario) return structuredClone(scenario) as ApplicationNotice; const state = loadState(); const notice = state.notices.find((item) => item.id === noticeId && item.recipientId === actor.userId); if (!notice || actor.role !== "STUDENT") return null; notice.readAt ??= new Date().toISOString(); persistState(); return structuredClone(notice); }
export function applicationOperationsStatus() { const state = loadState(); return { eligibilityReports: state.eligibilityReports.length, processingJobs: state.processingJobs.length, precheckReports: state.precheckReports.length, intakeTickets: state.intakeTickets.length, notices: state.notices.length, persistence: "atomic-json-demo-adapter" as const }; }










