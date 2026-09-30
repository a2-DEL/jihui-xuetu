import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { listApplicationNotices } from "@/lib/platform/application-intake-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";
export async function GET(request: NextRequest) { const actor = resolveRequestActor(request); if (!actor) return errorResponse("未完成身份认证", 401); if (actor.role !== "STUDENT") return errorResponse("当前接口仅返回本人申请通知", 403); const notices = listApplicationNotices(actor); return successResponse({ notices, unread: notices.filter((notice) => !notice.readAt).length, generatedAt: new Date().toISOString() }); }

