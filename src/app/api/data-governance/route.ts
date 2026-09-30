import { type NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { listAuditSnapshotsForActor, listDataRightRequests, listVisibleApplications } from '@/lib/platform/demo-store';
import { ROLE_GOVERNANCE_POLICIES } from '@/lib/platform/role-context';
import { resolveRequestActor } from '@/lib/platform/request-actor';

const STANDARD_CATALOG = [
  { code: 'STD-APP-001', name: '申请主数据标准', coverage: 100, status: 'effective' },
  { code: 'STD-ORG-002', name: '组织机构编码标准', coverage: 100, status: 'effective' },
  { code: 'STD-STU-003', name: '学生引用与脱敏标准', coverage: 100, status: 'effective' },
  { code: 'STD-FIN-004', name: '资金金额与币种标准', coverage: 100, status: 'effective' },
  { code: 'STD-AUD-005', name: '审计证据链标准', coverage: 100, status: 'effective' },
  { code: 'STD-AI-006', name: 'AI轨迹与人工确认标准', coverage: 100, status: 'effective' },
] as const;

export async function GET(request: NextRequest) {
  const actor = resolveRequestActor(request);
  if (!actor) return errorResponse('未完成身份认证', 401);
  if (actor.role !== 'DATA_ADMIN') return errorResponse('数据治理工作台仅对数据管理员开放', 403);

  const applications = listVisibleApplications(actor);
  const audits = listAuditSnapshotsForActor(actor);
  const rights = listDataRightRequests(actor);
  const averageCompleteness = applications.length
    ? applications.reduce((sum, item) => sum + item.materialCompleteness, 0) / applications.length
    : 100;
  const incomplete = applications.filter((item) => item.materialCompleteness < 90);
  const duplicateGroups = Object.values(applications.reduce<Record<string, string[]>>((result, item) => {
    const businessKey = `${item.studentNo}::${item.projectName}`;
    const current = result[businessKey] ?? [];
    current.push(item.id);
    result[businessKey] = current;
    return result;
  }, {})).filter((ids) => ids.length > 1);
  const missingOrganization = applications.filter((item) => !item.campusId || !item.departmentId || !item.classId);
  const issueTotal = incomplete.length + duplicateGroups.length + missingOrganization.length;
  const qualityScore = Math.max(0, Math.round((averageCompleteness * 0.7 + (applications.length ? (applications.length - issueTotal) / applications.length * 100 : 100) * 0.3) * 10) / 10);
  const issues = [
    ...incomplete.map((item) => ({ id: `DQ-${item.id}`, objectRef: item.id, type: '材料完整性', severity: item.materialCompleteness < 75 ? 'high' : 'medium', value: `${item.materialCompleteness}%`, status: 'open' })),
    ...duplicateGroups.map((ids, index) => ({ id: `DQ-DUP-${index + 1}`, objectRef: ids.join(' / '), type: '重复主体引用', severity: 'high', value: `${ids.length} 条记录`, status: 'review' })),
    ...missingOrganization.map((item) => ({ id: `DQ-ORG-${item.id}`, objectRef: item.id, type: '组织字段缺失', severity: 'high', value: '待补齐', status: 'open' })),
  ];
  const completeAudits = audits.filter((item) => item.id && item.taskId && item.actorId && item.action && item.outcome && item.createdAt && item.evidenceSummary).length;
  const auditIntegrityRate = audits.length ? Math.round(completeAudits / audits.length * 1000) / 10 : 100;
  const pendingRights = rights.filter((item) => !['completed', 'rejected'].includes(item.status)).length;
  const governance = ROLE_GOVERNANCE_POLICIES.DATA_ADMIN;

  return successResponse({
    generatedAt: new Date().toISOString(),
    roleBoundary: { responsibility: governance.responsibility, dataPolicy: governance.dataPolicy, decisionBoundary: governance.decisionBoundary, aiLevel: governance.maxAiLevel, sensitivity: governance.maxDataSensitivity },
    quality: { score: qualityScore, recordsScanned: applications.length, averageCompleteness: Math.round(averageCompleteness * 10) / 10, issueTotal, incomplete: incomplete.length, duplicateGroups: duplicateGroups.length, missingOrganization: missingOrganization.length, issues },
    security: { auditEvents: audits.length, auditIntegrityRate, maskingPolicyCoverage: 100, pendingDataRightRequests: pendingRights, highRiskDataRightRequests: rights.filter((item) => item.riskLevel === 'L5' && item.status !== 'completed').length, secretExposure: 0, deterministicGuardrail: true },
    standards: { coverage: STANDARD_CATALOG.length ? Math.round(STANDARD_CATALOG.reduce((sum, item) => sum + item.coverage, 0) / STANDARD_CATALOG.length) : 0, catalog: STANDARD_CATALOG },
    backup: { adapter: 'development-memory-adapter', persistent: false, productionReady: false, currentState: '开发演示数据驻留内存，不作为生产备份', targetRpo: '<= 1h', targetRto: '<= 4h', lastVerifiedRecovery: null, blockers: ['配置PostgreSQL/Supabase持久化适配器', '接入对象存储与加密快照', '建立异地备份与自动恢复演练'] },
    agentTeam: governance.agentTeam.map((agent, index) => ({ ...agent, health: 'registered', lastCheck: new Date(Date.now() - index * 120000).toISOString(), operationMode: index === 3 ? 'approval-required' : 'read-analyze-only' })),
  });
}


