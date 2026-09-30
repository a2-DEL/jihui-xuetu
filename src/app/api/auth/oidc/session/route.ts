import { type NextRequest, NextResponse } from "next/server";
import { createOidcProvider, isHttpsRequest, securityHeaders, stageAPreviewReady } from "@/lib/identity/http";

/** Pre-production-only session probe: never return student PII, scopes or a raw token. */
export async function GET(request: NextRequest) {
  if (!stageAPreviewReady() || !isHttpsRequest(request))
    return NextResponse.json({success:false,error:"统一身份联调未开放"},{status:503});
  try {
    const actor = await createOidcProvider().resolveActor(request);
    if (!actor) return securityHeaders(NextResponse.json({success:false,error:"会话无效或已过期"},{status:401}));
    return securityHeaders(NextResponse.json({success:true,role:actor.role,sessionMode:"STAGE_A_PREVIEW",businessAccessEnabled:false}));
  } catch { return securityHeaders(NextResponse.json({success:false,error:"身份数据服务不可用"},{status:503})); }
}
