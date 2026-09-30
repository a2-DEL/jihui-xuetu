import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { ActorContext } from "./authorization";

export type MaterialRecordStatus = "staged" | "submitted" | "verified" | "needs_review" | "deleted";
export interface ApplicationMaterialRecord {
  id: string;
  ownerId: string;
  applicationId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  submissionMethod: "online-upload";
  source: string;
  status: MaterialRecordStatus;
  uploadedAt: string;
  submittedAt?: string;
}

const runtimeRoot = resolve(process.cwd(), ".runtime", "application-materials");
const metadataFile = join(runtimeRoot, "metadata.json");
const bytesRoot = join(runtimeRoot, "objects");
const allowedMime = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxBytes = 10 * 1024 * 1024;
const maxTotalBytes = 50 * 1024 * 1024;
function detectMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}
function isWithin(root: string, target: string) { const value = relative(resolve(root), resolve(target)); return value !== "" && !value.startsWith("..") && !isAbsolute(value); }
type GlobalMaterialState = typeof globalThis & { __jhxtMaterialRecords?: ApplicationMaterialRecord[] };
const globalState = globalThis as GlobalMaterialState;
function loadRecords(): ApplicationMaterialRecord[] {
  if (globalState.__jhxtMaterialRecords) return globalState.__jhxtMaterialRecords;
  let records: ApplicationMaterialRecord[] = [];
  if (existsSync(metadataFile)) {
    try { const parsed = JSON.parse(readFileSync(metadataFile, "utf8")) as unknown; if (Array.isArray(parsed)) records = parsed as ApplicationMaterialRecord[]; } catch { records = []; }
  }
  globalState.__jhxtMaterialRecords = records;
  return records;
}
function persist(records: ApplicationMaterialRecord[]) {
  mkdirSync(dirname(metadataFile), { recursive: true });
  const temp = `${metadataFile}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  renameSync(temp, metadataFile);
}
export function stageApplicationMaterial(actor: ActorContext, input: { name: string; mimeType: string; bytes: Uint8Array }): ApplicationMaterialRecord {
  if (actor.role !== "STUDENT") throw new Error("ROLE_DENIED");
  const name = input.name.trim().slice(0, 160);
  if (!name || !allowedMime.has(input.mimeType)) throw new Error("FILE_TYPE_DENIED");
  if (!input.bytes.byteLength || input.bytes.byteLength > maxBytes) throw new Error("FILE_SIZE_DENIED");
  const ownerBytes = loadRecords().filter((item) => item.ownerId === actor.userId && item.status === "staged").reduce((sum, item) => sum + item.sizeBytes, 0);
  if (ownerBytes + input.bytes.byteLength > maxTotalBytes) throw new Error("TOTAL_FILE_SIZE_DENIED");
  if (detectMime(input.bytes) !== input.mimeType) throw new Error("FILE_CONTENT_TYPE_MISMATCH");
  if (Buffer.from(input.bytes).toString("latin1").includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) throw new Error("MALWARE_DETECTED");
  const id = `MAT-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const storageKey = join(actor.userId, `${id}.bin`); const absolute = resolve(bytesRoot, storageKey);
  if (!isWithin(bytesRoot, absolute)) throw new Error("UNSAFE_STORAGE_PATH");
  mkdirSync(dirname(absolute), { recursive: true }); writeFileSync(absolute, input.bytes, { flag: "wx" });
  const record: ApplicationMaterialRecord = { id, ownerId: actor.userId, name, mimeType: input.mimeType, sizeBytes: input.bytes.byteLength, sha256: createHash("sha256").update(input.bytes).digest("hex"), storageKey, submissionMethod: "online-upload", source: "学生在线上传", status: "staged", uploadedAt: new Date().toISOString() };
  const records = loadRecords(); records.unshift(record); persist(records); return structuredClone(record);
}
export function listStagedApplicationMaterials(actor: ActorContext): ApplicationMaterialRecord[] { return loadRecords().filter(item => item.ownerId === actor.userId && item.status === "staged").map(item => structuredClone(item)); }
export function removeStagedApplicationMaterial(actor: ActorContext, id: string): ApplicationMaterialRecord | null {
  const records = loadRecords(); const record = records.find(item => item.id === id && item.ownerId === actor.userId && item.status === "staged"); if (!record) return null;
  const absolute = resolve(bytesRoot, record.storageKey); if (!isWithin(bytesRoot, absolute)) throw new Error("UNSAFE_STORAGE_PATH"); if (existsSync(absolute)) unlinkSync(absolute); record.status = "deleted"; persist(records); return structuredClone(record);
}
export function claimApplicationMaterials(actor: ActorContext, ids: readonly string[], applicationId: string): ApplicationMaterialRecord[] {
  const unique = [...new Set(ids)]; const records = loadRecords(); const selected = unique.map(id => records.find(item => item.id === id && item.ownerId === actor.userId && item.status === "staged"));
  if (selected.some(item => !item)) throw new Error("MATERIAL_NOT_FOUND_OR_ALREADY_CLAIMED");
  const submittedAt = new Date().toISOString(); for (const item of selected as ApplicationMaterialRecord[]) { item.applicationId = applicationId; item.status = "submitted"; item.submittedAt = submittedAt; }
  persist(records); return (selected as ApplicationMaterialRecord[]).map(item => structuredClone(item));
}
export function listApplicationMaterialRecords(applicationId: string): ApplicationMaterialRecord[] { return loadRecords().filter(item => item.applicationId === applicationId && item.status !== "deleted").map(item => structuredClone(item)); }
export function getApplicationMaterialRecord(id: string): ApplicationMaterialRecord | null { const record = loadRecords().find(item => item.id === id && item.status !== "deleted"); return record ? structuredClone(record) : null; }
export function readApplicationMaterialBytes(id: string): Uint8Array {
  const record = loadRecords().find(item => item.id === id && item.status !== "deleted"); if (!record) throw new Error("MATERIAL_NOT_FOUND");
  const absolute = resolve(bytesRoot, record.storageKey); if (!isWithin(bytesRoot, absolute) || !existsSync(absolute)) throw new Error("MATERIAL_OBJECT_NOT_FOUND"); return new Uint8Array(readFileSync(absolute));
}
export function removeDraftApplicationMaterial(actor: ActorContext, id: string, applicationId: string): ApplicationMaterialRecord | null {
  const records = loadRecords(); const record = records.find(item => item.id === id && item.ownerId === actor.userId && item.applicationId === applicationId && item.status === "submitted"); if (!record || actor.role !== "STUDENT") return null;
  const absolute = resolve(bytesRoot, record.storageKey); if (!isWithin(bytesRoot, absolute)) throw new Error("UNSAFE_STORAGE_PATH"); if (existsSync(absolute)) unlinkSync(absolute); record.status = "deleted"; persist(records); return structuredClone(record);
}
export function materialStoreStatus() { const records = loadRecords(); return { total: records.filter(item => item.status !== "deleted").length, staged: records.filter(item => item.status === "staged").length, submitted: records.filter(item => item.status === "submitted").length, storage: "local-object-adapter" as const, maxBytes, maxTotalBytes, allowedMime: [...allowedMime] }; }


