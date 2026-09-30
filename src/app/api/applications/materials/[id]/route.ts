import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { getMaterialProcessingJob } from "@/lib/platform/application-intake-store";
import { getApplicationMaterialRecord, removeDraftApplicationMaterial, removeStagedApplicationMaterial } from "@/lib/platform/application-material-store";
import { getVisibleApplication, writeAuditSnapshot } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { getHardshipVideoMaterialDetail } from "@/lib/platform/hardship-video-business-store";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); const { id } = await context.params; const scenario = getHardshipVideoMaterialDetail(id); if (scenario) { const application = getVisibleApplication(actor, scenario.material.applicationId); if (!application) return errorResponse("材料不存在或不在当前数据授权范围", 404); return successResponse(scenario); } const record = getApplicationMaterialRecord(id); if (!record) return errorResponse("材料不存在", 404);
  const ownerStaged = record.ownerId === actor.userId && record.status === "staged"; const application = record.applicationId ? getVisibleApplication(actor, record.applicationId) : null;
  if (!ownerStaged && !application) return errorResponse("材料不存在或不在当前数据授权范围", 404);
  const canReadMetadata = actor.role === "STUDENT" || ["COUNSELOR", "DEPT_ADMIN", "FUND_ADMIN", "FUND_LEADER", "AUDITOR", "AUDIT_EXTERNAL"].includes(actor.role); if (!canReadMetadata) return errorResponse("当前岗位无权读取材料解析详情", 403);
  const processing = getMaterialProcessingJob(record.id); const view = actor.role === "STUDENT" ? record : { ...record, ownerId: undefined, storageKey: undefined, source: "脱敏材料元数据" };
  return successResponse({ material: view, processing, permission: { canConfirm: actor.role === "STUDENT" && actor.userId === record.ownerId && processing?.status === "needs_confirmation", rawObjectDownload: false, reason: "当前阶段仅开放结构化解析结果；原始证件对象按P4权限隔离。" } });
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有学生本人可移除待提交材料", 403);
  const { id } = await context.params; const applicationId = request.nextUrl.searchParams.get("applicationId"); let record = applicationId ? null : removeStagedApplicationMaterial(actor, id);
  if (applicationId) { const application = getVisibleApplication(actor, applicationId); if (!application || !["草稿", "已退回补正"].includes(application.status)) return errorResponse("只有本人草稿或待补正申请可移除材料", 403); record = removeDraftApplicationMaterial(actor, id, applicationId); }
  if (!record) return errorResponse("材料不存在、已提交或不属于当前用户", 404);
  writeAuditSnapshot({ taskId: record.id, actorId: actor.userId, actorRole: actor.role, action: applicationId ? "application_material:delete_from_draft" : "application_material:delete_staged", outcome: "success", evidenceSummary: `学生移除${applicationId ? "草稿内" : "尚未提交的暂存"}材料 ${record.name}；已删除对象字节并保留操作证据。`, resource: { type: "application_material", id: record.id, campusId: actor.campusIds[0], sensitivity: "P3", workflowState: "deleted" }, before: { id: record.id, name: record.name, sha256: record.sha256, status: applicationId ? "submitted" : "staged" }, after: { id: record.id, status: "deleted" }, evidenceRefs: [`sha256:${record.sha256}`] });
  return successResponse({ id: record.id }, "材料已移除");
}
