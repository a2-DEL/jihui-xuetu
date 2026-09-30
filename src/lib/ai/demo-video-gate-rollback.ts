/**
 * DEMO ONLY: confines one synchronous video Gate to a single audit lease and
 * compensates local JSON projections on ordinary exceptions. Not a database
 * transaction, a multi-instance coordinator, or a crash/power-loss guarantee.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withAuditAppendLease } from '@/lib/platform/audit-evidence-store';

const files = ['hardship-collaboration-runs.json', 'hardship-video-business.json',
  'hardship-video-review-business.json', 'hardship-video-disbursement.json'];
const globalKeys = ['__jhxtHardshipCollaboration', '__jhxtHardshipVideoBusiness',
  '__jhxtHardshipVideoReview', '__jhxtHardshipVideoDisbursement', '__jhxtAiStudio'] as const;
type DemoGlobals = Record<string, unknown>;
function restoreFile(path: string, original: Buffer | null) {
  if (!original) { if (existsSync(path)) unlinkSync(path); return; }
  const temporary = `${path}.${process.pid}.${randomUUID()}.rollback`;
  writeFileSync(temporary, original, { flag: 'wx', mode: 0o600 });
  renameSync(temporary, path);
}
export function withDemoVideoGateRollback<T>(work: (transactionId: string) => T): T {
  if (process.env.NODE_ENV === 'production') throw new Error('DEMO_TRANSACTION_PRODUCTION_UNAVAILABLE');
  // The lease is acquired and the existing chain verified BEFORE any business mutation.
  return withAuditAppendLease(() => {
    const paths = files.map(name => join(process.cwd(), '.runtime', name));
    const originals = paths.map(path => existsSync(path) ? readFileSync(path) : null);
    const root = globalThis as unknown as DemoGlobals;
    const memory = globalKeys.map(key => root[key] === undefined ? undefined : structuredClone(root[key]));
    const transactionId = randomUUID();
    const rollback = () => {
      try {
        paths.forEach((path, index) => restoreFile(path, originals[index]));
        globalKeys.forEach((key, index) => {
          if (key === '__jhxtAiStudio' && root[key] && memory[index] && typeof root[key] === 'object' && typeof memory[index] === 'object') {
            const current = root[key] as DemoGlobals; for (const property of Object.keys(current)) delete current[property];
            Object.assign(current, memory[index]);
          } else if (memory[index] === undefined) delete root[key];
          else root[key] = memory[index];
        });
      } catch { throw new Error('DEMO_TRANSACTION_RECOVERY_REQUIRED'); }
    };
    let result: T;
    try { result = work(transactionId); }
    catch (error) { rollback(); throw error; }
    // A domain precondition may return a failure receipt AFTER mutating its
    // in-memory projection. Treat it exactly like a thrown failure.
    if (result && typeof result === 'object' && 'success' in result && result.success === false) rollback();
    return result;
  });
}
