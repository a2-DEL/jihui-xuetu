import { NextResponse, type NextRequest } from "next/server";

// Demo mode: allow all routes for showcase.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (/^\/api\/(system\/init|users)(\/|$)/.test(path))
    return NextResponse.json({ success: false, error: "该旧接口已下线" }, { status: 403 });
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)).*)"] };
