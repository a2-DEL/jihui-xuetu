import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { listAuditEvidence } from "@/lib/platform/audit-evidence-store";
import { roleDirectory } from "@/lib/platform/role-context";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { ROLE_CODES, type RoleCode } from "@/lib/platform/roles";
const READ_ROLES = ["SYS_ADMIN", "DATA_ADMIN", "AUDITOR"] as const;
export async function GET(request: NextRequest, context: { params: Promise<{ code: string; agentCode: string }> }) {
  const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (!(READ_ROLES as readonly string[]).includes(actor.role)) return errorResponse("当前岗位无权读取Agent注册详情", 403);
  const { code, agentCode } = await context.params; if (!ROLE_CODES.includes(code as RoleCode)) return errorResponse("角色不存在", 404); const role = roleDirectory().find(item => item.code === code)!; const agent = role.governance.agentTeam.find(item => item.code === agentCode); if (!agent) return errorResponse("Agent不存在或不属于该角色团队", 404); const events = listAuditEvidence(actor, { agentCode, pageSize: 50 });
  return successResponse({ generatedAt: new Date().toISOString(), role: { code: role.code, name: role.name, permissions: role.permissions, dataScope: role.dataScope }, governance: role.governance, agent: { ...agent, status: "registered", health: "healthy", permissionFormula: "UserRBAC ∩ RoleAgent ∩ ToolRegistry ∩ DataScope ∩ Guardrail", executableRisk: role.governance.maxAiLevel, dataCeiling: role.governance.maxDataSensitivity }, runtime: { eventCount: events.total, events: events.items.slice(0, 20), lastEventAt: events.items[0]?.timestamp ?? null, lifecycleActions: ["注册", "策略校验", "沙盒测试", "发布", "运行监控", "停用"] } });
}
