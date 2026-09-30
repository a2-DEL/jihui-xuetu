import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { markApplicationNoticeRead } from "@/lib/platform/application-intake-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
interface Body { action?: unknown }
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) { const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("只有通知接收人可更新已读状态", 403); let body: Body; try { body = await request.json() as Body; } catch { return errorResponse("请求格式不正确"); } if (body.action !== "mark_read") return errorResponse("不支持的通知动作"); const { id } = await context.params; const notice = markApplicationNoticeRead(actor, id); if (!notice) return errorResponse("通知不存在或不属于当前用户", 404); return successResponse(notice, "通知已标记为已读"); }
