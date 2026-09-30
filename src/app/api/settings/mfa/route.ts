import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { resolveRequestActor } from "@/lib/platform/request-actor";
import { enableDemoMfa } from "@/lib/platform/user-settings-store";
export async function POST(request: NextRequest) { const actor=resolveRequestActor(request); if(!actor)return errorResponse("未完成身份认证",401); return successResponse(enableDemoMfa(actor),"MFA 演示注册已完成。"); }