import { type NextRequest, NextResponse } from "next/server";
import { createOidcProvider, isHttpsRequest, OIDC_STATE_COOKIE, oidcRepository, securityHeaders, stageAPreviewReady } from "@/lib/identity/http";

export async function GET(request: NextRequest) {
  if (!stageAPreviewReady() || !isHttpsRequest(request))
    return NextResponse.json({ success:false,error:"统一身份联调未开放" },{ status:503 });
  try {
    const challenge = await createOidcProvider().start();
    await oidcRepository().storeAttempt(challenge.state,challenge.codeVerifier,challenge.nonce);
    const response = NextResponse.redirect(challenge.authorizationUrl);
    response.cookies.set(OIDC_STATE_COOKIE,challenge.state,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:300});
    return securityHeaders(response);
  } catch {
    return securityHeaders(NextResponse.json({success:false,error:"身份服务不可用"},{status:503}));
  }
}
