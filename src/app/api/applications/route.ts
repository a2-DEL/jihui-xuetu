import { createHash } from "node:crypto";
﻿import { type NextRequest } from "next/server";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-utils";
import { parseApplicationMutation, type ApplicationMutationBody } from "@/lib/platform/application-request";
import { bindMaterialProcessingJobs, buildApplicationPrecheck, createIntakeTicketId, enrichApplicationPrecheckWithAi, evaluateApplicationEligibility, registerIntakeTicket, saveApplicationEligibility, saveApplicationPrecheck } from "@/lib/platform/application-intake-store";
import { createDemoApplication, getApplicationCreationReplay, saveApplicationCreationResponse, listVisibleApplications, writeAuditSnapshot, type ApplicationStatus } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

const RAW_LIST_DENIED_ROLES = ["SYS_ADMIN", "AI_OPS", "PUBLIC_OPINION", "DISCIPLINE", "DATA_ADMIN"] as const;
const MASKED_ROLES = ["SCHOOL_LEADER", "FINANCE", "EDU_BUREAU"] as const;
const VALID_STATUSES: readonly ApplicationStatus[] = ["草稿", "待辅导员初审", "待院系复核", "待校级复审", "待领导审批", "待公示", "公示中", "待发放", "已完成", "已退回补正", "已驳回", "申诉处理中"];
function mask(value: string) { return value.length > 2 ? `${value.slice(0, 1)}*${value.slice(-1)}` : `${value.slice(0, 1)}*`; }
function maskNo(value: string) { return value.length > 6 ? `${value.slice(0, 4)}****${value.slice(-2)}` : "******"; }
export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if ((RAW_LIST_DENIED_ROLES as readonly string[]).includes(actor.role)) return errorResponse("当前技术或专项治理岗位无权读取学生申请明细", 403);
  const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1); const pageSize = Math.min(100, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("pageSize") ?? "20", 10) || 20)); const requestedStatus = request.nextUrl.searchParams.get("status"); const statuses = requestedStatus && VALID_STATUSES.includes(requestedStatus as ApplicationStatus) ? [requestedStatus as ApplicationStatus] : undefined; const keyword = request.nextUrl.searchParams.get("keyword")?.trim().toLocaleLowerCase();
  let applications = listVisibleApplications(actor, statuses); if (keyword) applications = applications.filter(item => `${item.studentName}${item.studentNo}${item.projectName}${item.id}${item.submissionReceiptNo ?? ""}`.toLocaleLowerCase().includes(keyword)); const from = (page - 1) * pageSize; const pageItems = applications.slice(from, from + pageSize);
  const output: Record<string, unknown>[] = (MASKED_ROLES as readonly string[]).includes(actor.role) ? pageItems.map(item => ({ id: item.id, studentName: mask(item.studentName), studentNo: maskNo(item.studentNo), campusId: item.campusId, departmentId: item.departmentId, projectName: item.projectName, requestedAmount: item.requestedAmount, status: item.status, riskLevel: item.riskLevel, materialCompleteness: item.materialCompleteness, materialCount: item.materialCount, materialVerifiedCount: item.materialVerifiedCount, submissionChannel: item.submissionChannel, materialSubmissionMethod: item.materialSubmissionMethod, submissionReceiptNo: item.submissionReceiptNo, submittedAt: item.submittedAt, overdue: item.overdue, grantBatchId: item.grantBatchId, auditTaskId: item.auditTaskId, version: item.version, updatedAt: item.updatedAt, intakeTicketId: item.intakeTicketId, precheckScore: item.precheckScore })) : pageItems.map(item => ({ ...item, authorizationSources: [...(item.authorizationSources ?? [])], precheckWarnings: [...(item.precheckWarnings ?? [])] }));
  return paginatedResponse(output, page, pageSize, applications.length);
}
export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有学生本人可以创建资助申请", 403);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim(); if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return errorResponse("提交申请必须提供有效的 Idempotency-Key");
  let body: ApplicationMutationBody; try { body = await request.json() as ApplicationMutationBody; } catch { return errorResponse("请求格式不正确"); }
  const parsed = parseApplicationMutation(body); if (!parsed.success) return errorResponse(parsed.error, parsed.status);
  const { input, projectCode, precheckWaiverConfirmed } = parsed.data;
  const fingerprint = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  const replay = getApplicationCreationReplay(actor, idempotencyKey, fingerprint);
  if (replay.status === "conflict") return errorResponse("相同 Idempotency-Key 对应不同请求内容", 409);
  if (replay.status === "hit") return successResponse(replay.data, replay.message);
  const eligibility = evaluateApplicationEligibility(actor, { project: projectCode, requestedAmount: input.requestedAmount, academicYear: input.academicYear }, listVisibleApplications(actor));
  const evidenceCount = input.materialIds.length + input.authorizationSources.length + (input.offlineReceiptNo ? 1 : 0);
  let precheck = buildApplicationPrecheck({ project: projectCode, materialIds: input.materialIds, evidenceCount, waiverConfirmed: precheckWaiverConfirmed });
  if (input.mode === "submit") precheck = await enrichApplicationPrecheckWithAi(precheck, { projectName: input.projectName, materialIds: input.materialIds });
  if (input.mode === "submit" && !eligibility.allowed) return errorResponse(`资格校验未通过：${eligibility.checks.filter(item => item.status === "blocked").map(item => item.detail).join("；")}`, 409);
  if (input.mode === "submit" && precheck.blockers.length) return errorResponse(`材料预处理未完成：${precheck.blockers.join("；")}`, 409);
  if (input.mode === "submit" && precheck.requiresWaiver && !precheckWaiverConfirmed) return errorResponse(`材料预检提示：${precheck.warnings.join("；")}。如仍需提交，请勾选“已知悉并确认提交”。`, 409);
  const intakeTicketId = input.mode === "submit" ? createIntakeTicketId() : undefined;
  try {
    const application = createDemoApplication(actor, { ...input, idempotencyKey, eligibilityReportId: eligibility.id, precheckReportId: input.mode === "submit" ? precheck.id : undefined, precheckScore: input.mode === "submit" ? precheck.score : undefined, precheckWarnings: input.mode === "submit" ? precheck.warnings : undefined, precheckWaiverConfirmed: input.mode === "submit" ? precheckWaiverConfirmed : undefined, intakeTicketId });
    eligibility.applicationId = application.id; saveApplicationEligibility(eligibility);
    bindMaterialProcessingJobs(input.materialIds, application.id);
    let ticket = null;
    if (input.mode === "submit" && intakeTicketId) {
      precheck.applicationId = application.id; saveApplicationPrecheck(precheck);
      writeAuditSnapshot({ taskId: precheck.id, actorId: actor.userId, actorRole: actor.role, action: "ai:application_material_precheck", outcome: precheck.aiAdvice?.status ?? "deterministic_only", evidenceSummary: `申请 ${application.id} 完成100%材料预检；规则评分 ${precheck.score}，AI状态 ${precheck.aiAdvice?.status ?? "not_run"}；仅输出建议，不形成拒绝或审批结论。`, resource: { type: "application", id: application.id, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, sensitivity: "P3", workflowState: application.status }, ai: { agentCode: "student-material-precheck-agent", agentName: "材料预检Agent", modelProvider: precheck.aiAdvice?.modelUsed ? "DeepSeek" : "deterministic-fallback", model: precheck.aiAdvice?.model, promptVersion: "application-precheck-v1", skillVersion: "material-completeness-v1", workflowVersion: "application-intake-v2", inputSummary: "脱敏项目清单、材料分类标签与确定性预检结果", outputSummary: precheck.aiAdvice?.summary ?? precheck.warnings.join("；"), xaiSummary: precheck.aiAdvice?.caution ?? precheck.disclaimer, advisoryOnly: true }, operationDetails: { modelUsed: Boolean(precheck.aiAdvice?.modelUsed), waiverConfirmed: precheck.waiverConfirmed, blockers: precheck.blockers.length, missingCount: precheck.missingCount } });
      ticket = registerIntakeTicket({ id: intakeTicketId, applicationId: application.id, ownerId: application.ownerId, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, projectName: application.projectName, receiptNo: application.submissionReceiptNo ?? application.id, precheckReportId: precheck.id, priority: application.riskLevel === "高" ? "high" : "normal" });
    }
    writeAuditSnapshot({ taskId: eligibility.id, actorId: actor.userId, actorRole: actor.role, action: "application:eligibility_check", outcome: eligibility.allowed ? "passed" : "warning", evidenceSummary: `项目资格确定性校验完成；${eligibility.checks.filter(item => item.status === "passed").length} 项通过、${eligibility.warningCodes.length} 项提示，报告 ${eligibility.id}。`, resource: { type: "application", id: application.id, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, sensitivity: "P2", workflowState: application.status }, after: { reportId: eligibility.id, allowed: eligibility.allowed, blockingCodes: eligibility.blockingCodes, warningCodes: eligibility.warningCodes }, operationDetails: { deterministicRules: true, modelUsed: false } });
    const data = { ...application, eligibility, precheck: input.mode === "submit" ? precheck : null, intakeTicket: ticket };
    const message = input.mode === "draft" ? "草稿已保存并生成回执，可继续编辑" : "申请已预检、受理并实时进入辅导员队列";
    saveApplicationCreationResponse(actor, idempotencyKey, fingerprint, data, message);
    return successResponse(data, message);
  } catch (reason) {
    if (reason instanceof Error && reason.message === "MATERIAL_NOT_FOUND_OR_ALREADY_CLAIMED") return errorResponse("部分材料不存在、已被其他申请绑定或不属于当前用户", 409);
    return errorResponse("申请写入失败，请稍后重试", 500);
  }
}



