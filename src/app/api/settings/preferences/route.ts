import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { getUserSettings, updateInterfacePreferences, updateUserSettings, type UserSettings } from "@/lib/platform/user-settings-store";

const themes = ["light", "dark", "system"];
const languages = ["zh-CN", "en-US"];
const fontSizes = ["small", "standard", "large"];
const homepages = ["/dashboard/overview", "/application/all", "/student/portal"];
const timeouts = [15, 30, 60];

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  return successResponse(getUserSettings(actor));
}

export async function PUT(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  let body: { expectedVersion?: unknown; patch?: Partial<Pick<UserSettings, "interface" | "notifications" | "security">> };
  try { body = await request.json() as typeof body; } catch { return errorResponse("请求参数格式无效", 400); }
  if (!Number.isInteger(body.expectedVersion) || !body.patch || typeof body.patch !== "object") return errorResponse("缺少设置版本或更新内容", 400);
  const ui = body.patch.interface;
  if (ui && ((!themes.includes(ui.theme)) || (!languages.includes(ui.language)) || (!fontSizes.includes(ui.fontSize)) || (!homepages.includes(ui.homepage)))) return errorResponse("界面偏好选项无效", 400);
  const security = body.patch.security;
  if (security && !timeouts.includes(security.sessionTimeoutMinutes)) return errorResponse("会话超时时间无效", 400);
  const result = updateUserSettings(actor, { expectedVersion: body.expectedVersion as number, patch: body.patch });
  return result.success ? successResponse(result.settings, result.message) : errorResponse(`${result.code}: ${result.message}`, 409);
}

export async function PATCH(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse("未完成身份认证", 401);
  let body: { interface?: UserSettings["interface"] };
  try { body = await request.json() as typeof body; } catch { return errorResponse("请求参数格式无效", 400); }
  const ui = body.interface;
  if (!ui || !themes.includes(ui.theme) || !languages.includes(ui.language) || !fontSizes.includes(ui.fontSize) || !homepages.includes(ui.homepage)) return errorResponse("界面偏好选项无效", 400);
  return successResponse(updateInterfacePreferences(actor, ui), "界面偏好已即时生效并同步到账号。");
}
