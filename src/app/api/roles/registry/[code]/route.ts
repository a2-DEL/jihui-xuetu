import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { listAuditEvidence } from "@/lib/platform/audit-evidence-store";
import { DEMO_IDENTITIES } from "@/lib/platform/demo-identities";
import { roleDirectory } from "@/lib/platform/role-context";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { ROLE_CODES, type RoleCode } from "@/lib/platform/roles";
const READ_ROLES = ["SYS_ADMIN", "DATA_ADMIN", "AUDITOR"] as const;
export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (!(READ_ROLES as readonly string[]).includes(actor.role)) return errorResponse("当前岗位无权读取角色治理详情", 403);
  const { code } = await context.params; if (!ROLE_CODES.includes(code as RoleCode)) return errorResponse("角色不存在", 404); const role = roleDirectory().find(item => item.code === code)!; const identities = DEMO_IDENTITIES.filter(item => item.role === code).map(item => ({ id: item.id, username: item.username, realName: item.realName, departmentIds: item.departmentIds ?? [], classIds: item.classIds ?? [], assignedTaskIds: item.assignedTaskIds ?? [] }));
  const agents = role.governance.agentTeam.map(agent => { const events = listAuditEvidence(actor, { agentCode: agent.code, pageSize: 100 }); return { ...agent, status: "registered", health: "healthy", eventCount: events.total, latestEventAt: events.items[0]?.timestamp ?? null, latestEventId: events.items[0]?.id ?? null, permissionFormula: "UserRBAC ∩ RoleAgent ∩ ToolRegistry ∩ DataScope ∩ Guardrail" }; });
  return successResponse({ version: "v2.0", generatedAt: new Date().toISOString(), role: { ...role, userCount: identities.length }, identities, agents, controls: { defaultDeny: true, separationOfDuties: ["DATA_ADMIN", "SYS_ADMIN", "AI_OPS", "AUDITOR", "DISCIPLINE"].includes(code), fieldPolicy: `最高${role.governance.maxDataSensitivity}，超限字段隐藏或脱敏`, aiPolicy: `最高${role.governance.maxAiLevel}，关键动作必须人工确认` } });
}
