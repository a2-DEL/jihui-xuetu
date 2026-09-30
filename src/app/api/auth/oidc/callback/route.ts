import { type NextRequest, NextResponse } from "next/server";
import { compareBrowserState, createOidcProvider, isHttpsRequest, OIDC_STATE_COOKIE, oidcRepository, removeStateCookie, securityHeaders, setSessionCookie, stageAPreviewReady } from "@/lib/identity/http";

/** Pre-production identity contract test only; session is deliberately NOT accepted by business APIs yet. */
export async function GET(request: NextRequest) {
  if (!stageAPreviewReady() || !isHttpsRequest(request))
    return NextResponse.json({success:false,error:"统一身份联调未开放"},{status:503});
  const state = request.nextUrl.searchParams.get("state");
  const browserState = request.cookies.get(OIDC_STATE_COOKIE)?.value;
  const repo = oidcRepository();
  try {
    if (!compareBrowserState(browserState,state)) {
      await repo.recordFailure("OIDC_CALLBACK_REJECTED");
      return securityHeaders(NextResponse.json({success:false,error:"身份校验失败"},{status:401}));
    }
    const pending = await repo.consumeAttempt(state!);
    if (!pending) {
      await repo.recordFailure("STATE_EXPIRED");
      return securityHeaders(NextResponse.json({success:false,error:"身份校验失败"},{status:401}));
    }
    const subject = await createOidcProvider().exchange(request.nextUrl,{state:state!,nonce:pending.nonce,codeVerifier:pending.codeVerifier});
    const result = await repo.createSession(subject);
    if (!result) return securityHeaders(NextResponse.json({success:false,error:"身份或 MFA 未获授权"},{status:403}));
    const response = securityHeaders(NextResponse.json({success:true,message:"预生产身份验证完成；业务访问尚未开放",role:result.actor.role,sessionMode:"STAGE_A_PREVIEW"}));
    setSessionCookie(response,result.token);
    removeStateCookie(response);
    return response;
  } catch {
    try { await repo.recordFailure("OIDC_TOKEN_REJECTED"); }
    catch { return securityHeaders(NextResponse.json({success:false,error:"审计不可用，身份验证失败"},{status:503})); }
    return securityHeaders(NextResponse.json({success:false,error:"身份验证失败"},{status:401}));
  }
}
