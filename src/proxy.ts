import { NextResponse, type NextRequest } from "next/server";

// Containment only; not a replacement for an OIDC session or per-route authorization.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (/^\/api\/(system\/init|users)(\/|$)/.test(path))
    return NextResponse.json({ success: false, error: "该旧接口已下线" }, { status: 403 });
  // Stage A containment: no production business route can accidentally bypass actor checks.
  // OIDC preview endpoints remain disabled in production; do not remove this gate
  // until sessions, business repositories and nine-dimension policy are validated.
  if (process.env.NODE_ENV === "production" && path.startsWith("/api/") && path !== "/api/auth/login")
    return NextResponse.json({ success:false, error:"生产业务接口尚未开放" }, { status:503 });
  // Production stays fail-closed until a validated IdP + server session is implemented.
  if (process.env.NODE_ENV === "production" && path !== "/login" && !path.startsWith("/api/"))
    return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)).*)"] };
