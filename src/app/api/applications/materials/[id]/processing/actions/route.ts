import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { confirmMaterialProcessing } from "@/lib/platform/application-intake-store";
import { getApplicationMaterialRecord } from "@/lib/platform/application-material-store";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
interface Body { action?: unknown; humanConfirmed?: unknown }
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有材料提交人可确认OCR结果", 403);
  let body: Body; try { body = await request.json() as Body; } catch { return errorResponse("请求格式不正确"); }
  if (body.action !== "confirm" || body.humanConfirmed !== true) return errorResponse("必须由学生明确确认材料识别结果", 409);
  const { id } = await context.params; const record = getApplicationMaterialRecord(id); if (!record || record.ownerId !== actor.userId) return errorResponse("材料不存在或不属于当前用户", 404);
  const job = confirmMaterialProcessing(actor, id); if (!job) return errorResponse("材料解析任务不存在、已阻断或不可确认", 409);
  writeAuditSnapshot({ taskId: job.id, actorId: actor.userId, actorRole: actor.role, action: "application_material:confirm_ocr", outcome: "human_confirmed", evidenceSummary: `学生确认材料 ${record.name} 的OCR、版面与分类结果；低可信字段完成HITL回环，版本 ${job.version}。`, resource: { type: "application_material", id: record.id, campusId: actor.campusIds[0], sensitivity: "P3", workflowState: job.status }, before: { processingStatus: "needs_confirmation" }, after: { processingStatus: job.status, confirmedAt: job.confirmedAt, version: job.version }, operationDetails: { humanConfirmed: true, rawContentLogged: false }, evidenceRefs: [`sha256:${record.sha256}`] });
  return successResponse(job, "材料识别结果已由学生确认");
}
