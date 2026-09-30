import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { AUDIT_CATEGORIES, AUDIT_LEVELS, canAccessAuditCenter, listAuditEvidence, type AuditCategory, type AuditLevel, type AuditOutcome } from "@/lib/platform/audit-evidence-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { SENSITIVE_LEVELS, type SensitiveLevel } from "@/lib/platform/authorization";

const OUTCOMES: readonly AuditOutcome[] = ["SUCCESS", "PARTIAL", "FAILURE", "DENIED", "HUMAN_CONFIRMED", "EXCEPTION"];
function numberParam(value: string | null, fallback: number) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; }

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessAuditCenter(actor)) return errorResponse("当前岗位无权读取审计事件", 403);
  const params = request.nextUrl.searchParams;
  const category = params.get("category"); const level = params.get("level"); const outcome = params.get("outcome");
  if (category && !AUDIT_CATEGORIES.includes(category as AuditCategory)) return errorResponse("审计类别筛选值无效");
  if (level && !AUDIT_LEVELS.includes(level as AuditLevel)) return errorResponse("审计级别筛选值无效");
  if (outcome && !OUTCOMES.includes(outcome as AuditOutcome)) return errorResponse("审计结果筛选值无效");
  const sensitivity = params.get("sensitivity");
  if (sensitivity && sensitivity !== "high" && !SENSITIVE_LEVELS.includes(sensitivity as SensitiveLevel)) return errorResponse("敏感等级筛选值无效");
  return successResponse(listAuditEvidence(actor, {
    category: category as AuditCategory | undefined,
    level: level as AuditLevel | undefined,
    outcome: outcome as AuditOutcome | undefined,
    keyword: params.get("keyword") ?? undefined,
    actorId: params.get("actorId") ?? undefined,
    agentCode: params.get("agent") ?? undefined,
    taskId: params.get("taskId") ?? undefined,
    sensitivity: sensitivity === "high" ? "HIGH" : sensitivity as SensitiveLevel | undefined,
    page: numberParam(params.get("page"), 1),
    pageSize: Math.min(100, numberParam(params.get("pageSize"), 20)),
  }));
}

