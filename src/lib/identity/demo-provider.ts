import { findDemoIdentityByCredentials, findDemoIdentityByToken, toActorContext } from "@/lib/platform/demo-identities";
import { listDemoAssignedBankBatchIds } from "@/lib/platform/demo-store";
import type { ActorContext } from "@/lib/platform/authorization";
import type { IIdentityProvider } from "./contracts";

/** No demo credentials may be accepted in NODE_ENV=production, regardless of configuration. */
export class DemoIdentityProvider implements IIdentityProvider {
  readonly kind = "demo" as const;
  async start(): Promise<never> { throw new Error("DEMO_OIDC_NOT_SUPPORTED"); }
  async exchange(): Promise<never> { throw new Error("DEMO_OIDC_NOT_SUPPORTED"); }
  private enabled() { return process.env.NODE_ENV !== "production" && process.env.OIDC_STAGE_A_PREVIEW !== "true" && process.env.ENABLE_DEMO_IDENTITY !== "false"; }
  authenticate(username: string, password: string) {
    return this.enabled() ? findDemoIdentityByCredentials(username, password) : null;
  }
  async resolveActor(request: Request): Promise<ActorContext | null> {
    const auth = request.headers.get("authorization");
    return this.resolve(auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null);
  }
  resolve(token: string | null): ActorContext | null {
    const identity = this.enabled() ? findDemoIdentityByToken(token) : null;
    if (!identity) return null;
    const actor = toActorContext(identity);
    return actor.role === "BANK" ? { ...actor, assignedTaskIds: listDemoAssignedBankBatchIds(actor.userId) } : actor;
  }
}
