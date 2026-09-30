import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { auditEvidenceOverview, canAccessAuditCenter } from "@/lib/platform/audit-evidence-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { ROLE_GOVERNANCE_POLICIES } from "@/lib/platform/role-context";

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  if (!canAccessAuditCenter(actor)) return errorResponse("当前岗位无权进入全链路审计中心", 403);
  const overview = auditEvidenceOverview(actor);
  return successResponse({ ...overview, role: actor.role, agents: ROLE_GOVERNANCE_POLICIES[actor.role].agentTeam });
}
