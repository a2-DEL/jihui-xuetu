import type { ActorContext } from "@/lib/platform/authorization";
import { ROLE_CODES } from "@/lib/platform/roles";

/** Roles and scopes MUST come from a trusted binding repository, not ID-token claims. */
export interface TrustedIdentityBinding {
  userId: string;
  role: ActorContext["role"];
  campusIds: string[];
  departmentIds: string[];
  classIds: string[];
  assignedTaskIds: string[];
  status: "active" | "disabled";
  mfaRequired: boolean;
}
export interface ValidatedSubject { issuer: string; subject: string; authenticationMethods: readonly string[]; authenticatedAt?: number }
export interface IdentityChallenge { authorizationUrl: URL; state: string; nonce: string; codeVerifier: string }
export interface IIdentityProvider {
  readonly kind: "oidc" | "demo";
  /** Provider-specific opaque proof; authorization scopes never come from request parameters or JWT role claims. */
  resolveActor(request: Request): Promise<ActorContext | null>;
  start(): Promise<IdentityChallenge>;
  exchange(callbackUrl: URL, pending: Pick<IdentityChallenge, "state" | "nonce" | "codeVerifier">): Promise<ValidatedSubject>;
}

export function toTrustedActor(binding: TrustedIdentityBinding): ActorContext {
  if (binding.status !== "active" || !ROLE_CODES.includes(binding.role) ||
      !binding.userId || !binding.campusIds.length ||
      binding.campusIds.some(id => !id || id.length > 80) ||
      [binding.departmentIds, binding.classIds, binding.assignedTaskIds].some(items => items.some(id => !id || id.length > 80)))
    throw new Error("IDENTITY_BINDING_INVALID");
  return { userId: binding.userId, role: binding.role, campusIds: [...binding.campusIds],
    departmentIds: [...binding.departmentIds], classIds: [...binding.classIds],
    assignedTaskIds: [...binding.assignedTaskIds], authenticated: true };
}
