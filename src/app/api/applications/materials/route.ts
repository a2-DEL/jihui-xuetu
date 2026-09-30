import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { processApplicationMaterial } from "@/lib/platform/application-intake-store";
import { listStagedApplicationMaterials, stageApplicationMaterial } from "@/lib/platform/application-material-store";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有学生本人可查看待提交材料", 403);
  return successResponse(listStagedApplicationMaterials(actor).map((record) => ({ ...record, processing: processApplicationMaterial(record) })));
}
export async function POST(request: NextRequest) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有学生本人可上传申请材料", 403);
  let form: FormData; try { form = await request.formData(); } catch { return errorResponse("材料上传请求格式不正确"); }
  const file = form.get("file"); if (!(file instanceof File)) return errorResponse("请选择需要上传的文件");
  try {
    const record = stageApplicationMaterial(actor, { name: file.name, mimeType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
    const processing = processApplicationMaterial(record);
    writeAuditSnapshot({ taskId: record.id, actorId: actor.userId, actorRole: actor.role, action: "application_material:upload_and_process", outcome: processing.status, evidenceSummary: `学生在线上传申请材料 ${record.name}；SHA-256摘要、恶意特征扫描、版面分析、实体抽取与OCR回环状态已生成。`, resource: { type: "application_material", id: record.id, campusId: actor.campusIds[0], sensitivity: "P3", workflowState: processing.status }, after: { id: record.id, name: record.name, mimeType: record.mimeType, sizeBytes: record.sizeBytes, sha256: record.sha256, status: record.status, processingJobId: processing.id, processingStatus: processing.status }, operationDetails: { transport: "multipart/form-data", malwareScan: "eicar-signature-v1", parserAdapter: processing.parserAdapter, rawBytesLogged: false }, evidenceRefs: [`sha256:${record.sha256}`] });
    return successResponse({ ...record, processing }, processing.status === "needs_confirmation" ? "材料已暂存并完成预处理，请确认低可信识别结果" : "材料已安全暂存并完成预处理");
  } catch (reason) {
    const code = reason instanceof Error ? reason.message : "UPLOAD_FAILED";
    if (code === "FILE_TYPE_DENIED") return errorResponse("仅支持PDF、JPG和PNG材料");
    if (code === "FILE_CONTENT_TYPE_MISMATCH") return errorResponse("文件内容签名与扩展类型不一致，已阻断上传");
    if (code === "FILE_SIZE_DENIED") return errorResponse("文件不能为空且单个文件不得超过10MB");
    if (code === "TOTAL_FILE_SIZE_DENIED") return errorResponse("当前用户申请材料总量不得超过50MB");
    if (code === "MALWARE_DETECTED") return errorResponse("材料命中恶意文件测试特征，已阻断且未写入对象存储", 422);
    return errorResponse("材料上传失败，请稍后重试", 500);
  }
}

