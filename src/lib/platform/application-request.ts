import type { ApplicationSubmissionChannel, CreateDemoApplicationInput, MaterialSubmissionMethod } from "./demo-store";

const CHANNELS: readonly ApplicationSubmissionChannel[] = ["web", "mobile", "service-counter", "batch-import"];
const METHODS: readonly MaterialSubmissionMethod[] = ["online-upload", "data-authorization", "mixed", "offline-verification"];
const AUTHORIZATION_SOURCES = ["student-status", "low-income-registry", "disability-registry", "grade-transcript"] as const;
export interface ApplicationMutationBody { projectName?: unknown; projectCode?: unknown; requestedAmount?: unknown; mode?: unknown; submissionChannel?: unknown; materialSubmissionMethod?: unknown; materialIds?: unknown; requiredMaterialCount?: unknown; authorizationSources?: unknown; offlineReceiptNo?: unknown; academicYear?: unknown; semester?: unknown; applicantStatement?: unknown; familyAnnualIncome?: unknown; familyMembers?: unknown; specialCircumstance?: unknown; bankName?: unknown; bankAccount?: unknown; precheckWaiverConfirmed?: unknown; expectedVersion?: unknown }
export interface ParsedApplicationMutation { input: Omit<CreateDemoApplicationInput, "idempotencyKey">; projectCode: string; precheckWaiverConfirmed: boolean; expectedVersion?: number }
function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function optionalNumber(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined; }
export function parseApplicationMutation(body: ApplicationMutationBody): { success: true; data: ParsedApplicationMutation } | { success: false; error: string; status?: number } {
  const projectName = text(body.projectName, 120); const projectCode = text(body.projectCode, 80);
  const mode = body.mode === "draft" ? "draft" : body.mode === "submit" ? "submit" : null;
  const channel = typeof body.submissionChannel === "string" && CHANNELS.includes(body.submissionChannel as ApplicationSubmissionChannel) ? body.submissionChannel as ApplicationSubmissionChannel : null;
  const method = typeof body.materialSubmissionMethod === "string" && METHODS.includes(body.materialSubmissionMethod as MaterialSubmissionMethod) ? body.materialSubmissionMethod as MaterialSubmissionMethod : null;
  const materialIds = Array.isArray(body.materialIds) ? [...new Set(body.materialIds.filter((item): item is string => typeof item === "string" && item.length >= 8))].slice(0, 50) : [];
  const authorizationSources = Array.isArray(body.authorizationSources) ? [...new Set(body.authorizationSources.filter((item): item is typeof AUTHORIZATION_SOURCES[number] => typeof item === "string" && (AUTHORIZATION_SOURCES as readonly string[]).includes(item)))].slice(0, 4) : [];
  const requiredMaterialCount = typeof body.requiredMaterialCount === "number" && Number.isInteger(body.requiredMaterialCount) && body.requiredMaterialCount >= 1 && body.requiredMaterialCount <= 10 ? body.requiredMaterialCount : 1;
  const statement = text(body.applicantStatement, 2000); const offlineReceiptNo = text(body.offlineReceiptNo, 80); const bankAccount = text(body.bankAccount, 40).replace(/\s/g, "");
  if (!projectName || !projectCode || !mode || !channel || !method) return { success: false, error: "资助项目、项目编码、提交模式、提交渠道或材料方式不合法" };
  if (channel === "batch-import") return { success: false, error: "批量导入渠道仅允许校级管理员通过受控任务执行", status: 403 };
  if (typeof body.requestedAmount !== "number" || !Number.isFinite(body.requestedAmount) || body.requestedAmount < 0 || body.requestedAmount > 100000) return { success: false, error: "申请金额不合法" };
  if (mode === "submit" && statement.length < 10) return { success: false, error: "正式提交时申请理由至少10个字符" };
  if (mode === "submit" && method === "online-upload" && !materialIds.length) return { success: false, error: "在线上传方式至少需要提交1份材料" };
  if (mode === "submit" && method === "data-authorization" && !authorizationSources.length) return { success: false, error: "数据授权方式至少选择1个授权数据源" };
  if (mode === "submit" && method === "mixed" && (!materialIds.length || !authorizationSources.length)) return { success: false, error: "混合提交必须同时包含上传材料和授权数据源" };
  if (method === "offline-verification" && (channel !== "service-counter" || offlineReceiptNo.length < 4)) return { success: false, error: "线下核验必须选择服务窗口渠道并填写材料受理回执" };
  if (bankAccount && !/^\d{12,25}$/.test(bankAccount)) return { success: false, error: "银行卡号格式不正确" };
  const expectedVersion = typeof body.expectedVersion === "number" && Number.isInteger(body.expectedVersion) && body.expectedVersion >= 1 ? body.expectedVersion : undefined;
  return { success: true, data: { projectCode, precheckWaiverConfirmed: body.precheckWaiverConfirmed === true, expectedVersion, input: { projectName, requestedAmount: body.requestedAmount, mode, submissionChannel: channel, materialSubmissionMethod: method, materialIds, requiredMaterialCount, authorizationSources, offlineReceiptNo: offlineReceiptNo || undefined, academicYear: text(body.academicYear, 20) || "2026-2027", semester: text(body.semester, 20) || "第一学期", applicantStatement: statement, familyAnnualIncome: optionalNumber(body.familyAnnualIncome), familyMembers: optionalNumber(body.familyMembers), specialCircumstance: text(body.specialCircumstance, 1000) || undefined, bankName: text(body.bankName, 80) || undefined, bankAccount: bankAccount || undefined } } };
}
