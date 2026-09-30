import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { OidcIdentityProvider } from "./oidc-provider";
import { PostgresIdentityRepository } from "./pg-repository";

export const OIDC_SESSION_COOKIE = "__Host-jhxt-session";
export const OIDC_STATE_COOKIE = "__Host-jhxt-oidc-state";
const cookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

/** PRE-PRODUCTION ONLY: no Stage-A session may enter the production business APIs.
 * A production release requires IdP/DB migrations, security audit and business repositories. */
export function stageAPreviewReady() {
  return process.env.NODE_ENV !== "production" && process.env.OIDC_STAGE_A_PREVIEW === "true" &&
    Boolean(process.env.DATABASE_URL && process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID &&
      process.env.OIDC_CLIENT_SECRET && process.env.OIDC_REDIRECT_URI);
}
const preproductionRepository = new PostgresIdentityRepository();
export function createOidcProvider(): OidcIdentityProvider {
  if (!stageAPreviewReady()) throw new Error("STAGE_A_IDP_NOT_READY");
  return new OidcIdentityProvider({
    issuer: new URL(process.env.OIDC_ISSUER!), clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!, redirectUri: process.env.OIDC_REDIRECT_URI!,
  }, preproductionRepository);
}
export function oidcRepository(): PostgresIdentityRepository {
  if (!stageAPreviewReady()) throw new Error("STAGE_A_IDP_NOT_READY");
  return preproductionRepository;
}
export function compareBrowserState(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual || expected.length !== actual.length || expected.length > 256) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(OIDC_SESSION_COOKIE, token, { ...cookieOptions, maxAge: 30 * 60 });
}
export function removeSessionCookie(response: NextResponse) {
  response.cookies.set(OIDC_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
export function removeStateCookie(response: NextResponse) {
  response.cookies.set(OIDC_STATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
export function securityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export function isHttpsRequest(request: NextRequest) {
  // Do not trust an unvalidated X-Forwarded-Proto from a public client.
  return request.nextUrl.protocol === "https:";
}
