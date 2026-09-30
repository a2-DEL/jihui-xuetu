import * as oidc from "openid-client";
import type { IIdentityProvider, IdentityChallenge, ValidatedSubject } from "./contracts";
import type { ActorContext } from "@/lib/platform/authorization";
import type { PostgresIdentityRepository } from "./pg-repository";

interface OidcConfiguration { issuer: URL; clientId: string; clientSecret: string; redirectUri: string }
/** This adapter verifies OIDC issuer, audience, signature, exp and nonce using openid-client.
 * It does NOT assign roles, persist sessions or enable production by itself. */
export class OidcIdentityProvider implements IIdentityProvider {
  readonly kind = "oidc" as const;
  private configuration: Promise<oidc.Configuration> | undefined;
  constructor(private readonly settings: OidcConfiguration, private readonly sessions?: Pick<PostgresIdentityRepository, "resolveSession">) {
    if (settings.issuer.protocol !== "https:" || settings.issuer.username || settings.issuer.password ||
        !settings.clientId || !settings.clientSecret || new URL(settings.redirectUri).protocol !== "https:")
      throw new Error("OIDC_CONFIGURATION_INVALID");
  }
  private getConfiguration() {
    this.configuration ??= oidc.discovery(this.settings.issuer, this.settings.clientId,
      { client_secret: this.settings.clientSecret }, oidc.ClientSecretBasic(this.settings.clientSecret),
      { execute: [oidc.enableNonRepudiationChecks] });
    return this.configuration;
  }
  async resolveActor(request: Request): Promise<ActorContext | null> {
    if (process.env.NODE_ENV === "production" || process.env.OIDC_STAGE_A_PREVIEW !== "true" || !this.sessions) return null;
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie.match(/(?:^|;)\s*__Host-jhxt-session=([A-Za-z0-9_-]{40,64})(?:;|$)/);
    return match ? this.sessions.resolveSession(match[1]) : null;
  }
  async start(): Promise<IdentityChallenge> {
    const config = await this.getConfiguration();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const nonce = oidc.randomNonce();
    const state = oidc.randomState();
    const authorizationUrl = oidc.buildAuthorizationUrl(config, {
      redirect_uri: this.settings.redirectUri, scope: "openid", response_type: "code",
      code_challenge: await oidc.calculatePKCECodeChallenge(codeVerifier),
      code_challenge_method: "S256", state, nonce,
    });
    return { authorizationUrl, state, nonce, codeVerifier };
  }
  async exchange(callbackUrl: URL, pending: Pick<IdentityChallenge, "state" | "nonce" | "codeVerifier">): Promise<ValidatedSubject> {
    if (callbackUrl.origin + callbackUrl.pathname !== new URL(this.settings.redirectUri).origin + new URL(this.settings.redirectUri).pathname ||
        !pending.state || !pending.nonce || !pending.codeVerifier) throw new Error("OIDC_CALLBACK_REJECTED");
    const tokens = await oidc.authorizationCodeGrant(await this.getConfiguration(), callbackUrl,
      { expectedState: pending.state, expectedNonce: pending.nonce, pkceCodeVerifier: pending.codeVerifier, idTokenExpected: true });
    const claims = tokens.claims();
    if (!claims?.sub || claims.iss !== this.settings.issuer.href.replace(/\/$/, "") ||
        (typeof claims.exp === "number" && claims.exp <= Math.floor(Date.now() / 1000)))
      throw new Error("OIDC_CLAIMS_REJECTED");
    return { issuer: claims.iss, subject: claims.sub,
      authenticationMethods: Array.isArray(claims.amr) ? claims.amr.filter((item): item is string => typeof item === "string") : [],
      authenticatedAt: typeof claims.auth_time === "number" ? claims.auth_time : undefined };
  }
}
