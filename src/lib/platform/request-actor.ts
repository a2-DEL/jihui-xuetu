import { type ActorContext } from './authorization';
import { DemoIdentityProvider } from '@/lib/identity/demo-provider';

export function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
}

/** Stage A fail-closed: production cannot accept an external user until IdP +
 * trusted binding + revocable DB session + audited persistence are validated. */
export function resolveRequestActor(request: Request): ActorContext | null {
  return new DemoIdentityProvider().resolve(extractBearerToken(request));
}
