import { type NextRequest, NextResponse } from "next/server";
import { isHttpsRequest, OIDC_SESSION_COOKIE, oidcRepository, removeSessionCookie, securityHeaders, stageAPreviewReady } from "@/lib/identity/http";

// Never revoke a session solely on a cross-site GET (CSRF); require POST and verify Origin.
export async function POST(request: NextRequest) {
  if (!stageAPreviewReady() || !isHttpsRequest(request)) return NextResponse.json({success:false,error:"统一身份联调未开放"},{status:503});
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({success:false,error:"来源验证失败"},{status:403});
  const token = request.cookies.get(OIDC_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({success:false,error:"会话不存在"},{status:401});
  try {
    await oidcRepository().revokeSession(token);
    const response = securityHeaders(NextResponse.json({success:true,message:"会话已撤销"}));
    removeSessionCookie(response);
    return response;
  } catch { return securityHeaders(NextResponse.json({success:false,error:"无法确认会话撤销；访问仍被拒绝"},{status:503})); }
}
