import type { ActorContext } from "@/lib/platform/authorization";
import { getCollaborationSnapshot, type CollaborationTraceKind } from "./hardship-collaboration-store";
import { getHardshipVideoFinanceProjection } from "@/lib/platform/hardship-video-disbursement-store";
import { getHardshipVideoBankSnapshot } from "@/lib/platform/hardship-video-disbursement-store";
import { listAuditTaskEvidenceIndex, verifyAuditChain, verifyAuditTaskChain } from "@/lib/platform/audit-evidence-store";

const ASSET_ROUTES: Record<string, string> = {
  "workflow-temporary-hardship-grant": "/agent/studio?view=workflows",
  "studio-skill-material-precheck": "/agent/studio?view=skills",
  "studio-skill-grant-reconciliation": "/agent/studio?view=skills",
  "studio-plugin-parser": "/agent/studio?view=plugins",
  "studio-mcp-bank-grant": "/bank/portal#mcp",
};
const DIMENSION_LABELS = ["角色", "组织", "数据", "时间", "地理", "流程", "AI风险", "敏感度", "操作"];

function unique(values: Array<string | undefined>) { return Array.from(new Set(values.filter((value): value is string => Boolean(value)))); }
function kindName(kind: CollaborationTraceKind | "MODEL"): string { return ({ WORKFLOW: "工作流", MODEL: "模型", RAG: "RAG", SKILL: "Skill", PLUGIN: "插件", MCP: "MCP", PERMISSION: "权限", AUDIT: "审计" } as const)[kind]; }

export function getCollaborationEvidenceReport(actor: ActorContext, runId: string) {
  const snapshot = getCollaborationSnapshot(actor, runId);
  const run = snapshot.selectedRun;
  const finance = run.scenario ? getHardshipVideoFinanceProjection() : null;
  const bank = run.scenario ? getHardshipVideoBankSnapshot(actor) : null;
  const auditIndex = listAuditTaskEvidenceIndex(run.id);
  const integrity = verifyAuditChain();
  const taskIntegrity = verifyAuditTaskChain(run.id);
  const successfulTraces = run.traces.filter(item => item.status === "success");
  const actualMcpCalls = bank?.calls.length ?? (finance?.receipt ? 5 : 0);

  const modelAsset = {
    id: "model-gateway-deepseek",
    name: run.planning.model,
    kind: "MODEL" as const,
    kindName: "模型",
    version: "gateway-route-2026.08",
    status: run.planning.source === "deepseek" ? "success" as const : "fallback" as const,
    installed: true,
    executionCount: successfulTraces.filter(item => item.kind === "MODEL").length,
    latencyMs: run.planning.latencyMs,
    stages: ["plan"],
    inputSummary: "仅接收固定流程、模拟场景摘要和安全约束，不接收姓名、证件号、银行卡或原始材料。",
    outputSummary: run.planning.summary,
    evidenceIds: [] as string[],
    route: "/model-center",
    metric: `${run.planning.tokenUsage} tokens`,
  };
  const ragTrace = successfulTraces.filter(item => item.kind === "RAG");
  const ragStages = run.stages.filter(stage => stage.assetIds.some(id => id.startsWith("policy-rag")));
  const ragAsset = {
    id: "policy-rag-emergency-aid",
    name: "临时困难补助政策RAG",
    kind: "RAG" as const,
    kindName: "RAG",
    version: ragTrace.at(-1)?.version ?? "policy-kb-2026.08",
    status: ragTrace.length ? "success" as const : "not_executed" as const,
    installed: true,
    executionCount: ragTrace.length,
    latencyMs: ragTrace.reduce((sum, item) => sum + item.latencyMs, 0),
    stages: ragStages.map(stage => stage.id),
    inputSummary: ragStages.map(stage => stage.actionSummary).join("；"),
    outputSummary: ragStages.map(stage => stage.result).filter(Boolean).join("；"),
    evidenceIds: unique(ragStages.map(stage => stage.evidenceId)),
    route: "/knowledge/retrieval",
    metric: "政策引用已冻结",
  };
  const registeredAssets = snapshot.assets.map(asset => {
    const traces = successfulTraces.filter(item => item.name === asset.id);
    const stages = run.stages.filter(stage => stage.assetIds.includes(asset.id));
    const actualCount = asset.kind === "mcp" ? actualMcpCalls : traces.length;
    return {
      id: asset.id,
      name: asset.name,
      kind: asset.kind.toUpperCase() as "WORKFLOW" | "SKILL" | "PLUGIN" | "MCP",
      kindName: kindName(asset.kind.toUpperCase() as CollaborationTraceKind),
      version: `v${asset.version}`,
      status: actualCount > 0 ? "success" as const : "not_executed" as const,
      installed: asset.healthy,
      executionCount: actualCount,
      latencyMs: traces.reduce((sum, item) => sum + item.latencyMs, 0),
      stages: stages.map(stage => stage.id),
      inputSummary: stages.map(stage => stage.actionSummary).join("；"),
      outputSummary: stages.map(stage => stage.result).filter(Boolean).join("；"),
      evidenceIds: unique(stages.map(stage => stage.evidenceId)),
      route: ASSET_ROUTES[asset.id] ?? "/agent/studio",
      metric: asset.kind === "mcp" ? `${actualCount}次JSON-RPC` : `${actualCount}次成功span`,
    };
  });

  const stages = run.stages.map(stage => {
    const stageTraces = run.traces.filter(item => item.stageId === stage.id);
    const stageMessages = run.messages.filter(item => item.stageId === stage.id);
    const stageAudits = auditIndex.filter(item => item.targetId === stage.id || item.action.endsWith(`:${stage.id}`));
    const dimensions = stage.permission?.dimensions.map((item, index) => ({ code: item.code, label: DIMENSION_LABELS[index] ?? item.name, status: item.status, reason: item.reason })) ?? [];
    return {
      id: stage.id,
      sequence: stage.sequence,
      phase: stage.phase,
      title: stage.title,
      status: stage.status,
      roleCode: stage.roleCode,
      roleName: stage.roleName,
      agentCode: stage.agentCode,
      agentName: stage.agentName,
      humanGate: stage.humanGate,
      confirmedBy: stage.confirmedBy,
      durationMs: stage.durationMs ?? 0,
      result: stage.result ?? "尚未执行",
      businessRoute: stage.businessRoute,
      permission: { allowed: stage.permission?.allowed ?? false, passed: dimensions.filter(item => item.status === "ALLOW").length, total: dimensions.length, fieldMode: stage.permission?.fieldMode ?? "hidden", dimensions },
      traces: stageTraces.map(item => ({ id: item.id, kind: item.kind, name: item.name, version: item.version, status: item.status, latencyMs: item.latencyMs, detail: item.detail, evidenceId: item.evidenceId })),
      messages: stageMessages.map(item => ({ id: item.id, sequence: item.sequence, senderType: item.senderType, senderName: item.senderName, senderRole: item.senderRole, type: item.type, content: item.content, evidenceRefs: item.evidenceRefs, createdAt: item.createdAt })),
      messageCount: stageMessages.length,
      auditEvidenceIds: unique([stage.evidenceId, ...stageAudits.map(item => item.id), ...stageTraces.map(item => item.evidenceId)]),
      evidenceRefs: unique(stageMessages.flatMap(item => item.evidenceRefs)),
    };
  });
  const completed = stages.filter(stage => stage.status === "completed").length;
  const confirmed = stages.filter(stage => !stage.humanGate || stage.confirmedBy).length;
  const stageMessageCoverage = stages.filter(stage => stage.messageCount > 0).length;
  const stageTraceCoverage = stages.filter(stage => stage.traces.some(item => item.kind === "PERMISSION") && stage.traces.some(item => item.kind === "AUDIT")).length;
  const stageAuditCoverage = stages.filter(stage => auditIndex.some(item => item.targetId === stage.id || item.action.endsWith(`:${stage.id}`))).length;
  const syncedObjects = run.businessObjects.filter(item => item.type === "policy" || item.syncStatus === "synced").length;

  return {
    generatedAt: new Date().toISOString(),
    mode: "same-run-evidence-projection" as const,
    run: { id: run.id, runNo: run.runNo, title: run.title, status: run.status, workflowId: run.workflowId, workflowVersion: run.workflowVersion, scenario: run.scenario, createdAt: run.createdAt, finishedAt: run.finishedAt, elapsedMs: run.summary?.elapsedMs ?? 0, version: run.version, command: run.command },
    result: { completedStages: completed, totalStages: stages.length, confirmedGates: stages.filter(stage => stage.humanGate && stage.confirmedBy).length, totalHumanGates: stages.filter(stage => stage.humanGate).length, businessObjects: run.businessObjects.length, syncedObjects, summary: run.summary?.result ?? "运行尚未完成", amount: finance?.batch?.amount ?? 0, applicationStatus: run.businessObjects.find(item => item.type === "application")?.status ?? "尚未生成", batchNo: finance?.batch?.batchNo, receiptNo: finance?.receipt?.receiptNo, reconciliation: finance?.reconciliation?.result, arrivalNoticeId: run.businessObjects.find(item => item.type === "arrival_notice")?.id },
    model: modelAsset,
    assets: [ragAsset, ...registeredAssets],
    stages,
    businessObjects: run.businessObjects,
    finance,
    bank,
    audit: { ...taskIntegrity, global: integrity, taskEvidenceCount: auditIndex.length, evidence: auditIndex, evidenceIds: auditIndex.map(item => item.id) },
    consistency: {
      stageStatus: { passed: completed, total: stages.length, valid: completed === stages.length },
      humanGates: { passed: confirmed, total: stages.length, valid: confirmed === stages.length },
      messages: { passed: stageMessageCoverage, total: stages.length, valid: stageMessageCoverage === stages.length },
      traces: { passed: stageTraceCoverage, total: stages.length, valid: stageTraceCoverage === stages.length },
      audits: { passed: stageAuditCoverage, total: stages.length, valid: stageAuditCoverage === stages.length },
      businessObjects: { passed: syncedObjects, total: run.businessObjects.length, valid: syncedObjects === run.businessObjects.length },
      overall: run.status === "completed" && taskIntegrity.valid && completed === stages.length && confirmed === stages.length && stageMessageCoverage === stages.length && stageTraceCoverage === stages.length && stageAuditCoverage === stages.length && syncedObjects === run.businessObjects.length,
    },
    security: { dataMode: run.scenario?.dataMode ?? "simulated", externalMoneyMovement: bank?.security.externalMoneyMovement ?? false, accountFieldMode: bank?.security.accountFieldMode ?? "masked", advisoryOnly: true, statement: "本报告由同一运行实例、同一业务真值源和同一审计链即时投影；不复制业务状态，不触达真实银行资金网络。" },
  };
}

export type CollaborationEvidenceReport = ReturnType<typeof getCollaborationEvidenceReport>;

