import { createHash, randomBytes } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { ROLE_CODES, type RoleCode } from "@/lib/platform/roles";
import { toTrustedActor, type TrustedIdentityBinding, type ValidatedSubject } from "./contracts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const failIfUnavailable = () => {
  if (!process.env.DATABASE_URL) throw new Error("AUTH_DATABASE_NOT_CONFIGURED");
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_PRODUCTION_RELEASE_NOT_APPROVED");
};
const safeRole = (candidate: string): RoleCode => {
  if (!ROLE_CODES.includes(candidate as RoleCode)) throw new Error("ROLE_BINDING_UNKNOWN");
  return candidate as RoleCode;
};

/** Stage-A pre-production adapter. No production usage until the DDL and audit contract are reviewed.
 * Never use .runtime JSON or a process-local Map for a real subject/session. */
export class PostgresIdentityRepository {
  private pool: Pool | undefined;
  private getPool() {
    failIfUnavailable();
    this.pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 4, connectionTimeoutMillis: 3_000, idleTimeoutMillis: 5_000 });
    return this.pool;
  }
  async close() { if (this.pool) { await this.pool.end(); this.pool = undefined; } }
  async storeAttempt(state: string, verifier: string, nonce: string) {
    const client = await this.getPool().connect();
    try {
      await client.query("INSERT INTO auth_oidc_attempts(state_hash,code_verifier,nonce,expires_at) VALUES($1,$2,$3,now()+interval '5 minutes')", [hash(state), verifier, nonce]);
    } finally { client.release(); }
  }
  async consumeAttempt(state: string): Promise<{ codeVerifier: string; nonce: string } | null> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query<{code_verifier:string;nonce:string}>(
        "DELETE FROM auth_oidc_attempts WHERE state_hash=$1 AND expires_at>now() RETURNING code_verifier,nonce", [hash(state)]);
      return result.rows[0] ? {codeVerifier: result.rows[0].code_verifier, nonce: result.rows[0].nonce} : null;
    } finally { client.release(); }
  }
  private async binding(client: PoolClient, subject: ValidatedSubject): Promise<TrustedIdentityBinding | null> {
    const result = await client.query<{user_id:string;role_code:string;campus_ids:string[];department_ids:string[];class_ids:string[];assigned_task_ids:string[];mfa_required:boolean;status:string}>(
      `SELECT b.user_id,b.role_code,b.campus_ids,b.department_ids,b.class_ids,b.assigned_task_ids,b.mfa_required,u.status
         FROM auth_identity_bindings b JOIN users u ON u.id=b.user_id
         WHERE b.issuer=$1 AND b.subject=$2 AND b.disabled_at IS NULL FOR UPDATE OF b`, [subject.issuer, subject.subject]);
    const row = result.rows[0];
    if (!row) return null;
    return { userId: row.user_id, role: safeRole(row.role_code), campusIds: row.campus_ids,
      departmentIds: row.department_ids, classIds: row.class_ids, assignedTaskIds: row.assigned_task_ids,
      mfaRequired: row.mfa_required, status: row.status === "active" ? "active" : "disabled" };
  }
  async createSession(subject: ValidatedSubject): Promise<{ token: string; actor: ReturnType<typeof toTrustedActor> } | null> {
    const client = await this.getPool().connect();
    const subjectHash = hash(`${subject.issuer}:${subject.subject}`);
    try {
      await client.query("BEGIN");
      const binding = await this.binding(client, subject);
      let reason = "UNBOUND_IDENTITY";
      if (binding) {
        if (binding.status !== "active") reason = "ACCOUNT_DISABLED";
        else if (binding.mfaRequired && !subject.authenticationMethods.some(value => ["mfa","otp","hwk","swk"].includes(value))) reason = "MFA_REQUIRED";
        else {
          const actor = toTrustedActor(binding);
          const token = randomBytes(32).toString("base64url");
          const tokenHash = hash(token);
          await client.query("INSERT INTO auth_sessions(token_hash,issuer,subject,user_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '30 minutes')", [tokenHash, subject.issuer, subject.subject, actor.userId]);
          await this.audit(client, "LOGIN", "allowed", subject.issuer, subjectHash, actor.userId, tokenHash, "OIDC_VERIFIED");
          await client.query("COMMIT");
          return { token, actor };
        }
      }
      await this.audit(client, "LOGIN", "denied", subject.issuer, subjectHash, null, null, reason);
      await client.query("COMMIT");
      return null;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  private async audit(client: PoolClient, action: string, outcome: string, issuer: string | null, subjectHash: string | null, userId: string | null, tokenHash: string | null, reason: string) {
    await client.query("INSERT INTO auth_security_events(event_type,outcome,issuer,subject_hash,user_id,session_hash,reason_code) VALUES ($1,$2,$3,$4,$5,$6,$7)", [action,outcome,issuer,subjectHash,userId,tokenHash,reason]);
  }
  async recordFailure(reason: "OIDC_CALLBACK_REJECTED" | "OIDC_TOKEN_REJECTED" | "STATE_EXPIRED") {
    const client = await this.getPool().connect();
    try { await this.audit(client,"LOGIN","failed",null,null,null,null,reason); }
    finally { client.release(); }
  }
  async resolveSession(token: string) {
    if (!token || token.length > 256) return null;
    const client = await this.getPool().connect();
    try {
      const result = await client.query<{issuer:string;subject:string}>(
        "SELECT s.issuer,s.subject FROM auth_sessions s WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL",[hash(token)]);
      if (!result.rows[0]) return null;
      const binding = await this.binding(client, { ...result.rows[0], authenticationMethods: [] });
      return binding ? toTrustedActor(binding) : null;
    } finally { client.release(); }
  }
  async revokeSession(token: string) {
    const client = await this.getPool().connect();
    try {
      await client.query("BEGIN");
      const value = hash(token);
      const result = await client.query<{user_id:string}>(
        "UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING user_id",[value]);
      await this.audit(client,"LOGOUT",result.rows[0] ? "allowed" : "denied",null,null,result.rows[0]?.user_id ?? null,value,result.rows[0] ? "SESSION_REVOKED" : "SESSION_UNKNOWN");
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
}
