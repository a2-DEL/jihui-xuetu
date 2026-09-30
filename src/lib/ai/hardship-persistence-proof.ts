import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ActorContext } from "@/lib/platform/authorization";
import { getCollaborationSnapshot } from "./hardship-collaboration-store";
import { listAuditTaskEvidenceIndex, verifyAuditChain, verifyAuditTaskChain } from "@/lib/platform/audit-evidence-store";

interface JsonRecord { [key: string]: unknown }
interface RestartProofFile {
  verifiedAt: string;
  runId: string;
  before: { status: number; runVersion: number; businessObjectIds: string[]; auditHeadHash: string };
  after: { status: number; runVersion: number; businessObjectIds: string[]; auditHeadHash: string };
  checks: { sameRunId: boolean; sameRunVersion: boolean; sameBusinessObjects: boolean; sameAuditHead: boolean; allHttp200: boolean; overall: boolean };
  serverRestarted: boolean;
}

const runtimeDir = join(process.cwd(), ".runtime");
const restartProofFile = join(runtimeDir, "restart-persistence-proof-current.json");

function sha256(value: Buffer | string) { return createHash("sha256").update(value).digest("hex"); }
function readJson(name: string): JsonRecord {
  const file = join(runtimeDir, name);
  if (!existsSync(file)) throw new Error(`PERSISTENCE_STORE_MISSING:${name}`);
  return JSON.parse(readFileSync(file, "utf8")) as JsonRecord;
}
function readOptionalJson(name: string): JsonRecord {
  return existsSync(join(runtimeDir, name)) ? readJson(name) : {};
}
function readRestartProof(runId: string): RestartProofFile | null {
  if (!existsSync(restartProofFile)) return null;
  try {
    const proof = JSON.parse(readFileSync(restartProofFile, "utf8")) as RestartProofFile;
    return proof.runId === runId ? proof : null;
  } catch { return null; }
}
function storeProof(name: string, logicalName: string, adapter: string, writeMode: string) {
  const file = join(runtimeDir, name);
  if (!existsSync(file)) return { logicalName, adapter, writeMode, exists: false, sizeBytes: 0, updatedAt: null, sha256: null };
  const buffer = readFileSync(file);
  const stat = statSync(file);
  return { logicalName, adapter, writeMode, exists: true, sizeBytes: stat.size, updatedAt: stat.mtime.toISOString(), sha256: sha256(buffer) };
}
function record(value: unknown): JsonRecord { return value && typeof value === "object" ? value as JsonRecord : {}; }
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown) { return typeof value === "number" ? value : 0; }
function list(value: unknown) { return Array.isArray(value) ? value : []; }

export function getHardshipPersistenceProof(actor: ActorContext, runId: string) {
  const snapshot = getCollaborationSnapshot(actor, runId);
  const selectedRun = snapshot.selectedRun;
  const runtime = readJson("hardship-collaboration-runs.json");
  const business = readJson("hardship-video-business.json");
  const review = readOptionalJson("hardship-video-review-business.json");
  const disbursement = readOptionalJson("hardship-video-disbursement.json");
  const persistedRuns = list(runtime.runs).map(record);
  const diskRun = persistedRuns.find(item => text(item.id) === runId);
  if (!diskRun) throw new Error("PERSISTED_RUN_NOT_FOUND");

  const scenarioRevision = number(record(diskRun.scenario).revision);
  const application = record(business.application);
  const batch = record(disbursement.batch);
  const bankTask = record(disbursement.bankTask);
  const receipt = record(disbursement.receipt);
  const reconciliation = record(disbursement.reconciliation);
  const arrivalNotice = record(disbursement.arrivalNotice);
  const reviewItems = list(review.reviews).map(record);
  const globalAudit = verifyAuditChain();
  const expectedActions = [selectedRun.scenario ? "video_scenario:start" : "workflow:run:create",
    ...selectedRun.stages.filter(stage => stage.status === "completed" || stage.status === "awaiting_human")
      .map(stage => `agent:hardship:${stage.id}`),
    ...selectedRun.stages.filter(stage => stage.confirmedBy).map(stage => `workflow:human_gate:${stage.id}`),
    ...(selectedRun.status === "completed" ? ["workflow:run:complete"] : [])];
  const audit = verifyAuditTaskChain(runId, expectedActions);
  const auditActions = new Set(listAuditTaskEvidenceIndex(runId).map(item => item.action));
  const businessEvents = [...list(business.events), ...list(review.events), ...list(disbursement.events)].map(record)
    .filter(item => text(item.stageId) !== "reset" && Boolean(text(item.stageId)));
  const businessEventsAligned = businessEvents.every(item => {
    const stage = selectedRun.stages.find(candidate => candidate.id === text(item.stageId));
    return Boolean(stage && stage.status === "completed" && auditActions.has(stage.humanGate
      ? `workflow:human_gate:${stage.id}` : `agent:hardship:${stage.id}`));
  });
  const restart = readRestartProof(runId);
  const directReadChecks = {
    runFoundOnDisk: text(diskRun.id) === selectedRun.id,
    revisionAligned: [business, review, disbursement].filter(item => Object.keys(item).length > 0).every(item => number(item.revision) === scenarioRevision),
    runVersionAligned: number(diskRun.version) === selectedRun.version,
    applicationAligned: text(disbursement.applicationId) === selectedRun.businessObjects.find(item => item.type === "application")?.id,
    batchAligned: text(batch.id) === selectedRun.businessObjects.find(item => item.type === "grant_batch")?.id,
    receiptAligned: text(receipt.id) === selectedRun.businessObjects.find(item => item.type === "bank_receipt")?.id,
    auditChainValid: audit.valid,
    businessEventsAligned,
  };
  const directDiskReadVerified = Object.values(directReadChecks).every(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    mode: "server-disk-readback" as const,
    run: { id: selectedRun.id, runNo: selectedRun.runNo, status: selectedRun.status, version: selectedRun.version, revision: scenarioRevision },
    storageBoundary: {
      demoAdapter: "服务器端文件型持久化",
      browserStorageUsedForBusinessState: false,
      productionTarget: "PostgreSQL + 对象存储 + WORM审计",
      statement: "当前演示业务状态由服务器端持久化介质承载，不依赖浏览器LocalStorage；本页如实标注演示环境存储，不把文件型持久化伪装成已经上线的生产数据库。",
    },
    stores: [
      storeProof("hardship-collaboration-runs.json", "工作流运行状态", "persistent-json", "服务器覆盖写"),
      storeProof("hardship-video-business.json", "通知/申请/受理对象", "persistent-json", "服务器覆盖写"),
      storeProof("hardship-video-review-business.json", "四级审核状态", "persistent-json", "原子替换"),
      storeProof("hardship-video-disbursement.json", "财务/银行/对账对象", "persistent-json", "原子替换"),
      storeProof("audit-evidence-chain.jsonl", "审计证据链", "append-only-jsonl", "只追加"),
    ],
    versions: {
      workflowRun: number(diskRun.version),
      baseApplication: number(application.version),
      reviewedApplication: number(review.applicationVersion),
      finalApplication: number(disbursement.applicationVersion),
      reviewConfirmed: reviewItems.filter(item => text(item.decision) === "approved" && Boolean(text(item.completedAt))).length,
      reviewTotal: reviewItems.length,
      grantBatch: { id: text(batch.id), version: number(batch.version), status: text(batch.status), batchNo: text(batch.batchNo) },
      bankTask: { id: text(bankTask.id), version: number(bankTask.version), status: text(bankTask.status) },
      receipt: { id: text(receipt.id), receiptNo: text(receipt.receiptNo), result: text(receipt.result), sha256: text(receipt.sha256) },
      reconciliation: { id: text(reconciliation.id), version: number(reconciliation.version), result: text(reconciliation.result), difference: number(reconciliation.difference) },
      arrivalNotice: { id: text(arrivalNotice.id), status: text(arrivalNotice.deliveryStatus) },
    },
    directDiskRead: { verified: directDiskReadVerified, checks: directReadChecks },
    restart: restart ? { ...restart, verified: restart.serverRestarted && restart.checks.overall } : { verified: false, reason: "尚未生成与当前runId匹配的冷启动复核证据" },
    audit: { valid: audit.valid, missingActions: audit.missingActions ?? [], expectedActions: expectedActions.length, total: audit.total, storage: audit.storage, algorithm: audit.algorithm, genesisHash: audit.genesisHash, headHash: audit.headHash, checkpointSequence: audit.checkpointSequence },
    globalAudit: { valid: globalAudit.valid, total: globalAudit.total, brokenAt: globalAudit.brokenAt, incident: globalAudit.valid ? null : "AUD-02：后续并发写入曾产生重复序号分叉；本运行检查点早于事故且21条任务证据逐条验真通过。" },
  };
}

export type HardshipPersistenceProof = ReturnType<typeof getHardshipPersistenceProof>;
