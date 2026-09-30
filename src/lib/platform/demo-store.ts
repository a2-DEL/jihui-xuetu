import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type ActorContext } from './authorization';
import { appendAuditEvidence, type AuditEvidenceInput } from './audit-evidence-store';
import { claimApplicationMaterials, listApplicationMaterialRecords } from './application-material-store';
import { ROLE_PROFILES } from './roles';
import { getHardshipVideoApplicationProjection } from './hardship-video-business-store';

export type ApplicationStatus =
  | '草稿'
  | '待辅导员初审'
  | '待院系复核'
  | '待校级复审'
  | '待领导审批'
  | '待公示'
  | '公示中'
  | '待发放'
  | '已完成'
  | '已退回补正'
  | '已驳回'
  | '申诉处理中';

export type ApplicationSubmissionChannel = 'web' | 'mobile' | 'service-counter' | 'batch-import';
export type MaterialSubmissionMethod = 'online-upload' | 'data-authorization' | 'mixed' | 'offline-verification';

export interface DemoApplication {
  id: string;
  studentName: string;
  studentNo: string;
  ownerId: string;
  campusId: string;
  departmentId: string;
  classId: string;
  projectName: string;
  requestedAmount: number;
  status: ApplicationStatus;
  riskLevel: '低' | '中' | '高';
  materialCompleteness: number;
  submittedAt: string;
  overdue: boolean;
  grantBatchId?: string;
  auditTaskId?: string;
  version?: number;
  updatedAt?: string;
  lastComment?: string;
  submissionChannel?: ApplicationSubmissionChannel;
  materialSubmissionMethod?: MaterialSubmissionMethod;
  academicYear?: string;
  semester?: string;
  applicantStatement?: string;
  familyAnnualIncome?: number;
  familyMembers?: number;
  specialCircumstance?: string;
  bankName?: string;
  bankAccountLast4?: string;
  materialCount?: number;
  materialVerifiedCount?: number;
  submissionReceiptNo?: string;
  offlineReceiptNo?: string;
  authorizationSources?: string[];
  eligibilityReportId?: string;
  precheckReportId?: string;
  precheckScore?: number;
  precheckWarnings?: string[];
  precheckWaiverConfirmed?: boolean;
  intakeTicketId?: string;
  scenarioId?: string;
  scenarioRevision?: number;
}

export interface DemoNotification {
  id: string;
  recipientRole: string;
  title: string;
  content: string;
  createdAt: string;
  sourceTaskId: string;
  applicationId?: string;
}

export interface AuditSnapshot {
  id: string;
  taskId: string;
  actorId: string;
  actorRole: ActorContext['role'];
  action: string;
  outcome: string;
  createdAt: string;
  evidenceSummary: string;
  evidenceHash?: string;
}

export type GrantBatchStatus = 'pending_business_approval' | 'pending_finance_execution' | 'sent_to_bank' | 'receipt_received' | 'reconciled' | 'exception';

export interface GrantBatch {
  id: string;
  batchNo: string;
  campusId: string;
  applicationIds: string[];
  expectedCount: number;
  expectedAmount: number;
  status: GrantBatchStatus;
  initiatedBy: string;
  businessApprovedBy?: string;
  executedBy?: string;
  // Demo-only assignee. Production must resolve bank grants from a persistent, scoped assignment table.
  bankAssigneeId?: string;
  bankOperatorId?: string;
  receiptNo?: string;
  actualCount?: number;
  actualAmount?: number;
  failedCount?: number;
  differenceAmount?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type GrantBatchAction = 'business_approve' | 'send_to_bank' | 'receive_bank_receipt' | 'reconcile';

export type FundingPolicyStatus = 'draft' | 'pending_approval' | 'published' | 'rejected' | 'retired';
export type FundingPolicyAction = 'submit' | 'approve' | 'reject' | 'retire';

export interface FundingPolicy {
  id: string;
  code: string;
  campusId: string;
  name: string;
  category: string;
  authority: string;
  versionNo: string;
  status: FundingPolicyStatus;
  summary: string;
  effectiveFrom: string;
  effectiveTo: string;
  sourceFileName: string;
  createdBy: string;
  reviewedBy?: string;
  reviewComment?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type AidProjectStatus = 'draft' | 'pending_approval' | 'active' | 'rejected' | 'suspended' | 'closed';
export type AidProjectAction = 'submit' | 'approve' | 'reject' | 'suspend' | 'reopen' | 'close' | 'adjust_quota';

export interface AidProject {
  id: string;
  code: string;
  campusId: string;
  policyId: string;
  name: string;
  category: string;
  academicYear: string;
  budgetAmount: number;
  defaultAmount: number;
  quota: number;
  usedQuota: number;
  applicationStart: string;
  applicationEnd: string;
  criteria: string;
  status: AidProjectStatus;
  createdBy: string;
  approvedBy?: string;
  lastComment?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}


export type DifficultyStatus = 'pending_democratic_review' | 'pending_department_review' | 'pending_school_confirmation' | 'confirmed' | 'returned';
export type DifficultyLevel = '一般困难' | '困难' | '特别困难' | '不予认定';
export type DifficultyAction = 'submit_democratic_review' | 'department_approve' | 'department_return' | 'school_confirm' | 'school_return' | 'restart_review';

export interface DifficultyAssessment {
  id: string;
  applicationId: string;
  campusId: string;
  departmentId: string;
  classId: string;
  studentName: string;
  studentNo: string;
  householdIncomePerCapita: number;
  burdenScore: number;
  specialFactors: string[];
  democraticVotesAgree: number;
  democraticVotesTotal: number;
  ruleScore: number;
  aiSuggestedLevel: DifficultyLevel;
  finalLevel?: DifficultyLevel;
  status: DifficultyStatus;
  riskFlags: string[];
  lastComment?: string;
  version: number;
  updatedAt: string;
}

export type PublicityStatus = 'draft' | 'open' | 'closed';
export type PublicityAction = 'publish' | 'submit_objection' | 'resolve_objection' | 'close';
export interface PublicityRecord {
  id: string;
  applicationId: string;
  campusId: string;
  departmentId: string;
  studentName: string;
  maskedStudentName: string;
  studentNo: string;
  projectName: string;
  proposedLevel: string;
  proposedAmount: number;
  status: PublicityStatus;
  startAt: string;
  endAt: string;
  objectionCount: number;
  unresolvedObjections: number;
  lastComment?: string;
  version: number;
  updatedAt: string;
}

export type AppealStatus = 'submitted' | 'pending_leader_review' | 'resolved_changed' | 'resolved_upheld' | 'withdrawn';
export type AppealAction = 'initial_review' | 'resolve_change' | 'resolve_uphold' | 'withdraw';
export interface AidAppeal {
  id: string;
  applicationId: string;
  ownerId: string;
  campusId: string;
  departmentId: string;
  classId: string;
  studentName: string;
  studentNo: string;
  projectName: string;
  originalStatus: ApplicationStatus;
  reason: string;
  evidenceCount: number;
  status: AppealStatus;
  submittedAt: string;
  handlerId?: string;
  decisionComment?: string;
  version: number;
  updatedAt: string;
}
export type FindingStatus = 'open' | 'investigating' | 'rectification' | 'closed';
export type FindingAction = 'acknowledge' | 'request_rectification' | 'submit_rectification' | 'close' | 'escalate_discipline';
export interface ComplianceFinding {
  id: string;
  campusId: string;
  assignedTaskId: string;
  domain: '资金' | '流程' | '数据' | 'AI行为';
  severity: '低' | '中' | '高' | '重大';
  title: string;
  description: string;
  responsibleDepartment: string;
  evidenceRefs: string[];
  status: FindingStatus;
  dueDate: string;
  lastComment?: string;
  version: number;
  updatedAt: string;
}

export type DisciplineCaseStatus = 'pending_dual_authorization' | 'investigating' | 'decision_pending' | 'closed';
export type DisciplineAction = 'second_authorize' | 'submit_investigation' | 'record_decision' | 'freeze_ai_rule';
export interface DisciplineCase {
  id: string;
  campusId: string;
  sourceFindingId: string;
  title: string;
  severity: '高' | '重大';
  status: DisciplineCaseStatus;
  authorizerIds: string[];
  conflictRisk: string;
  evidenceChainHash: string;
  aiRuleFrozen: boolean;
  decision?: string;
  lastComment?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export type OpinionLevel = '轻' | '中' | '重';
export type OpinionStatus = 'new' | 'assessed' | 'responding' | 'resolved';
export type OpinionAction = 'triage' | 'start_response' | 'resolve' | 'reopen';
export interface OpinionIncident {
  id: string;
  campusId: string;
  source: string;
  channel: string;
  title: string;
  summary: string;
  sentimentScore: number;
  aiSuggestedLevel: OpinionLevel;
  humanLevel?: OpinionLevel;
  status: OpinionStatus;
  relatedPublicityId?: string;
  responsePlan?: string;
  version: number;
  detectedAt: string;
  updatedAt: string;
}

export type DataRightType = 'access' | 'export' | 'correct' | 'delete' | 'restrict';
export type DataRightStatus = 'submitted' | 'verifying' | 'processing' | 'completed' | 'rejected';
export type DataRightAction = 'verify' | 'approve' | 'reject' | 'complete';
export interface DataRightRequest {
  id: string;
  ownerId: string;
  campusId: string;
  requesterName: string;
  requestType: DataRightType;
  dataScope: string;
  reason: string;
  status: DataRightStatus;
  riskLevel: 'L2' | 'L3' | 'L5';
  approvedBy?: string;
  completedBy?: string;
  decisionComment?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
interface DemoStore {
  applications: DemoApplication[];
  notifications: DemoNotification[];
  audits: AuditSnapshot[];
  idempotencyResults: Map<string, DemoApplication>;
  grantBatches: GrantBatch[];
  financeIdempotency: Map<string, GrantBatch>;
  fundingPolicies: FundingPolicy[];
  aidProjects: AidProject[];
  fundingIdempotency: Map<string, FundingPolicy | AidProject>;
  difficultyAssessments: DifficultyAssessment[];
  difficultyIdempotency: Map<string, DifficultyAssessment>;
  publicityRecords: PublicityRecord[];
  publicityIdempotency: Map<string, PublicityRecord>;
  appeals: AidAppeal[];
  appealIdempotency: Map<string, AidAppeal>;
  complianceFindings: ComplianceFinding[];
  findingIdempotency: Map<string, ComplianceFinding>;
  disciplineCases: DisciplineCase[];
  disciplineIdempotency: Map<string, DisciplineCase>;
  opinionIncidents: OpinionIncident[];
  opinionIdempotency: Map<string, OpinionIncident>;
  dataRightRequests: DataRightRequest[];
  dataRightIdempotency: Map<string, DataRightRequest>;
}

const initialApplications: DemoApplication[] = [
  { id: 'app-2026-001', studentName: '李明', studentNo: '2024001001', ownerId: 'demo-student', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', projectName: '国家助学金', requestedAmount: 3300, status: '待辅导员初审', riskLevel: '低', materialCompleteness: 100, submittedAt: '2026-08-01T09:20:00+08:00', overdue: false, grantBatchId: 'grant-batch-2026-spring', auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-002', studentName: '王芳', studentNo: '2024001002', ownerId: 'demo-student-002', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', projectName: '国家励志奖学金', requestedAmount: 5000, status: '待辅导员初审', riskLevel: '中', materialCompleteness: 88, submittedAt: '2026-07-29T10:00:00+08:00', overdue: true, grantBatchId: 'grant-batch-2026-spring', auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-003', studentName: '赵强', studentNo: '2024002001', ownerId: 'demo-student-003', campusId: 'campus-main', departmentId: 'dept-engineering', classId: 'class-eng-01', projectName: '临时困难补助', requestedAmount: 2000, status: '待院系复核', riskLevel: '高', materialCompleteness: 92, submittedAt: '2026-07-28T14:10:00+08:00', overdue: true, auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-004', studentName: '陈晨', studentNo: '2024001003', ownerId: 'demo-student-004', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-02', projectName: '勤工助学', requestedAmount: 1800, status: '待校级复审', riskLevel: '低', materialCompleteness: 100, submittedAt: '2026-07-27T11:45:00+08:00', overdue: false, auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-005', studentName: '刘洋', studentNo: '2024003001', ownerId: 'demo-student-005', campusId: 'campus-main', departmentId: 'dept-humanities', classId: 'class-hum-01', projectName: '生源地信用助学贷款', requestedAmount: 12000, status: '待发放', riskLevel: '低', materialCompleteness: 100, submittedAt: '2026-07-22T08:30:00+08:00', overdue: false, grantBatchId: 'grant-batch-2026-spring' },
  { id: 'app-2026-006', studentName: '周雨', studentNo: '2024001015', ownerId: 'demo-student-006', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', projectName: '国家助学金', requestedAmount: 3300, status: '公示中', riskLevel: '低', materialCompleteness: 100, submittedAt: '2026-07-20T10:20:00+08:00', overdue: false, auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-007', studentName: '张婷', studentNo: '2024001018', ownerId: 'demo-student-007', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', projectName: '国家励志奖学金', requestedAmount: 5000, status: '申诉处理中', riskLevel: '中', materialCompleteness: 96, submittedAt: '2026-07-19T09:10:00+08:00', overdue: false, auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-008', studentName: '李明', studentNo: '2024001001', ownerId: 'demo-student', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', projectName: '校级励志奖学金', requestedAmount: 3000, status: '已驳回', riskLevel: '低', materialCompleteness: 100, submittedAt: '2026-07-12T09:10:00+08:00', overdue: false, auditTaskId: 'audit-task-2026-01' },
  { id: 'app-2026-009', studentName: '陈晨', studentNo: '2024001003', ownerId: 'demo-student-004', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-02', projectName: '勤工助学', requestedAmount: 1800, status: '待公示', riskLevel: '低', materialCompleteness: 100, submittedAt: '2026-07-27T11:45:00+08:00', overdue: false, auditTaskId: 'audit-task-2026-01' },
];

const initialFundingPolicies: FundingPolicy[] = [
  { id: 'policy-national-grant-2026', code: 'POL-NATIONAL-GRANT', campusId: 'campus-main', name: '2026年度国家助学金实施细则', category: '国家资助', authority: '河北省教育厅、学校学生资助管理中心', versionNo: 'V2.1', status: 'published', summary: '明确困难等级、分档标准、评审公示及资金发放要求。', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', sourceFileName: '2026国家助学金实施细则.pdf', createdBy: 'demo-fund-admin', reviewedBy: 'demo-fund-leader', reviewComment: '经业务合规复核，同意发布。', version: 3, createdAt: '2026-01-05T09:00:00+08:00', updatedAt: '2026-01-12T15:30:00+08:00' },
  { id: 'policy-emergency-aid-2026', code: 'POL-EMERGENCY-AID', campusId: 'campus-main', name: '学生临时困难补助管理办法', category: '校级资助', authority: '学校学生资助管理中心', versionNo: 'V1.3', status: 'pending_approval', summary: '覆盖突发疾病、灾害及家庭重大变故场景，明确紧急通道与例外审批规则。', effectiveFrom: '2026-09-01', effectiveTo: '2028-08-31', sourceFileName: '临时困难补助办法_修订稿.docx', createdBy: 'demo-fund-admin', version: 2, createdAt: '2026-07-21T10:00:00+08:00', updatedAt: '2026-08-02T16:20:00+08:00' },
  { id: 'policy-work-study-2026', code: 'POL-WORK-STUDY', campusId: 'campus-main', name: '勤工助学岗位管理细则', category: '校内资助', authority: '学生工作部、财务处', versionNo: 'V1.0-draft', status: 'draft', summary: '规定岗位发布、工时核验、薪酬结算与学生权益保障。', effectiveFrom: '2026-09-01', effectiveTo: '2027-08-31', sourceFileName: '勤工助学岗位细则_草案.docx', createdBy: 'demo-fund-admin', version: 1, createdAt: '2026-08-01T14:00:00+08:00', updatedAt: '2026-08-01T14:00:00+08:00' },
];

const initialAidProjects: AidProject[] = [
  { id: 'project-national-grant-2026', code: 'PRJ-2026-NSG', campusId: 'campus-main', policyId: 'policy-national-grant-2026', name: '2026年度国家助学金', category: '国家助学金', academicYear: '2026-2027', budgetAmount: 3600000, defaultAmount: 3300, quota: 1090, usedQuota: 684, applicationStart: '2026-08-01', applicationEnd: '2026-09-20', criteria: '完成困难认定且处于在籍状态；按困难等级分档评审。', status: 'active', createdBy: 'demo-fund-admin', approvedBy: 'demo-fund-leader', lastComment: '预算与名额核验通过。', version: 3, createdAt: '2026-07-15T09:00:00+08:00', updatedAt: '2026-07-25T11:30:00+08:00' },
  { id: 'project-emergency-2026', code: 'PRJ-2026-EMG', campusId: 'campus-main', policyId: 'policy-emergency-aid-2026', name: '2026秋季临时困难补助', category: '临时困难补助', academicYear: '2026-2027', budgetAmount: 500000, defaultAmount: 2000, quota: 250, usedQuota: 37, applicationStart: '2026-09-01', applicationEnd: '2027-01-15', criteria: '发生重大疾病、自然灾害或家庭突发变故并提交有效佐证。', status: 'draft', createdBy: 'demo-fund-admin', lastComment: '与修订政策同步报审。', version: 2, createdAt: '2026-07-28T13:20:00+08:00', updatedAt: '2026-08-02T16:30:00+08:00' },
  { id: 'project-work-study-2026', code: 'PRJ-2026-WSS', campusId: 'campus-main', policyId: 'policy-work-study-2026', name: '2026秋季勤工助学岗位计划', category: '勤工助学', academicYear: '2026-2027', budgetAmount: 720000, defaultAmount: 800, quota: 300, usedQuota: 0, applicationStart: '2026-08-25', applicationEnd: '2026-09-10', criteria: '优先安排家庭经济困难学生，岗位工时与薪酬按月核验。', status: 'draft', createdBy: 'demo-fund-admin', version: 1, createdAt: '2026-08-02T10:00:00+08:00', updatedAt: '2026-08-02T10:00:00+08:00' },
];
const initialDifficultyAssessments: DifficultyAssessment[] = [
  { id: 'difficulty-001', applicationId: 'app-2026-001', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', studentName: '李明', studentNo: '2024001001', householdIncomePerCapita: 980, burdenScore: 78, specialFactors: ['低保边缘家庭', '多子女就学'], democraticVotesAgree: 0, democraticVotesTotal: 0, ruleScore: 82, aiSuggestedLevel: '特别困难', status: 'pending_democratic_review', riskFlags: [], version: 1, updatedAt: '2026-08-01T09:20:00+08:00' },
  { id: 'difficulty-002', applicationId: 'app-2026-002', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', studentName: '王芳', studentNo: '2024001002', householdIncomePerCapita: 1680, burdenScore: 62, specialFactors: ['单亲家庭'], democraticVotesAgree: 7, democraticVotesTotal: 9, ruleScore: 69, aiSuggestedLevel: '困难', status: 'pending_department_review', riskFlags: ['家庭收入材料日期临近失效'], lastComment: '班级民主评议已完成，7票同意。', version: 2, updatedAt: '2026-08-01T15:10:00+08:00' },
  { id: 'difficulty-003', applicationId: 'app-2026-003', campusId: 'campus-main', departmentId: 'dept-engineering', classId: 'class-eng-01', studentName: '赵强', studentNo: '2024002001', householdIncomePerCapita: 1320, burdenScore: 73, specialFactors: ['家庭成员重大疾病'], democraticVotesAgree: 8, democraticVotesTotal: 10, ruleScore: 76, aiSuggestedLevel: '困难', status: 'pending_school_confirmation', riskFlags: ['医疗支出金额需人工核验'], lastComment: '院系复核通过，建议认定为困难。', version: 3, updatedAt: '2026-08-02T10:30:00+08:00' },
  { id: 'difficulty-004', applicationId: 'app-2026-005', campusId: 'campus-main', departmentId: 'dept-humanities', classId: 'class-hum-01', studentName: '刘洋', studentNo: '2024003001', householdIncomePerCapita: 860, burdenScore: 88, specialFactors: ['建档立卡', '家庭成员残疾'], democraticVotesAgree: 10, democraticVotesTotal: 10, ruleScore: 93, aiSuggestedLevel: '特别困难', finalLevel: '特别困难', status: 'confirmed', riskFlags: [], lastComment: '校级确认通过。', version: 4, updatedAt: '2026-07-18T16:00:00+08:00' },
];
const initialPublicityRecords: PublicityRecord[] = [
  { id: 'publicity-001', applicationId: 'app-2026-006', campusId: 'campus-main', departmentId: 'dept-agri', studentName: '周雨', maskedStudentName: '周*', studentNo: '2024001015', projectName: '国家助学金', proposedLevel: '困难', proposedAmount: 3300, status: 'open', startAt: '2026-08-01', endAt: '2026-08-07', objectionCount: 1, unresolvedObjections: 1, lastComment: '校级复审名单第一批公示。', version: 2, updatedAt: '2026-08-01T08:00:00+08:00' },
  { id: 'publicity-002', applicationId: 'app-2026-009', campusId: 'campus-main', departmentId: 'dept-agri', studentName: '陈晨', maskedStudentName: '陈*', studentNo: '2024001003', projectName: '勤工助学', proposedLevel: '一般困难', proposedAmount: 1800, status: 'draft', startAt: '2026-08-08', endAt: '2026-08-14', objectionCount: 0, unresolvedObjections: 0, version: 1, updatedAt: '2026-08-02T14:00:00+08:00' },
];

const initialAppeals: AidAppeal[] = [
  { id: 'appeal-001', applicationId: 'app-2026-007', ownerId: 'demo-student-007', campusId: 'campus-main', departmentId: 'dept-agri', classId: 'class-agri-01', studentName: '张婷', studentNo: '2024001018', projectName: '国家励志奖学金', originalStatus: '已驳回', reason: '对志愿服务时长核验口径存在异议，已补充校团委证明。', evidenceCount: 2, status: 'pending_leader_review', submittedAt: '2026-08-01T11:20:00+08:00', handlerId: 'demo-fund-admin', decisionComment: '材料齐全，建议提交负责人复核。', version: 2, updatedAt: '2026-08-02T09:30:00+08:00' },
];
const initialAuditSnapshots: AuditSnapshot[] = [
  { id: 'audit-seed-001', taskId: 'audit-task-2026-01', actorId: 'demo-counselor', actorRole: 'COUNSELOR', action: 'application:approve', outcome: 'success', createdAt: '2026-08-01T09:30:00+08:00', evidenceSummary: '申请 app-2026-002 完成辅导员初审；人工确认；材料摘要哈希已留存。' },
  { id: 'audit-seed-002', taskId: 'grant-batch-2026-spring', actorId: 'demo-fund-admin', actorRole: 'FUND_ADMIN', action: 'grant_batch:create', outcome: 'success', createdAt: '2026-08-01T10:10:00+08:00', evidenceSummary: '发放批次 FF2026SPRING001 已编制，等待独立业务审批。' },
  { id: 'audit-seed-003', taskId: 'ai-task-review-001', actorId: 'demo-fund-admin', actorRole: 'FUND_ADMIN', action: 'ai:material_review', outcome: 'human_confirmed', createdAt: '2026-08-01T11:40:00+08:00', evidenceSummary: 'AI完成材料一致性建议，处理人复核后采纳；模型、Prompt与检索证据版本已冻结。' },
  { id: 'audit-seed-004', taskId: 'audit-task-2026-01', actorId: 'demo-finance', actorRole: 'FINANCE', action: 'data:export', outcome: 'denied', createdAt: '2026-08-02T08:20:00+08:00', evidenceSummary: '导出字段包含超出财务岗位范围的家庭敏感字段，数据权限层拒绝请求。' },
];
const initialComplianceFindings: ComplianceFinding[] = [
  { id: 'finding-001', campusId: 'campus-main', assignedTaskId: 'audit-task-2026-01', domain: '流程', severity: '高', title: '两笔申请复核时效超过制度阈值', description: '样本显示院系复核阶段超过5个工作日，需说明原因并补充催办证据。', responsibleDepartment: '农学院', evidenceRefs: ['audit-seed-001', 'app-2026-002'], status: 'open', dueDate: '2026-08-10', version: 1, updatedAt: '2026-08-02T09:00:00+08:00' },
  { id: 'finding-002', campusId: 'campus-main', assignedTaskId: 'audit-task-2026-01', domain: '数据', severity: '中', title: '敏感字段导出被策略阻断', description: '财务岗位尝试导出家庭敏感字段，系统已阻断；需核查是否存在批量导出操作培训缺口。', responsibleDepartment: '财务处', evidenceRefs: ['audit-seed-004'], status: 'investigating', dueDate: '2026-08-12', lastComment: '已调取导出策略与操作上下文。', version: 2, updatedAt: '2026-08-02T10:00:00+08:00' },
  { id: 'finding-003', campusId: 'campus-main', assignedTaskId: 'audit-task-2026-01', domain: 'AI行为', severity: '重大', title: '困难等级建议存在院系间偏差风险', description: '回归评估显示两个院系建议通过率差异超过5%，已触发自动阻断并等待偏见复核。', responsibleDepartment: 'AI运维中心', evidenceRefs: ['eval-bias-2026-08', 'ai-task-review-001'], status: 'rectification', dueDate: '2026-08-06', lastComment: '相关规则已冻结，等待复评。', version: 3, updatedAt: '2026-08-02T14:30:00+08:00' },
];
const initialDisciplineCases: DisciplineCase[] = [
  { id: 'discipline-case-2026-01', campusId: 'campus-main', sourceFindingId: 'finding-003', title: 'AI困难认定偏差风险核查', severity: '重大', status: 'investigating', authorizerIds: ['demo-discipline-a', 'demo-discipline-b'], conflictRisk: '未发现承办人与被调查部门直接利益冲突', evidenceChainHash: 'sha256:4f3a8e9c7b12d601f6d3e5a8d2c4b901', aiRuleFrozen: true, lastComment: '双人授权完成，已进入调查阶段。', version: 2, createdAt: '2026-08-02T15:00:00+08:00', updatedAt: '2026-08-02T15:20:00+08:00' },
];
const initialOpinionIncidents: OpinionIncident[] = [
  { id: 'opinion-001', campusId: 'campus-main', source: '校园论坛', channel: '公开社区', title: '国家助学金公示名单讨论热度上升', summary: '讨论集中在困难认定口径与公示隐私保护，暂未出现个人敏感信息扩散。', sentimentScore: -0.42, aiSuggestedLevel: '中', humanLevel: '中', status: 'assessed', relatedPublicityId: 'publicity-001', version: 2, detectedAt: '2026-08-02T08:10:00+08:00', updatedAt: '2026-08-02T09:00:00+08:00' },
  { id: 'opinion-002', campusId: 'campus-main', source: '校内服务号', channel: '留言区', title: '学生咨询助学金到账时间', summary: '多名学生集中咨询到账进度，情绪整体中性，可通过统一说明降低重复咨询。', sentimentScore: -0.08, aiSuggestedLevel: '轻', status: 'new', version: 1, detectedAt: '2026-08-02T10:30:00+08:00', updatedAt: '2026-08-02T10:30:00+08:00' },
  { id: 'opinion-003', campusId: 'campus-main', source: '热线工单', channel: '12345转办', title: '疑似冒用学生信息申请补助', summary: '工单反映身份信息可能被冒用，涉及个人信息与资金风险，需跨部门快速核验。', sentimentScore: -0.86, aiSuggestedLevel: '重', humanLevel: '重', status: 'responding', responsePlan: '已启动资助、信息化与纪检联合核验，暂停相关申请流转。', version: 3, detectedAt: '2026-08-01T16:20:00+08:00', updatedAt: '2026-08-02T11:00:00+08:00' },
];
const initialDataRightRequests: DataRightRequest[] = [
  { id: 'data-right-001', ownerId: 'demo-student', campusId: 'campus-main', requesterName: '李明', requestType: 'export', dataScope: '本人资助申请、认定、公示与发放记录', reason: '用于核对本人历年资助记录。', status: 'submitted', riskLevel: 'L3', version: 1, createdAt: '2026-08-02T12:00:00+08:00', updatedAt: '2026-08-02T12:00:00+08:00' },
  { id: 'data-right-002', ownerId: 'demo-student-002', campusId: 'campus-main', requesterName: '王芳', requestType: 'delete', dataScope: '已撤销申请中的非依法必须留存附件', reason: '申请已撤销，请删除无需继续保存的附件副本。', status: 'processing', riskLevel: 'L5', approvedBy: 'demo-fund-admin', decisionComment: '已完成法定留存范围核验，等待独立执行人完成删除。', version: 3, createdAt: '2026-08-01T10:00:00+08:00', updatedAt: '2026-08-02T13:30:00+08:00' },
];
const applicationsFile = join(process.cwd(), '.runtime', 'applications.json');
// DEMO ONLY. This snapshot is not a PostgreSQL transaction, multi-process lock or production data store.
const snapshotFile = join(process.cwd(), '.runtime', 'demo-business-snapshot.json');
interface DemoBusinessSnapshot {
  aidProjects: AidProject[];
  grantBatches: GrantBatch[];
  fundingIdempotency: [string, FundingPolicy | AidProject][];
  financeIdempotency: [string, GrantBatch][];
  applicationCreationResponses: [string, { fingerprint: string; data: unknown; message: string }][];
  notifications: DemoNotification[];
}
function loadDemoBusinessSnapshot(): Partial<DemoBusinessSnapshot> {
  if (!existsSync(snapshotFile)) return {};
  const parsed: unknown = JSON.parse(readFileSync(snapshotFile, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('DEMO_SNAPSHOT_INVALID');
  return parsed as Partial<DemoBusinessSnapshot>;
}
const demoSnapshot = loadDemoBusinessSnapshot();

function normalizeApplication(item: DemoApplication): DemoApplication {
  const estimatedMaterialCount = item.materialCount ?? Math.max(1, Math.round(item.materialCompleteness / 34));
  return { submissionChannel: 'web', materialSubmissionMethod: 'online-upload', academicYear: '2026-2027', semester: '第一学期', materialCount: estimatedMaterialCount, materialVerifiedCount: item.materialCompleteness === 100 ? estimatedMaterialCount : Math.max(0, estimatedMaterialCount - 1), submissionReceiptNo: `RCP-${item.id.toUpperCase()}`, ...item, authorizationSources: [...(item.authorizationSources ?? [])], precheckWarnings: [...(item.precheckWarnings ?? [])] };
}
function loadApplicationSnapshot(): DemoApplication[] | null {
  if (!existsSync(applicationsFile)) return null;
  try { const parsed = JSON.parse(readFileSync(applicationsFile, 'utf8')) as unknown; return Array.isArray(parsed) ? (parsed as DemoApplication[]).filter(item => item && typeof item.id === 'string').map(normalizeApplication) : null; } catch { return null; }
}
function persistApplications() {
  mkdirSync(dirname(applicationsFile), { recursive: true });
  const temporary = `${applicationsFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(store.applications, null, 2)}\n`, 'utf8');
  renameSync(temporary, applicationsFile);
}
function createInitialStore(): DemoStore {
  const applications = (loadApplicationSnapshot() ?? initialApplications).map((item) => normalizeApplication({ version: 1, updatedAt: item.submittedAt, ...item }));
  const now = '2026-08-02T09:00:00+08:00';
  // A reminder snapshot is persisted before applications.json: recover even if
  // the process stops between the two demo-only writes.
  for (const notice of demoSnapshot.notifications ?? []) {
    const application = applications.find((item) => item.id === notice.applicationId);
    if (application) application.overdue = false;
  }
  return {
    applications,
    notifications: demoSnapshot.notifications ?? [],
    audits: initialAuditSnapshots.map((audit) => ({ ...audit })),
    idempotencyResults: new Map<string, DemoApplication>(),
    grantBatches: demoSnapshot.grantBatches ?? [{ id: 'grant-batch-2026-spring', batchNo: 'FF2026SPRING001', campusId: 'campus-main', applicationIds: ['app-2026-005'], expectedCount: 1, expectedAmount: 12000, status: 'pending_business_approval', initiatedBy: 'demo-fund-admin', bankAssigneeId: 'demo-bank', version: 1, createdAt: now, updatedAt: now }],
    financeIdempotency: new Map<string, GrantBatch>(demoSnapshot.financeIdempotency ?? []),
    fundingPolicies: initialFundingPolicies.map((policy) => ({ ...policy })),
    aidProjects: demoSnapshot.aidProjects ?? initialAidProjects.map((project) => ({ ...project })),
    fundingIdempotency: new Map<string, FundingPolicy | AidProject>(demoSnapshot.fundingIdempotency ?? []),
    difficultyAssessments: initialDifficultyAssessments.map((assessment) => ({ ...assessment, specialFactors: [...assessment.specialFactors], riskFlags: [...assessment.riskFlags] })),
    difficultyIdempotency: new Map<string, DifficultyAssessment>(),
    publicityRecords: initialPublicityRecords.map((record) => ({ ...record })),
    publicityIdempotency: new Map<string, PublicityRecord>(),
    appeals: initialAppeals.map((appeal) => ({ ...appeal })),
    appealIdempotency: new Map<string, AidAppeal>(),
    complianceFindings: initialComplianceFindings.map((finding) => ({ ...finding, evidenceRefs: [...finding.evidenceRefs] })),
    findingIdempotency: new Map<string, ComplianceFinding>(),
    disciplineCases: initialDisciplineCases.map((item) => ({ ...item, authorizerIds: [...item.authorizerIds] })),
    disciplineIdempotency: new Map<string, DisciplineCase>(),
    opinionIncidents: initialOpinionIncidents.map((incident) => ({ ...incident })),
    opinionIdempotency: new Map<string, OpinionIncident>(),
    dataRightRequests: initialDataRightRequests.map((request) => ({ ...request })),
    dataRightIdempotency: new Map<string, DataRightRequest>(),
  };
}

type GlobalWithDemoStore = typeof globalThis & { __jhxtDemoStore?: DemoStore };
const globalForStore = globalThis as GlobalWithDemoStore;
const store = globalForStore.__jhxtDemoStore ?? createInitialStore();
globalForStore.__jhxtDemoStore = store;
const creationResponses = new Map(demoSnapshot.applicationCreationResponses ?? []);
function persistDemoBusinessSnapshot() {
  const data: DemoBusinessSnapshot = {
    aidProjects: store.aidProjects, grantBatches: store.grantBatches,
    fundingIdempotency: [...store.fundingIdempotency], financeIdempotency: [...store.financeIdempotency],
    applicationCreationResponses: [...creationResponses], notifications: store.notifications,
  };
  mkdirSync(dirname(snapshotFile), { recursive: true });
  const temporary = `${snapshotFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(data)}\n`, 'utf8');
  renameSync(temporary, snapshotFile);
}
export function getApplicationCreationReplay(actor: ActorContext, key: string, fingerprint: string) {
  const cached = creationResponses.get(`${actor.userId}:application-create:${key}`);
  return cached ? cached.fingerprint === fingerprint ? { status: 'hit' as const, data: cached.data, message: cached.message } : { status: 'conflict' as const } : { status: 'miss' as const };
}
export function saveApplicationCreationResponse(actor: ActorContext, key: string, fingerprint: string, data: unknown, message: string) {
  creationResponses.set(`${actor.userId}:application-create:${key}`, { fingerprint, data, message });
  persistDemoBusinessSnapshot();
}

store.idempotencyResults ??= new Map<string, DemoApplication>();
store.grantBatches ??= createInitialStore().grantBatches;
store.financeIdempotency ??= new Map<string, GrantBatch>();
store.fundingPolicies ??= initialFundingPolicies.map((policy) => ({ ...policy }));
store.aidProjects ??= initialAidProjects.map((project) => ({ ...project }));
store.fundingIdempotency ??= new Map<string, FundingPolicy | AidProject>();
store.difficultyAssessments ??= initialDifficultyAssessments.map((assessment) => ({ ...assessment, specialFactors: [...assessment.specialFactors], riskFlags: [...assessment.riskFlags] }));
store.difficultyIdempotency ??= new Map<string, DifficultyAssessment>();
store.publicityRecords ??= initialPublicityRecords.map((record) => ({ ...record }));
store.publicityIdempotency ??= new Map<string, PublicityRecord>();
store.appeals ??= initialAppeals.map((appeal) => ({ ...appeal }));
store.appealIdempotency ??= new Map<string, AidAppeal>();
store.complianceFindings ??= initialComplianceFindings.map((finding) => ({ ...finding, evidenceRefs: [...finding.evidenceRefs] }));
store.findingIdempotency ??= new Map<string, ComplianceFinding>();
store.disciplineCases ??= initialDisciplineCases.map((item) => ({ ...item, authorizerIds: [...item.authorizerIds] }));
store.disciplineIdempotency ??= new Map<string, DisciplineCase>();
store.opinionIncidents ??= initialOpinionIncidents.map((incident) => ({ ...incident }));
store.opinionIdempotency ??= new Map<string, OpinionIncident>();
store.dataRightRequests ??= initialDataRightRequests.map((request) => ({ ...request }));
store.dataRightIdempotency ??= new Map<string, DataRightRequest>();

function canSeeApplication(actor: ActorContext, application: DemoApplication): boolean {
  const scope = ROLE_PROFILES[actor.role].dataScope;
  if (scope === 'platform' || scope === 'school') return actor.campusIds.includes(application.campusId);
  if (scope === 'department') return actor.departmentIds?.includes(application.departmentId) ?? false;
  if (scope === 'class') return actor.classIds?.includes(application.classId) ?? false;
  if (scope === 'self') return application.ownerId === actor.userId;
  if (scope === 'assigned') {
    if (actor.role === 'BANK') return Boolean(application.grantBatchId && store.grantBatches.some(batch => batch.id === application.grantBatchId && batch.bankAssigneeId === actor.userId && ['sent_to_bank', 'receipt_received', 'reconciled', 'exception'].includes(batch.status)));
    return Boolean(application.auditTaskId && actor.assignedTaskIds?.includes(application.auditTaskId));
  }
  return Boolean(application.auditTaskId && actor.assignedTaskIds?.includes(application.auditTaskId));
}

export function listVisibleApplications(actor: ActorContext, statuses?: readonly ApplicationStatus[]): DemoApplication[] {
  const scenario = getHardshipVideoApplicationProjection();
  const source = scenario ? [normalizeApplication(scenario as DemoApplication), ...store.applications] : store.applications;
  return source.filter((application) => canSeeApplication(actor, application) && (!statuses || statuses.includes(application.status)));
}

export function getMyAidProgress(actor: ActorContext): DemoApplication[] {
  return listVisibleApplications(actor);
}

export function buildMonthlyFundingReport(actor: ActorContext): { total: number; pending: number; overdue: number; amount: number; byStatus: Record<ApplicationStatus, number> } {
  const applications = listVisibleApplications(actor);
  const byStatus = applications.reduce<Record<ApplicationStatus, number>>((result, application) => {
    result[application.status] = (result[application.status] ?? 0) + 1;
    return result;
  }, {} as Record<ApplicationStatus, number>);
  return {
    total: applications.length,
    pending: applications.filter((application) => !['已完成', '待发放'].includes(application.status)).length,
    overdue: applications.filter((application) => application.overdue).length,
    amount: applications.reduce((sum, application) => sum + application.requestedAmount, 0),
    byStatus,
  };
}

export function createOverdueReminders(actor: ActorContext, taskId: string): { created: number; recipients: string[] } {
  const overdueApplications = listVisibleApplications(actor).filter((application) => application.overdue);
  const recipients = overdueApplications.map((application) => application.studentName);
  for (const application of overdueApplications) {
    store.notifications.push({
      id: `notice-${Date.now()}-${application.id}`,
      recipientRole: '申请处理人',
      title: '资助申请处理提醒',
      content: `${application.studentName}的${application.projectName}已超时，请尽快处理。`,
      createdAt: new Date().toISOString(),
      sourceTaskId: taskId,
      applicationId: application.id,
    });
    application.overdue = false;
  }
  if (overdueApplications.length) { persistDemoBusinessSnapshot(); persistApplications(); }
  return { created: overdueApplications.length, recipients };
}


export type ApplicationAction = 'submit_draft' | 'approve' | 'return' | 'publish' | 'close_publicity' | 'mark_granted' | 'resubmit' | 'appeal' | 'resolve_appeal' | 'reject';

interface TransitionRule {
  from: ApplicationStatus;
  action: ApplicationAction;
  roles: readonly ActorContext['role'][];
  to: ApplicationStatus;
}

const TRANSITION_RULES: readonly TransitionRule[] = [
  { from: '草稿', action: 'submit_draft', roles: ['STUDENT'], to: '待辅导员初审' },
  { from: '待辅导员初审', action: 'approve', roles: ['COUNSELOR'], to: '待院系复核' },
  { from: '待辅导员初审', action: 'return', roles: ['COUNSELOR'], to: '已退回补正' },
  { from: '待院系复核', action: 'approve', roles: ['DEPT_ADMIN'], to: '待校级复审' },
  { from: '待院系复核', action: 'return', roles: ['DEPT_ADMIN'], to: '已退回补正' },
  { from: '待校级复审', action: 'approve', roles: ['FUND_ADMIN', 'FUND_LEADER'], to: '待公示' },
  { from: '待校级复审', action: 'return', roles: ['FUND_ADMIN', 'FUND_LEADER'], to: '已退回补正' },
  { from: '待校级复审', action: 'reject', roles: ['FUND_LEADER'], to: '已驳回' },
  { from: '待公示', action: 'publish', roles: ['FUND_ADMIN'], to: '公示中' },
  { from: '公示中', action: 'close_publicity', roles: ['FUND_ADMIN'], to: '待发放' },
  { from: '待发放', action: 'mark_granted', roles: ['FINANCE'], to: '已完成' },
  { from: '已退回补正', action: 'resubmit', roles: ['STUDENT'], to: '待辅导员初审' },
  { from: '已退回补正', action: 'appeal', roles: ['STUDENT'], to: '申诉处理中' },
  { from: '已驳回', action: 'appeal', roles: ['STUDENT'], to: '申诉处理中' },
  { from: '申诉处理中', action: 'resolve_appeal', roles: ['FUND_LEADER'], to: '待校级复审' },
  { from: '申诉处理中', action: 'reject', roles: ['FUND_LEADER'], to: '已驳回' },
];

export interface ApplicationTransitionResult {
  success: boolean;
  code: string;
  message: string;
  application?: DemoApplication;
  replayed?: boolean;
}

export function getVisibleApplication(actor: ActorContext, applicationId: string): DemoApplication | null {
  const scenario = getHardshipVideoApplicationProjection();
  const application = scenario?.id === applicationId ? normalizeApplication(scenario as DemoApplication) : store.applications.find((item) => item.id === applicationId);
  return application && canSeeApplication(actor, application) ? application : null;
}

export function transitionDemoApplication(
  actor: ActorContext,
  input: { applicationId: string; action: ApplicationAction; comment: string; idempotencyKey: string; expectedVersion: number },
): ApplicationTransitionResult {
  const idempotencyScope = `${actor.userId}:${input.idempotencyKey}`;
  const replay = store.idempotencyResults.get(idempotencyScope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该请求已处理，本次返回原结果。', application: { ...replay }, replayed: true };

  const application = getVisibleApplication(actor, input.applicationId);
  if (!application) return { success: false, code: 'APPLICATION_NOT_FOUND', message: '申请不存在或不在当前授权范围内。' };
  if (application.scenarioId) return { success: false, code: 'SCENARIO_WORKFLOW_REQUIRED', message: '视频场景申请必须在多Agent协作闸门中处理，避免业务页与场景状态分叉。', application: { ...application } };
  const currentVersion = application.version ?? 1;
  if (currentVersion !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '申请已被其他处理人更新，请刷新后重试。', application: { ...application } };
  const rule = TRANSITION_RULES.find((item) => item.from === application.status && item.action === input.action && item.roles.includes(actor.role));
  if (!rule) return { success: false, code: 'TRANSITION_DENIED', message: `角色无权在“${application.status}”状态执行该操作。` };

  const beforeSnapshot = { status: application.status, version: currentVersion, lastComment: application.lastComment ?? null };
  application.status = rule.to;
  application.version = currentVersion + 1;
  application.updatedAt = new Date().toISOString();
  application.lastComment = input.comment.slice(0, 500);
  store.idempotencyResults.set(idempotencyScope, { ...application });
  persistApplications();
  writeAuditSnapshot({
    taskId: `workflow-${input.idempotencyKey}`,
    actorId: actor.userId,
    actorRole: actor.role,
    action: `application:${input.action}`,
    outcome: 'success',
    evidenceSummary: `申请 ${application.id} 从“${rule.from}”流转到“${rule.to}”；人工确认；版本 ${application.version}。`,
    resource: { type: 'application', id: application.id, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, sensitivity: 'P2', workflowState: application.status },
    before: beforeSnapshot,
    after: { status: application.status, version: application.version, lastComment: application.lastComment },
    context: { dataScope: application.classId, geographicLevel: 'L1', purpose: '资助申请流程处理' },
    operationDetails: { action: input.action, humanConfirmed: true, idempotencyKey: input.idempotencyKey },
  });
  return { success: true, code: 'TRANSITION_COMPLETED', message: `申请已流转至“${rule.to}”。`, application: { ...application } };
}

export interface CreateDemoApplicationInput {
  projectName: string;
  requestedAmount: number;
  idempotencyKey: string;
  mode: 'draft' | 'submit';
  submissionChannel: ApplicationSubmissionChannel;
  materialSubmissionMethod: MaterialSubmissionMethod;
  materialIds: string[];
  requiredMaterialCount: number;
  authorizationSources: string[];
  offlineReceiptNo?: string;
  academicYear: string;
  semester: string;
  applicantStatement: string;
  familyAnnualIncome?: number;
  familyMembers?: number;
  specialCircumstance?: string;
  bankName?: string;
  bankAccount?: string;
  eligibilityReportId?: string;
  precheckReportId?: string;
  precheckScore?: number;
  precheckWarnings?: string[];
  precheckWaiverConfirmed?: boolean;
  intakeTicketId?: string;
  scenarioId?: string;
  scenarioRevision?: number;
}

export function createDemoApplication(actor: ActorContext, input: CreateDemoApplicationInput): DemoApplication {
  const idempotencyScope = `${actor.userId}:application-create:${input.idempotencyKey}`;
  const replay = store.idempotencyResults.get(idempotencyScope);
  if (replay) return normalizeApplication(replay);
  const sequence = store.applications.reduce((max, item) => { const value = Number.parseInt(item.id.split('-').at(-1) ?? '0', 10); return Number.isFinite(value) ? Math.max(max, value) : max; }, 0) + 1;
  const now = new Date().toISOString();
  const id = `app-2026-${String(sequence).padStart(3, '0')}`;
  const claimedMaterials = claimApplicationMaterials(actor, input.materialIds, id);
  const evidenceUnits = claimedMaterials.length + input.authorizationSources.length + (input.offlineReceiptNo ? 1 : 0);
  const required = Math.max(1, input.requiredMaterialCount);
  const completeness = Math.min(100, Math.round(evidenceUnits / required * 100));
  const application: DemoApplication = {
    id,
    studentName: actor.userId === 'demo-student' ? '李明' : '演示学生',
    studentNo: actor.userId === 'demo-student' ? '2024001001' : `DEMO${String(sequence).padStart(4, '0')}`,
    ownerId: actor.userId,
    campusId: actor.campusIds[0] ?? 'campus-main',
    departmentId: actor.departmentIds?.[0] ?? 'dept-unassigned',
    classId: actor.classIds?.[0] ?? 'class-unassigned',
    projectName: input.projectName,
    requestedAmount: input.requestedAmount,
    status: input.mode === 'draft' ? '草稿' : '待辅导员初审',
    riskLevel: completeness < 60 ? '中' : '低',
    materialCompleteness: completeness,
    submittedAt: now,
    overdue: false,
    version: 1,
    updatedAt: now,
    submissionChannel: input.submissionChannel,
    materialSubmissionMethod: input.materialSubmissionMethod,
    academicYear: input.academicYear,
    semester: input.semester,
    applicantStatement: input.applicantStatement.slice(0, 2000),
    familyAnnualIncome: input.familyAnnualIncome,
    familyMembers: input.familyMembers,
    specialCircumstance: input.specialCircumstance?.slice(0, 1000),
    bankName: input.bankName?.slice(0, 80),
    bankAccountLast4: input.bankAccount?.replace(/\s/g, '').slice(-4),
    materialCount: evidenceUnits,
    materialVerifiedCount: 0,
    submissionReceiptNo: `RCP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(sequence).padStart(6, '0')}`,
    offlineReceiptNo: input.offlineReceiptNo?.slice(0, 80),
    authorizationSources: [...input.authorizationSources],
    eligibilityReportId: input.eligibilityReportId,
    precheckReportId: input.precheckReportId,
    precheckScore: input.precheckScore,
    precheckWarnings: [...(input.precheckWarnings ?? [])],
    precheckWaiverConfirmed: input.precheckWaiverConfirmed,
    intakeTicketId: input.intakeTicketId,
  };
  store.applications.unshift(application);
  store.idempotencyResults.set(idempotencyScope, { ...application, authorizationSources: [...(application.authorizationSources ?? [])] });
  persistApplications();
  writeAuditSnapshot({ taskId: `application-${application.id}`, actorId: actor.userId, actorRole: actor.role, action: input.mode === 'draft' ? 'application:create_draft' : 'application:submit', outcome: 'success', evidenceSummary: `学生通过${application.submissionChannel}以${application.materialSubmissionMethod}方式${input.mode === 'draft' ? '保存草稿' : '提交申请'}；材料 ${application.materialCount} 项，完整度 ${application.materialCompleteness}%，生成回执 ${application.submissionReceiptNo}。`, resource: { type: 'application', id: application.id, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, sensitivity: 'P3', workflowState: application.status }, after: { id: application.id, projectName: application.projectName, status: application.status, requestedAmount: application.requestedAmount, submissionChannel: application.submissionChannel, materialSubmissionMethod: application.materialSubmissionMethod, materialCount: application.materialCount, materialCompleteness: application.materialCompleteness, receipt: application.submissionReceiptNo, version: application.version }, operationDetails: { mode: input.mode, materialIds: claimedMaterials.map(item => item.id), rawBankAccountStored: false, applicantStatementLogged: false }, evidenceRefs: claimedMaterials.map(item => `sha256:${item.sha256}`), context: { dataScope: application.classId, geographicLevel: 'L2', purpose: '学生资助申请提交' } });
  return normalizeApplication(application);
}
export interface UpdateDemoApplicationDraftInput extends Omit<CreateDemoApplicationInput, "idempotencyKey"> {
  applicationId: string;
  idempotencyKey: string;
  expectedVersion: number;
}
export function updateDemoApplicationDraft(actor: ActorContext, input: UpdateDemoApplicationDraftInput): ApplicationTransitionResult {
  if (actor.role !== "STUDENT") return { success: false, code: "ROLE_DENIED", message: "只有学生本人可以编辑申请草稿。" };
  const scope = `${actor.userId}:application-draft-update:${input.idempotencyKey}`;
  const replay = store.idempotencyResults.get(scope);
  if (replay) return { success: true, code: "IDEMPOTENT_REPLAY", message: "该草稿请求已处理，本次返回原结果。", application: normalizeApplication(replay), replayed: true };
  const application = store.applications.find((item) => item.id === input.applicationId && item.ownerId === actor.userId);
  if (!application) return { success: false, code: "APPLICATION_NOT_FOUND", message: "申请不存在或不属于当前学生。" };
  if (!["草稿", "已退回补正"].includes(application.status)) return { success: false, code: "DRAFT_STATE_DENIED", message: "正式受理后的申请不能直接修改，需通过补正或申诉流程处理。", application: normalizeApplication(application) };
  const currentVersion = application.version ?? 1;
  if (currentVersion !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "草稿已在其他页面更新，请刷新后重试。", application: normalizeApplication(application) };
  const before = { projectName: application.projectName, requestedAmount: application.requestedAmount, status: application.status, materialCount: application.materialCount, version: currentVersion };
  const newlyClaimed = claimApplicationMaterials(actor, input.materialIds, application.id);
  const uploaded = listApplicationMaterialRecords(application.id);
  const evidenceUnits = uploaded.length + input.authorizationSources.length + (input.offlineReceiptNo ? 1 : 0);
  const required = Math.max(1, input.requiredMaterialCount);
  const completeness = Math.min(100, Math.round(evidenceUnits / required * 100));
  const now = new Date().toISOString();
  application.projectName = input.projectName;
  application.requestedAmount = input.requestedAmount;
  application.status = input.mode === "submit" ? "待辅导员初审" : application.status;
  application.riskLevel = completeness < 60 ? "中" : "低";
  application.materialCompleteness = completeness;
  application.updatedAt = now;
  if (input.mode === "submit") application.submittedAt = now;
  application.version = currentVersion + 1;
  application.submissionChannel = input.submissionChannel;
  application.materialSubmissionMethod = input.materialSubmissionMethod;
  application.academicYear = input.academicYear;
  application.semester = input.semester;
  application.applicantStatement = input.applicantStatement.slice(0, 2000);
  application.familyAnnualIncome = input.familyAnnualIncome;
  application.familyMembers = input.familyMembers;
  application.specialCircumstance = input.specialCircumstance?.slice(0, 1000);
  application.bankName = input.bankName?.slice(0, 80);
  if (input.bankAccount) application.bankAccountLast4 = input.bankAccount.replace(/\s/g, "").slice(-4);
  application.materialCount = evidenceUnits;
  application.offlineReceiptNo = input.offlineReceiptNo?.slice(0, 80);
  application.authorizationSources = [...input.authorizationSources];
  application.eligibilityReportId = input.eligibilityReportId;
  if (input.precheckReportId) {
    application.precheckReportId = input.precheckReportId;
    application.precheckScore = input.precheckScore;
    application.precheckWarnings = [...(input.precheckWarnings ?? [])];
    application.precheckWaiverConfirmed = input.precheckWaiverConfirmed;
  }
  application.intakeTicketId = input.intakeTicketId ?? application.intakeTicketId;
  store.idempotencyResults.set(scope, normalizeApplication(application));
  persistApplications();
  writeAuditSnapshot({ taskId: `application-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: input.mode === "submit" ? "application:submit_draft" : "application:update_draft", outcome: "success", evidenceSummary: `申请 ${application.id} 已${input.mode === "submit" ? "完成预检并正式提交" : "保存草稿修改"}；材料 ${evidenceUnits} 项，完整度 ${completeness}%，版本 ${application.version}。`, resource: { type: "application", id: application.id, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, sensitivity: "P3", workflowState: application.status }, before, after: { projectName: application.projectName, requestedAmount: application.requestedAmount, status: application.status, materialCount: application.materialCount, materialCompleteness: application.materialCompleteness, precheckReportId: application.precheckReportId, version: application.version }, operationDetails: { mode: input.mode, newlyClaimedMaterialIds: newlyClaimed.map((item) => item.id), rawBankAccountStored: false, precheckWaiverConfirmed: Boolean(input.precheckWaiverConfirmed) }, evidenceRefs: uploaded.map((item) => `sha256:${item.sha256}`), context: { dataScope: application.classId, geographicLevel: "L2", purpose: "学生申请草稿编辑与受理提交" } });
  return { success: true, code: input.mode === "submit" ? "DRAFT_SUBMITTED" : "DRAFT_UPDATED", message: input.mode === "submit" ? "草稿已正式提交并进入受理队列。" : "草稿修改已持久化。", application: normalizeApplication(application) };
}
// DEMO ONLY: derive assignment from the batch projection rather than static identity metadata.
export function listDemoAssignedBankBatchIds(userId: string): string[] {
  return store.grantBatches.filter(batch => batch.bankAssigneeId === userId).map(batch => batch.id);
}

export function listVisibleGrantBatches(actor: ActorContext): GrantBatch[] {
  const allowedRoles: readonly ActorContext['role'][] = ['FUND_ADMIN', 'FUND_LEADER', 'FINANCE', 'BANK', 'SCHOOL_LEADER', 'AUDITOR', 'AUDIT_EXTERNAL', 'EDU_BUREAU'];
  if (!allowedRoles.includes(actor.role)) return [];
  return store.grantBatches.filter((batch) => actor.campusIds.includes(batch.campusId) && (actor.role !== 'BANK' || (batch.bankAssigneeId === actor.userId && ['sent_to_bank', 'receipt_received', 'reconciled', 'exception'].includes(batch.status)))).map((batch) => ({ ...batch, applicationIds: [...batch.applicationIds] }));
}

export function createGrantBatch(actor: ActorContext, input: { idempotencyKey: string; applicationIds: string[] }): { success: boolean; code: string; message: string; batch?: GrantBatch } {
  if (actor.role !== 'FUND_ADMIN') return { success: false, code: 'ROLE_DENIED', message: '只有校级资助中心管理员可以编制发放批次。' };
  const scope = `${actor.userId}:${input.idempotencyKey}`;
  const replay = store.financeIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该批次已创建，本次返回原结果。', batch: { ...replay } };
  const selected = store.applications.filter((application) => input.applicationIds.includes(application.id) && canSeeApplication(actor, application) && application.status === '待发放');
  if (selected.length !== input.applicationIds.length || selected.length === 0) return { success: false, code: 'INVALID_APPLICATIONS', message: '发放批次只能包含当前授权范围内处于“待发放”的申请。' };
  const sequence = store.grantBatches.length + 1;
  const now = new Date().toISOString();
  const batch: GrantBatch = {
    id: `grant-batch-2026-${String(sequence).padStart(3, '0')}`,
    batchNo: `FF2026${String(sequence).padStart(5, '0')}`,
    campusId: actor.campusIds[0] ?? 'campus-main',
    applicationIds: selected.map((item) => item.id),
    expectedCount: selected.length,
    expectedAmount: selected.reduce((sum, item) => sum + item.requestedAmount, 0),
    status: 'pending_business_approval',
    initiatedBy: actor.userId,
    bankAssigneeId: 'demo-bank', // DEMO ONLY: bind the selected mock bank identity at creation.
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  store.grantBatches.unshift(batch);
  store.financeIdempotency.set(scope, { ...batch });
  writeAuditSnapshot({ taskId: `grant-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: 'grant_batch:create', outcome: 'success', evidenceSummary: `编制发放批次 ${batch.batchNo}，共 ${batch.expectedCount} 人，金额 ${batch.expectedAmount} 元；尚未发往银行。` });
  persistDemoBusinessSnapshot();
  return { success: true, code: 'BATCH_CREATED', message: '发放批次已编制，等待业务负责人审批。', batch: { ...batch } };
}

export interface GrantBatchActionInput {
  batchId: string;
  action: GrantBatchAction;
  idempotencyKey: string;
  expectedVersion: number;
  comment: string;
  receipt?: { receiptNo: string; actualCount: number; actualAmount: number; failedCount: number };
}

export function processGrantBatchAction(actor: ActorContext, input: GrantBatchActionInput): { success: boolean; code: string; message: string; batch?: GrantBatch } {
  const scope = `${actor.userId}:${input.idempotencyKey}`;
  const replay = store.financeIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该操作已完成，本次返回原结果。', batch: { ...replay } };
  const batch = store.grantBatches.find((item) => item.id === input.batchId && actor.campusIds.includes(item.campusId));
  if (!batch || (actor.role === 'BANK' && batch.bankAssigneeId !== actor.userId)) return { success: false, code: 'BATCH_NOT_FOUND', message: '批次不存在或不在当前授权范围内。' };
  if (batch.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '批次已更新，请刷新后重试。', batch: { ...batch } };

  const expected: Record<GrantBatchAction, { role: ActorContext['role']; status: GrantBatchStatus }> = {
    business_approve: { role: 'FUND_LEADER', status: 'pending_business_approval' },
    send_to_bank: { role: 'FINANCE', status: 'pending_finance_execution' },
    receive_bank_receipt: { role: 'BANK', status: 'sent_to_bank' },
    reconcile: { role: 'FINANCE', status: 'receipt_received' },
  };
  const rule = expected[input.action];
  if (actor.role !== rule.role || batch.status !== rule.status) return { success: false, code: 'ACTION_DENIED', message: '当前角色或批次状态不允许执行该操作。' };
  if (input.action === 'business_approve' && actor.userId === batch.initiatedBy) return { success: false, code: 'SEGREGATION_OF_DUTIES', message: '编制人与业务审批人不能为同一人。' };

  if (input.action === 'business_approve') {
    batch.businessApprovedBy = actor.userId;
    batch.status = 'pending_finance_execution';
  } else if (input.action === 'send_to_bank') {
    batch.executedBy = actor.userId;
    batch.status = 'sent_to_bank';
    for (const application of store.applications.filter(item => batch.applicationIds.includes(item.id))) application.grantBatchId = batch.id;
  } else if (input.action === 'receive_bank_receipt') {
    if (!input.receipt || !input.receipt.receiptNo.trim() || input.receipt.actualCount < 0 || input.receipt.actualAmount < 0 || input.receipt.failedCount < 0) return { success: false, code: 'INVALID_RECEIPT', message: '银行回盘数据不完整。' };
    batch.bankOperatorId = actor.userId;
    batch.receiptNo = input.receipt.receiptNo.trim();
    batch.actualCount = input.receipt.actualCount;
    batch.actualAmount = input.receipt.actualAmount;
    batch.failedCount = input.receipt.failedCount;
    batch.differenceAmount = batch.expectedAmount - input.receipt.actualAmount;
    batch.status = 'receipt_received';
  } else {
    const matched = batch.actualCount === batch.expectedCount && batch.actualAmount === batch.expectedAmount && batch.failedCount === 0;
    batch.status = matched ? 'reconciled' : 'exception';
    if (matched) {
      for (const application of store.applications.filter((item) => batch.applicationIds.includes(item.id))) {
        application.status = '已完成';
        application.version = (application.version ?? 1) + 1;
        application.updatedAt = new Date().toISOString();
      }
    }
  }
  batch.version += 1;
  batch.updatedAt = new Date().toISOString();
  store.financeIdempotency.set(scope, { ...batch, applicationIds: [...batch.applicationIds] });
  writeAuditSnapshot({ taskId: `grant-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: `grant_batch:${input.action}`, outcome: batch.status === 'exception' ? 'exception' : 'success', evidenceSummary: `批次 ${batch.batchNo} 完成动作 ${input.action}，状态变为 ${batch.status}；意见摘要：${input.comment.slice(0, 100)}。` });
  if (input.action === 'send_to_bank' || input.action === 'reconcile') persistApplications();
  persistDemoBusinessSnapshot();
  return { success: true, code: 'ACTION_COMPLETED', message: batch.status === 'exception' ? '对账发现差异，已转入异常处理。' : '批次操作已完成。', batch: { ...batch, applicationIds: [...batch.applicationIds] } };
}

function canSeeDifficultyAssessment(actor: ActorContext, assessment: DifficultyAssessment): boolean {
  const application = store.applications.find((item) => item.id === assessment.applicationId);
  if (application) return canSeeApplication(actor, application);
  const scope = ROLE_PROFILES[actor.role].dataScope;
  if (scope === 'platform' || scope === 'school') return actor.campusIds.includes(assessment.campusId);
  if (scope === 'department') return actor.departmentIds?.includes(assessment.departmentId) ?? false;
  if (scope === 'class') return actor.classIds?.includes(assessment.classId) ?? false;
  return false;
}

export function listDifficultyAssessments(actor: ActorContext): DifficultyAssessment[] {
  const allowedRoles: readonly ActorContext['role'][] = ['SYS_ADMIN', 'SCHOOL_LEADER', 'FUND_LEADER', 'STU_AFFAIRS', 'FUND_ADMIN', 'DEPT_ADMIN', 'COUNSELOR', 'AUDITOR', 'AUDIT_EXTERNAL', 'EDU_BUREAU'];
  if (!allowedRoles.includes(actor.role)) return [];
  return store.difficultyAssessments.filter((assessment) => canSeeDifficultyAssessment(actor, assessment)).map((assessment) => ({ ...assessment, specialFactors: [...assessment.specialFactors], riskFlags: [...assessment.riskFlags] }));
}

export function processDifficultyAction(actor: ActorContext, input: { assessmentId: string; action: DifficultyAction; expectedVersion: number; comment: string; idempotencyKey: string; votesAgree?: number; votesTotal?: number; finalLevel?: DifficultyLevel }): { success: boolean; code: string; message: string; assessment?: DifficultyAssessment } {
  const scope = `${actor.userId}:difficulty:${input.idempotencyKey}`;
  const replay = store.difficultyIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该认定操作已完成，本次返回原结果。', assessment: { ...replay, specialFactors: [...replay.specialFactors], riskFlags: [...replay.riskFlags] } };
  const assessment = store.difficultyAssessments.find((item) => item.id === input.assessmentId && canSeeDifficultyAssessment(actor, item));
  if (!assessment) return { success: false, code: 'ASSESSMENT_NOT_FOUND', message: '困难认定记录不存在或不在授权范围。' };
  if (assessment.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '认定记录已被更新，请刷新后重试。', assessment: { ...assessment, specialFactors: [...assessment.specialFactors], riskFlags: [...assessment.riskFlags] } };
  const from = assessment.status;

  if (input.action === 'submit_democratic_review') {
    if (actor.role !== 'COUNSELOR' || !['pending_democratic_review', 'returned'].includes(assessment.status)) return { success: false, code: 'ACTION_DENIED', message: '只有所属班级辅导员可提交民主评议。' };
    if (!Number.isInteger(input.votesAgree) || !Number.isInteger(input.votesTotal) || (input.votesTotal ?? 0) < 3 || (input.votesAgree ?? -1) < 0 || (input.votesAgree ?? 0) > (input.votesTotal ?? 0)) return { success: false, code: 'INVALID_VOTES', message: '民主评议票数不合法，总票数不得少于3。' };
    assessment.democraticVotesAgree = input.votesAgree!;
    assessment.democraticVotesTotal = input.votesTotal!;
    assessment.status = 'pending_department_review';
  } else if (input.action === 'department_approve') {
    if (actor.role !== 'DEPT_ADMIN' || assessment.status !== 'pending_department_review') return { success: false, code: 'ACTION_DENIED', message: '只有所属院系资助管理员可完成院系复核。' };
    assessment.status = 'pending_school_confirmation';
  } else if (input.action === 'department_return') {
    if (actor.role !== 'DEPT_ADMIN' || assessment.status !== 'pending_department_review') return { success: false, code: 'ACTION_DENIED', message: '只有所属院系资助管理员可退回民主评议。' };
    assessment.status = 'returned';
  } else if (input.action === 'school_confirm') {
    if (actor.role !== 'FUND_ADMIN' || assessment.status !== 'pending_school_confirmation') return { success: false, code: 'ACTION_DENIED', message: '只有校级资助中心管理员可确认困难等级。' };
    if (!input.finalLevel || !['一般困难', '困难', '特别困难', '不予认定'].includes(input.finalLevel)) return { success: false, code: 'LEVEL_REQUIRED', message: '校级确认必须由人工选择最终困难等级。' };
    assessment.finalLevel = input.finalLevel;
    assessment.status = 'confirmed';
  } else if (input.action === 'school_return') {
    if (actor.role !== 'FUND_ADMIN' || assessment.status !== 'pending_school_confirmation') return { success: false, code: 'ACTION_DENIED', message: '只有校级资助中心管理员可退回院系复核。' };
    assessment.status = 'pending_department_review';
  } else {
    if (actor.role !== 'COUNSELOR' || assessment.status !== 'returned') return { success: false, code: 'ACTION_DENIED', message: '只有所属班级辅导员可重新发起民主评议。' };
    assessment.status = 'pending_democratic_review';
  }
  assessment.lastComment = input.comment.slice(0, 500);
  assessment.version += 1;
  assessment.updatedAt = new Date().toISOString();
  const snapshot = { ...assessment, specialFactors: [...assessment.specialFactors], riskFlags: [...assessment.riskFlags] };
  store.difficultyIdempotency.set(scope, snapshot);
  writeAuditSnapshot({ taskId: `difficulty-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: `difficulty:${input.action}`, outcome: 'success', evidenceSummary: `困难认定 ${assessment.id} 从 ${from} 流转为 ${assessment.status}；AI建议仅作参考，最终结果由人工确认；版本 ${assessment.version}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: assessment.status === 'confirmed' ? `困难等级已人工确认为“${assessment.finalLevel}”。` : '困难认定流程已更新。', assessment: snapshot };
}
export function listOpinionIncidents(actor: ActorContext): OpinionIncident[] {
  if (!['PUBLIC_OPINION', 'SCHOOL_LEADER', 'FUND_LEADER', 'FUND_ADMIN', 'STU_AFFAIRS', 'DISCIPLINE', 'SYS_ADMIN'].includes(actor.role)) return [];
  return store.opinionIncidents.filter((incident) => actor.campusIds.includes(incident.campusId)).map((incident) => ({ ...incident }));
}

export function processOpinionAction(actor: ActorContext, input: { incidentId: string; action: OpinionAction; expectedVersion: number; comment: string; idempotencyKey: string; humanLevel?: OpinionLevel }): { success: boolean; code: string; message: string; incident?: OpinionIncident } {
  if (actor.role !== 'PUBLIC_OPINION') return { success: false, code: 'ROLE_DENIED', message: '只有舆情管理员可执行响应操作。' };
  const scope = `${actor.userId}:opinion:${input.idempotencyKey}`;
  const replay = store.opinionIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该舆情操作已完成，本次返回原结果。', incident: { ...replay } };
  const incident = store.opinionIncidents.find((item) => item.id === input.incidentId && actor.campusIds.includes(item.campusId));
  if (!incident) return { success: false, code: 'INCIDENT_NOT_FOUND', message: '舆情事件不存在或不在授权范围。' };
  if (incident.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '舆情事件已更新，请刷新后重试。', incident: { ...incident } };
  if (input.action === 'triage') {
    if (incident.status !== 'new' || !input.humanLevel) return { success: false, code: 'ACTION_DENIED', message: '新事件必须由人工完成轻、中、重分级。' };
    incident.humanLevel = input.humanLevel;
    incident.status = 'assessed';
  } else if (input.action === 'start_response') {
    if (incident.status !== 'assessed') return { success: false, code: 'ACTION_DENIED', message: '只有已人工分级事件可启动响应。' };
    incident.status = 'responding';
    incident.responsePlan = input.comment.slice(0, 500);
  } else if (input.action === 'resolve') {
    if (incident.status !== 'responding') return { success: false, code: 'ACTION_DENIED', message: '只有响应中的事件可办结。' };
    incident.status = 'resolved';
  } else {
    if (incident.status !== 'resolved') return { success: false, code: 'ACTION_DENIED', message: '只有已办结事件可重新打开。' };
    incident.status = 'responding';
  }
  incident.version += 1;
  incident.updatedAt = new Date().toISOString();
  store.opinionIdempotency.set(scope, { ...incident });
  writeAuditSnapshot({ taskId: incident.id, actorId: actor.userId, actorRole: actor.role, action: `opinion:${input.action}`, outcome: 'success', evidenceSummary: `舆情事件 ${incident.id} 处理为 ${incident.status}；AI建议 ${incident.aiSuggestedLevel}，人工等级 ${incident.humanLevel ?? '待确认'}；版本 ${incident.version}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: '舆情事件状态已更新。', incident: { ...incident } };
}

function hasDataAdminCapability(actor: ActorContext): boolean {
  return actor.role === 'DATA_ADMIN';
}

export function listDataRightRequests(actor: ActorContext): DataRightRequest[] {
  if (actor.role === 'STUDENT') return store.dataRightRequests.filter((request) => request.ownerId === actor.userId).map((request) => ({ ...request }));
  if (!hasDataAdminCapability(actor)) return [];
  return store.dataRightRequests.filter((request) => actor.campusIds.includes(request.campusId)).map((request) => ({ ...request }));
}

export function createDataRightRequest(actor: ActorContext, input: { requestType: DataRightType; dataScope: string; reason: string; idempotencyKey: string }): { success: boolean; code: string; message: string; request?: DataRightRequest } {
  if (actor.role !== 'STUDENT') return { success: false, code: 'ROLE_DENIED', message: '数据权利请求必须由数据主体本人发起。' };
  const scope = `${actor.userId}:data-right-create:${input.idempotencyKey}`;
  const replay = store.dataRightIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '请求已提交，本次返回原结果。', request: { ...replay } };
  const active = store.dataRightRequests.some((request) => request.ownerId === actor.userId && request.requestType === input.requestType && !['completed', 'rejected'].includes(request.status));
  if (active) return { success: false, code: 'ACTIVE_REQUEST_EXISTS', message: '同类型数据权利请求正在处理中。' };
  const riskLevel = input.requestType === 'delete' ? 'L5' : ['export', 'correct'].includes(input.requestType) ? 'L3' : 'L2';
  const now = new Date().toISOString();
  const request: DataRightRequest = { id: `data-right-${Date.now()}`, ownerId: actor.userId, campusId: actor.campusIds[0] ?? 'campus-main', requesterName: actor.userId === 'demo-student' ? '李明' : '学生本人', requestType: input.requestType, dataScope: input.dataScope.slice(0, 300), reason: input.reason.slice(0, 500), status: 'submitted', riskLevel, version: 1, createdAt: now, updatedAt: now };
  store.dataRightRequests.unshift(request);
  store.dataRightIdempotency.set(scope, { ...request });
  writeAuditSnapshot({ taskId: request.id, actorId: actor.userId, actorRole: actor.role, action: 'data_right:create', outcome: 'success', evidenceSummary: `数据主体提交 ${request.requestType} 请求；风险 ${request.riskLevel}；等待身份核验。` });
  return { success: true, code: 'REQUEST_CREATED', message: '数据权利请求已提交。', request: { ...request } };
}

export function processDataRightAction(actor: ActorContext, input: { requestId: string; action: DataRightAction; expectedVersion: number; comment: string; idempotencyKey: string }): { success: boolean; code: string; message: string; request?: DataRightRequest } {
  if (!hasDataAdminCapability(actor)) return { success: false, code: 'ROLE_DENIED', message: '当前岗位未叠加数据管理员能力包。' };
  const scope = `${actor.userId}:data-right:${input.idempotencyKey}`;
  const replay = store.dataRightIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该数据权利操作已完成，本次返回原结果。', request: { ...replay } };
  const request = store.dataRightRequests.find((item) => item.id === input.requestId && actor.campusIds.includes(item.campusId));
  if (!request) return { success: false, code: 'REQUEST_NOT_FOUND', message: '数据权利请求不存在或不在授权范围。' };
  if (request.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '请求已更新，请刷新后重试。', request: { ...request } };
  if (input.action === 'verify') {
    if (request.status !== 'submitted') return { success: false, code: 'ACTION_DENIED', message: '只有待受理请求可进行身份核验。' };
    request.status = 'verifying';
  } else if (input.action === 'approve') {
    if (request.status !== 'verifying') return { success: false, code: 'ACTION_DENIED', message: '身份核验完成后才能批准处理。' };
    request.status = 'processing';
    request.approvedBy = actor.userId;
  } else if (input.action === 'reject') {
    if (!['submitted', 'verifying'].includes(request.status)) return { success: false, code: 'ACTION_DENIED', message: '当前状态不能驳回。' };
    request.status = 'rejected';
  } else {
    if (request.status !== 'processing') return { success: false, code: 'ACTION_DENIED', message: '只有处理中的请求可完成。' };
    if (request.requestType === 'delete' && request.approvedBy === actor.userId) return { success: false, code: 'DUAL_CONTROL_REQUIRED', message: '删除请求为L5操作，批准人与执行人必须为不同人员。' };
    request.status = 'completed';
    request.completedBy = actor.userId;
  }
  request.decisionComment = input.comment.slice(0, 500);
  request.version += 1;
  request.updatedAt = new Date().toISOString();
  store.dataRightIdempotency.set(scope, { ...request });
  writeAuditSnapshot({ taskId: request.id, actorId: actor.userId, actorRole: actor.role, action: `data_right:${input.action}`, outcome: 'success', evidenceSummary: `数据权利请求 ${request.id} 处理为 ${request.status}；风险 ${request.riskLevel}；版本 ${request.version}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: '数据权利请求状态已更新。', request: { ...request } };
}
export function listAuditSnapshotsForActor(actor: ActorContext): AuditSnapshot[] {
  const broadRoles: readonly ActorContext['role'][] = ['SYS_ADMIN', 'EDU_BUREAU', 'AUDITOR', 'DISCIPLINE', 'DATA_ADMIN'];
  return store.audits.filter((audit) => {
    if (broadRoles.includes(actor.role)) return actor.role !== 'AUDITOR' || actor.assignedTaskIds?.includes(audit.taskId) || audit.taskId.startsWith('ai-');
    if (actor.role === 'AUDIT_EXTERNAL') return actor.assignedTaskIds?.includes(audit.taskId) ?? false;
    return audit.actorId === actor.userId;
  }).map((audit) => ({ ...audit }));
}

export function listComplianceFindings(actor: ActorContext): ComplianceFinding[] {
  const allowed: readonly ActorContext['role'][] = ['SYS_ADMIN', 'EDU_BUREAU', 'AUDITOR', 'AUDIT_EXTERNAL', 'DISCIPLINE', 'SCHOOL_LEADER', 'FUND_LEADER', 'FUND_ADMIN', 'FINANCE', 'AI_OPS', 'DEPT_ADMIN'];
  if (!allowed.includes(actor.role)) return [];
  return store.complianceFindings.filter((finding) => actor.campusIds.includes(finding.campusId) && (actor.role !== 'AUDIT_EXTERNAL' || actor.assignedTaskIds?.includes(finding.assignedTaskId))).map((finding) => ({ ...finding, evidenceRefs: [...finding.evidenceRefs] }));
}

export function processComplianceFindingAction(actor: ActorContext, input: { findingId: string; action: FindingAction; expectedVersion: number; comment: string; idempotencyKey: string }): { success: boolean; code: string; message: string; finding?: ComplianceFinding; disciplineCase?: DisciplineCase } {
  const scope = `${actor.userId}:finding:${input.idempotencyKey}`;
  const replay = store.findingIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该审计操作已完成，本次返回原结果。', finding: { ...replay, evidenceRefs: [...replay.evidenceRefs] } };
  const finding = store.complianceFindings.find((item) => item.id === input.findingId && actor.campusIds.includes(item.campusId));
  if (!finding || !listComplianceFindings(actor).some((item) => item.id === finding.id)) return { success: false, code: 'FINDING_NOT_FOUND', message: '审计发现不存在或不在授权范围。' };
  if (finding.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '审计发现已更新，请刷新后重试。', finding: { ...finding, evidenceRefs: [...finding.evidenceRefs] } };
  const from = finding.status;
  let disciplineCase: DisciplineCase | undefined;
  if (input.action === 'acknowledge') {
    if (!['AUDITOR', 'AUDIT_EXTERNAL'].includes(actor.role) || finding.status !== 'open') return { success: false, code: 'ACTION_DENIED', message: '只有授权审计人员可签收待办发现。' };
    finding.status = 'investigating';
  } else if (input.action === 'request_rectification') {
    if (!['AUDITOR', 'EDU_BUREAU'].includes(actor.role) || !['open', 'investigating'].includes(finding.status)) return { success: false, code: 'ACTION_DENIED', message: '只有审计或教育监管岗位可下发整改。' };
    finding.status = 'rectification';
  } else if (input.action === 'submit_rectification') {
    if (!['FUND_ADMIN', 'FINANCE', 'AI_OPS', 'DEPT_ADMIN'].includes(actor.role) || finding.status !== 'rectification') return { success: false, code: 'ACTION_DENIED', message: '当前岗位或状态不能提交整改证据。' };
    finding.status = 'investigating';
    finding.evidenceRefs.push(`rectification-${Date.now()}`);
  } else if (input.action === 'close') {
    if (!['AUDITOR', 'EDU_BUREAU'].includes(actor.role) || !['investigating', 'rectification'].includes(finding.status)) return { success: false, code: 'ACTION_DENIED', message: '只有审计或监管岗位可完成复核销号。' };
    finding.status = 'closed';
  } else {
    if (actor.role !== 'AUDITOR' || !['高', '重大'].includes(finding.severity)) return { success: false, code: 'ACTION_DENIED', message: '只有审计人员可将高风险发现移送纪检。' };
    const existing = store.disciplineCases.find((item) => item.sourceFindingId === finding.id && item.status !== 'closed');
    if (existing) return { success: false, code: 'CASE_EXISTS', message: '该发现已有处理中纪检案件。' };
    const now = new Date().toISOString();
    disciplineCase = { id: `discipline-${Date.now()}`, campusId: finding.campusId, sourceFindingId: finding.id, title: finding.title, severity: finding.severity as '高' | '重大', status: 'pending_dual_authorization', authorizerIds: [], conflictRisk: '待完成承办人与被调查对象利益冲突核验', evidenceChainHash: `sha256:${crypto.randomUUID().replaceAll('-', '')}`, aiRuleFrozen: false, version: 1, createdAt: now, updatedAt: now };
    store.disciplineCases.unshift(disciplineCase);
  }
  finding.lastComment = input.comment.slice(0, 500);
  finding.version += 1;
  finding.updatedAt = new Date().toISOString();
  store.findingIdempotency.set(scope, { ...finding, evidenceRefs: [...finding.evidenceRefs] });
  writeAuditSnapshot({ taskId: finding.assignedTaskId, actorId: actor.userId, actorRole: actor.role, action: `audit_finding:${input.action}`, outcome: 'success', evidenceSummary: `审计发现 ${finding.id} 从 ${from} 处理为 ${finding.status}；证据引用 ${finding.evidenceRefs.length} 项；版本 ${finding.version}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: disciplineCase ? '高风险发现已移送纪检，等待双人授权。' : '审计发现状态已更新。', finding: { ...finding, evidenceRefs: [...finding.evidenceRefs] }, disciplineCase };
}

export function listDisciplineCases(actor: ActorContext): DisciplineCase[] {
  if (!['DISCIPLINE', 'SYS_ADMIN', 'AUDITOR', 'EDU_BUREAU'].includes(actor.role)) return [];
  return store.disciplineCases.filter((item) => actor.campusIds.includes(item.campusId) && (actor.role !== 'DISCIPLINE' || !actor.assignedTaskIds?.length || actor.assignedTaskIds.includes(item.id))).map((item) => ({ ...item, authorizerIds: [...item.authorizerIds] }));
}

export function processDisciplineCaseAction(actor: ActorContext, input: { caseId: string; action: DisciplineAction; expectedVersion: number; comment: string; idempotencyKey: string }): { success: boolean; code: string; message: string; disciplineCase?: DisciplineCase } {
  if (actor.role !== 'DISCIPLINE') return { success: false, code: 'ROLE_DENIED', message: '只有纪检岗位可执行案件操作。' };
  const scope = `${actor.userId}:discipline:${input.idempotencyKey}`;
  const replay = store.disciplineIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该纪检操作已完成，本次返回原结果。', disciplineCase: { ...replay, authorizerIds: [...replay.authorizerIds] } };
  const item = store.disciplineCases.find((caseItem) => caseItem.id === input.caseId && actor.campusIds.includes(caseItem.campusId));
  if (!item) return { success: false, code: 'CASE_NOT_FOUND', message: '纪检案件不存在或不在授权范围。' };
  if (item.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '案件已更新，请刷新后重试。', disciplineCase: { ...item, authorizerIds: [...item.authorizerIds] } };
  const from = item.status;
  if (input.action === 'second_authorize') {
    if (item.status !== 'pending_dual_authorization') return { success: false, code: 'ACTION_DENIED', message: '当前案件不需要双人授权。' };
    if (item.authorizerIds.includes(actor.userId)) return { success: false, code: 'SAME_PERSON_DENIED', message: '同一人员不能重复完成双人授权。' };
    item.authorizerIds.push(actor.userId);
    if (item.authorizerIds.length >= 2) item.status = 'investigating';
  } else if (input.action === 'freeze_ai_rule') {
    if (item.status !== 'investigating') return { success: false, code: 'ACTION_DENIED', message: '仅调查中的案件可冻结关联AI规则。' };
    item.aiRuleFrozen = true;
  } else if (input.action === 'submit_investigation') {
    if (item.status !== 'investigating' || item.authorizerIds.length < 2) return { success: false, code: 'ACTION_DENIED', message: '双人授权完成后才能提交调查结论。' };
    item.status = 'decision_pending';
  } else {
    if (item.status !== 'decision_pending') return { success: false, code: 'ACTION_DENIED', message: '只有待决定案件可记录处理决定。' };
    item.status = 'closed';
    item.decision = input.comment.slice(0, 500);
  }
  item.lastComment = input.comment.slice(0, 500);
  item.version += 1;
  item.updatedAt = new Date().toISOString();
  const snapshot = { ...item, authorizerIds: [...item.authorizerIds] };
  store.disciplineIdempotency.set(scope, snapshot);
  writeAuditSnapshot({ taskId: item.id, actorId: actor.userId, actorRole: actor.role, action: `discipline:${input.action}`, outcome: 'success', evidenceSummary: `纪检案件 ${item.id} 从 ${from} 处理为 ${item.status}；授权人数 ${item.authorizerIds.length}；证据链 ${item.evidenceChainHash}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: '纪检案件状态已更新。', disciplineCase: snapshot };
}
function maskStudentNo(studentNo: string): string {
  return studentNo.length > 6 ? `${studentNo.slice(0, 4)}****${studentNo.slice(-2)}` : '******';
}

export function listPublicityRecords(actor: ActorContext): PublicityRecord[] {
  const internalRoles: readonly ActorContext['role'][] = ['SYS_ADMIN', 'SCHOOL_LEADER', 'FUND_LEADER', 'STU_AFFAIRS', 'FUND_ADMIN', 'DEPT_ADMIN', 'COUNSELOR', 'AUDITOR', 'AUDIT_EXTERNAL', 'EDU_BUREAU'];
  const internal = internalRoles.includes(actor.role);
  return store.publicityRecords.filter((record) => {
    if (!actor.campusIds.includes(record.campusId)) return false;
    if (!internal && !['open', 'closed'].includes(record.status)) return false;
    if (actor.role === 'DEPT_ADMIN' && !(actor.departmentIds?.includes(record.departmentId) ?? false)) return false;
    if (actor.role === 'COUNSELOR') {
      const application = store.applications.find((item) => item.id === record.applicationId);
      if (!application || !(actor.classIds?.includes(application.classId) ?? false)) return false;
    }
    return true;
  }).map((record) => internal ? { ...record } : { ...record, studentName: record.maskedStudentName, studentNo: maskStudentNo(record.studentNo), lastComment: undefined });
}

export function processPublicityAction(actor: ActorContext, input: { publicityId: string; action: PublicityAction; expectedVersion: number; comment: string; idempotencyKey: string }): { success: boolean; code: string; message: string; publicity?: PublicityRecord } {
  const scope = `${actor.userId}:publicity:${input.idempotencyKey}`;
  const replay = store.publicityIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该公示操作已完成，本次返回原结果。', publicity: { ...replay } };
  const record = store.publicityRecords.find((item) => item.id === input.publicityId && actor.campusIds.includes(item.campusId));
  if (!record) return { success: false, code: 'PUBLICITY_NOT_FOUND', message: '公示记录不存在或不在授权范围。' };
  if (record.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '公示记录已更新，请刷新后重试。', publicity: { ...record } };
  const application = store.applications.find((item) => item.id === record.applicationId);
  const from = record.status;
  if (input.action === 'publish') {
    if (actor.role !== 'FUND_ADMIN' || record.status !== 'draft' || application?.status !== '待公示') return { success: false, code: 'ACTION_DENIED', message: '只有校级资助管理员可发布已完成复审的待公示名单。' };
    record.status = 'open';
    application.status = '公示中';
    application.version = (application.version ?? 1) + 1;
  } else if (input.action === 'submit_objection') {
    if (actor.role !== 'STUDENT' || record.status !== 'open') return { success: false, code: 'ACTION_DENIED', message: '只有学生可在公示期内提交异议。' };
    record.objectionCount += 1;
    record.unresolvedObjections += 1;
  } else if (input.action === 'resolve_objection') {
    if (actor.role !== 'FUND_ADMIN' || record.status !== 'open' || record.unresolvedObjections < 1) return { success: false, code: 'ACTION_DENIED', message: '当前没有可处理的公示异议。' };
    record.unresolvedObjections -= 1;
  } else {
    if (actor.role !== 'FUND_ADMIN' || record.status !== 'open') return { success: false, code: 'ACTION_DENIED', message: '只有校级资助管理员可结束公示。' };
    if (record.unresolvedObjections > 0) return { success: false, code: 'UNRESOLVED_OBJECTIONS', message: '仍有未办结异议，不能结束公示。' };
    record.status = 'closed';
    if (application) {
      application.status = '待发放';
      application.version = (application.version ?? 1) + 1;
    }
  }
  record.lastComment = input.comment.slice(0, 500);
  record.version += 1;
  record.updatedAt = new Date().toISOString();
  store.publicityIdempotency.set(scope, { ...record });
  writeAuditSnapshot({ taskId: `publicity-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: `publicity:${input.action}`, outcome: 'success', evidenceSummary: `公示 ${record.id} 从 ${from} 处理为 ${record.status}；未办结异议 ${record.unresolvedObjections}；版本 ${record.version}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: input.action === 'submit_objection' ? '公示异议已提交并进入受理队列。' : '公示业务操作已完成。', publicity: { ...record } };
}

export function listAidAppeals(actor: ActorContext): AidAppeal[] {
  return store.appeals.filter((appeal) => {
    if (!actor.campusIds.includes(appeal.campusId)) return false;
    if (actor.role === 'STUDENT') return appeal.ownerId === actor.userId;
    if (actor.role === 'DEPT_ADMIN') return actor.departmentIds?.includes(appeal.departmentId) ?? false;
    if (actor.role === 'COUNSELOR') return actor.classIds?.includes(appeal.classId) ?? false;
    if (['FUND_ADMIN', 'FUND_LEADER', 'SCHOOL_LEADER', 'STU_AFFAIRS', 'SYS_ADMIN', 'EDU_BUREAU'].includes(actor.role)) return true;
    const application = store.applications.find((item) => item.id === appeal.applicationId);
    return application ? canSeeApplication(actor, application) : false;
  }).map((appeal) => ({ ...appeal }));
}

export function createAidAppeal(actor: ActorContext, input: { applicationId: string; reason: string; evidenceCount: number; idempotencyKey: string }): { success: boolean; code: string; message: string; appeal?: AidAppeal } {
  if (actor.role !== 'STUDENT') return { success: false, code: 'ROLE_DENIED', message: '只有学生本人可以提交申诉。' };
  const scope = `${actor.userId}:appeal-create:${input.idempotencyKey}`;
  const replay = store.appealIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '申诉已提交，本次返回原结果。', appeal: { ...replay } };
  const application = store.applications.find((item) => item.id === input.applicationId && item.ownerId === actor.userId && actor.campusIds.includes(item.campusId));
  if (!application) return { success: false, code: 'APPLICATION_NOT_FOUND', message: '申请不存在或不属于当前学生。' };
  if (!['已驳回', '已退回补正'].includes(application.status)) return { success: false, code: 'STATUS_DENIED', message: '只有已驳回或退回补正的申请可以发起申诉。' };
  if (store.appeals.some((appeal) => appeal.applicationId === application.id && ['submitted', 'pending_leader_review'].includes(appeal.status))) return { success: false, code: 'ACTIVE_APPEAL_EXISTS', message: '该申请已有处理中的申诉。' };
  const now = new Date().toISOString();
  const appeal: AidAppeal = { id: `appeal-${Date.now()}`, applicationId: application.id, ownerId: actor.userId, campusId: application.campusId, departmentId: application.departmentId, classId: application.classId, studentName: application.studentName, studentNo: application.studentNo, projectName: application.projectName, originalStatus: application.status, reason: input.reason.slice(0, 1000), evidenceCount: input.evidenceCount, status: 'submitted', submittedAt: now, version: 1, updatedAt: now };
  application.status = '申诉处理中';
  application.version = (application.version ?? 1) + 1;
  store.appeals.unshift(appeal);
  store.appealIdempotency.set(scope, { ...appeal });
  writeAuditSnapshot({ taskId: `appeal-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: 'appeal:create', outcome: 'success', evidenceSummary: `学生本人对申请 ${application.id} 提交申诉，证据 ${appeal.evidenceCount} 项；进入人工处理。` });
  return { success: true, code: 'APPEAL_CREATED', message: '申诉已提交，进入资助中心初核。', appeal: { ...appeal } };
}

export function processAidAppealAction(actor: ActorContext, input: { appealId: string; action: AppealAction; expectedVersion: number; comment: string; idempotencyKey: string }): { success: boolean; code: string; message: string; appeal?: AidAppeal } {
  const scope = `${actor.userId}:appeal-action:${input.idempotencyKey}`;
  const replay = store.appealIdempotency.get(scope);
  if (replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该申诉操作已完成，本次返回原结果。', appeal: { ...replay } };
  const appeal = store.appeals.find((item) => item.id === input.appealId && actor.campusIds.includes(item.campusId));
  if (!appeal || !listAidAppeals(actor).some((item) => item.id === appeal.id)) return { success: false, code: 'APPEAL_NOT_FOUND', message: '申诉不存在或不在授权范围。' };
  if (appeal.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '申诉已更新，请刷新后重试。', appeal: { ...appeal } };
  const application = store.applications.find((item) => item.id === appeal.applicationId);
  if (input.action === 'initial_review') {
    if (actor.role !== 'FUND_ADMIN' || appeal.status !== 'submitted') return { success: false, code: 'ACTION_DENIED', message: '只有校级资助管理员可完成申诉初核。' };
    appeal.status = 'pending_leader_review';
    appeal.handlerId = actor.userId;
  } else if (input.action === 'resolve_change') {
    if (actor.role !== 'FUND_LEADER' || appeal.status !== 'pending_leader_review') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可变更原结论。' };
    appeal.status = 'resolved_changed';
    appeal.handlerId = actor.userId;
    if (application) application.status = '待校级复审';
  } else if (input.action === 'resolve_uphold') {
    if (actor.role !== 'FUND_LEADER' || appeal.status !== 'pending_leader_review') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可维持原结论。' };
    appeal.status = 'resolved_upheld';
    appeal.handlerId = actor.userId;
    if (application) application.status = appeal.originalStatus;
  } else {
    if (actor.role !== 'STUDENT' || appeal.ownerId !== actor.userId || appeal.status !== 'submitted') return { success: false, code: 'ACTION_DENIED', message: '只有申诉学生本人可在初核前撤回。' };
    appeal.status = 'withdrawn';
    if (application) application.status = appeal.originalStatus;
  }
  appeal.decisionComment = input.comment.slice(0, 500);
  appeal.version += 1;
  appeal.updatedAt = new Date().toISOString();
  if (application) {
    application.version = (application.version ?? 1) + 1;
    application.updatedAt = appeal.updatedAt;
  }
  store.appealIdempotency.set(scope, { ...appeal });
  writeAuditSnapshot({ taskId: `appeal-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: `appeal:${input.action}`, outcome: 'success', evidenceSummary: `申诉 ${appeal.id} 处理为 ${appeal.status}；申诉快照与人工意见已冻结；版本 ${appeal.version}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: '申诉处理状态已更新。', appeal: { ...appeal } };
}
function canManageFunding(actor: ActorContext): boolean {
  return actor.role === 'FUND_ADMIN' || actor.role === 'FUND_LEADER';
}

function canReadInternalFunding(actor: ActorContext): boolean {
  return ['SYS_ADMIN', 'SCHOOL_LEADER', 'FUND_LEADER', 'STU_AFFAIRS', 'FUND_ADMIN', 'FINANCE', 'EDU_BUREAU', 'AUDITOR', 'AUDIT_EXTERNAL'].includes(actor.role);
}

export function listFundingPolicies(actor: ActorContext): FundingPolicy[] {
  return store.fundingPolicies
    .filter((policy) => actor.campusIds.includes(policy.campusId) && (canReadInternalFunding(actor) || canManageFunding(actor) || policy.status === 'published'))
    .map((policy) => ({ ...policy }));
}

export function createFundingPolicy(actor: ActorContext, input: Omit<FundingPolicy, 'id' | 'campusId' | 'status' | 'createdBy' | 'version' | 'createdAt' | 'updatedAt' | 'reviewedBy' | 'reviewComment'> & { idempotencyKey: string }): { success: boolean; code: string; message: string; policy?: FundingPolicy } {
  if (actor.role !== 'FUND_ADMIN') return { success: false, code: 'ROLE_DENIED', message: '只有校级资助中心管理员可以起草政策。' };
  const scope = `${actor.userId}:policy:${input.idempotencyKey}`;
  const replay = store.fundingIdempotency.get(scope);
  if (replay && 'authority' in replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '政策草稿已创建，本次返回原结果。', policy: { ...replay } };
  if (store.fundingPolicies.some((policy) => policy.code === input.code)) return { success: false, code: 'POLICY_CODE_EXISTS', message: '政策编码已存在。' };
  const now = new Date().toISOString();
  const policy: FundingPolicy = {
    id: `policy-${Date.now()}`,
    campusId: actor.campusIds[0] ?? 'campus-main',
    status: 'draft',
    createdBy: actor.userId,
    version: 1,
    createdAt: now,
    updatedAt: now,
    code: input.code,
    name: input.name,
    category: input.category,
    authority: input.authority,
    versionNo: input.versionNo,
    summary: input.summary,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    sourceFileName: input.sourceFileName,
  };
  store.fundingPolicies.unshift(policy);
  store.fundingIdempotency.set(scope, { ...policy });
  writeAuditSnapshot({ taskId: `policy-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: 'policy:create', outcome: 'success', evidenceSummary: `创建政策草稿 ${policy.code}，版本 ${policy.versionNo}；尚未发布。` });
  return { success: true, code: 'POLICY_CREATED', message: '政策草稿已创建。', policy: { ...policy } };
}

export function processFundingPolicyAction(actor: ActorContext, input: { policyId: string; action: FundingPolicyAction; expectedVersion: number; comment: string; idempotencyKey: string }): { success: boolean; code: string; message: string; policy?: FundingPolicy } {
  const scope = `${actor.userId}:policy-action:${input.idempotencyKey}`;
  const replay = store.fundingIdempotency.get(scope);
  if (replay && 'authority' in replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该政策操作已完成，本次返回原结果。', policy: { ...replay } };
  const policy = store.fundingPolicies.find((item) => item.id === input.policyId && actor.campusIds.includes(item.campusId));
  if (!policy) return { success: false, code: 'POLICY_NOT_FOUND', message: '政策不存在或不在当前授权范围。' };
  if (policy.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '政策已被其他人员更新，请刷新后重试。', policy: { ...policy } };

  const from = policy.status;
  if (input.action === 'submit') {
    if (actor.role !== 'FUND_ADMIN' || !['draft', 'rejected'].includes(policy.status)) return { success: false, code: 'ACTION_DENIED', message: '只有起草岗位可提交草稿或被退回政策。' };
    policy.status = 'pending_approval';
  } else if (input.action === 'approve') {
    if (actor.role !== 'FUND_LEADER' || policy.status !== 'pending_approval') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可批准待审政策。' };
    policy.status = 'published';
    policy.reviewedBy = actor.userId;
  } else if (input.action === 'reject') {
    if (actor.role !== 'FUND_LEADER' || policy.status !== 'pending_approval') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可退回待审政策。' };
    policy.status = 'rejected';
    policy.reviewedBy = actor.userId;
  } else {
    if (actor.role !== 'FUND_LEADER' || policy.status !== 'published') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可终止已发布政策。' };
    if (store.aidProjects.some((project) => project.policyId === policy.id && ['active', 'pending_approval'].includes(project.status))) return { success: false, code: 'ACTIVE_PROJECT_EXISTS', message: '该政策仍关联运行中或待审批项目，不能终止。' };
    policy.status = 'retired';
    policy.reviewedBy = actor.userId;
  }
  policy.reviewComment = input.comment.slice(0, 500);
  policy.version += 1;
  policy.updatedAt = new Date().toISOString();
  store.fundingIdempotency.set(scope, { ...policy });
  writeAuditSnapshot({ taskId: `policy-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: `policy:${input.action}`, outcome: 'success', evidenceSummary: `政策 ${policy.code} 从 ${from} 变更为 ${policy.status}；版本 ${policy.version}；人工意见：${input.comment.slice(0, 100)}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: `政策状态已更新为 ${policy.status}。`, policy: { ...policy } };
}

// DEMO ONLY: raw approved project projection for student eligibility within one campus.
export function listActiveAidProjectsForCampus(campusIds: readonly string[]): AidProject[] {
  return store.aidProjects.filter(project => project.status === 'active' && campusIds.includes(project.campusId)).map(project => ({ ...project }));
}

export function listAidProjects(actor: ActorContext): AidProject[] {
  return store.aidProjects
    .filter((project) => actor.campusIds.includes(project.campusId) && (canReadInternalFunding(actor) || canManageFunding(actor) || ['active', 'closed'].includes(project.status)))
    .map((project) => ({ ...project }));
}

export function createAidProject(actor: ActorContext, input: Omit<AidProject, 'id' | 'campusId' | 'status' | 'createdBy' | 'approvedBy' | 'usedQuota' | 'version' | 'createdAt' | 'updatedAt' | 'lastComment'> & { idempotencyKey: string }): { success: boolean; code: string; message: string; project?: AidProject } {
  if (actor.role !== 'FUND_ADMIN') return { success: false, code: 'ROLE_DENIED', message: '只有校级资助中心管理员可以创建项目。' };
  const policy = store.fundingPolicies.find((item) => item.id === input.policyId && actor.campusIds.includes(item.campusId));
  if (!policy) return { success: false, code: 'POLICY_NOT_FOUND', message: '关联政策不存在。' };
  const scope = `${actor.userId}:project:${input.idempotencyKey}`;
  const replay = store.fundingIdempotency.get(scope);
  if (replay && 'budgetAmount' in replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '项目草稿已创建，本次返回原结果。', project: { ...replay } };
  if (store.aidProjects.some((project) => project.code === input.code)) return { success: false, code: 'PROJECT_CODE_EXISTS', message: '项目编码已存在。' };
  if (input.defaultAmount * input.quota > input.budgetAmount) return { success: false, code: 'BUDGET_QUOTA_MISMATCH', message: '项目预算不足以覆盖默认标准与名额。' };
  const now = new Date().toISOString();
  const project: AidProject = {
    id: `project-${Date.now()}`,
    campusId: actor.campusIds[0] ?? 'campus-main',
    status: 'draft',
    createdBy: actor.userId,
    usedQuota: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    code: input.code,
    policyId: input.policyId,
    name: input.name,
    category: input.category,
    academicYear: input.academicYear,
    budgetAmount: input.budgetAmount,
    defaultAmount: input.defaultAmount,
    quota: input.quota,
    applicationStart: input.applicationStart,
    applicationEnd: input.applicationEnd,
    criteria: input.criteria,
  };
  store.aidProjects.unshift(project);
  store.fundingIdempotency.set(scope, { ...project });
  persistDemoBusinessSnapshot();
  writeAuditSnapshot({ taskId: `project-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: 'aid_project:create', outcome: 'success', evidenceSummary: `创建资助项目草稿 ${project.code}，预算 ${project.budgetAmount} 元、名额 ${project.quota}。` });
  return { success: true, code: 'PROJECT_CREATED', message: '资助项目草稿已创建。', project: { ...project } };
}

export function processAidProjectAction(actor: ActorContext, input: { projectId: string; action: AidProjectAction; expectedVersion: number; comment: string; idempotencyKey: string; quota?: number }): { success: boolean; code: string; message: string; project?: AidProject } {
  const scope = `${actor.userId}:project-action:${input.idempotencyKey}`;
  const replay = store.fundingIdempotency.get(scope);
  if (replay && 'budgetAmount' in replay) return { success: true, code: 'IDEMPOTENT_REPLAY', message: '该项目操作已完成，本次返回原结果。', project: { ...replay } };
  const project = store.aidProjects.find((item) => item.id === input.projectId && actor.campusIds.includes(item.campusId));
  if (!project) return { success: false, code: 'PROJECT_NOT_FOUND', message: '项目不存在或不在当前授权范围。' };
  if (project.version !== input.expectedVersion) return { success: false, code: 'VERSION_CONFLICT', message: '项目已被其他人员更新，请刷新后重试。', project: { ...project } };
  const policy = store.fundingPolicies.find((item) => item.id === project.policyId);
  const from = project.status;

  if (input.action === 'submit') {
    if (actor.role !== 'FUND_ADMIN' || !['draft', 'rejected'].includes(project.status)) return { success: false, code: 'ACTION_DENIED', message: '只有项目管理员可提交草稿或被退回项目。' };
    if (policy?.status !== 'published') return { success: false, code: 'POLICY_NOT_PUBLISHED', message: '关联政策尚未发布，项目不能提交审批。' };
    project.status = 'pending_approval';
  } else if (input.action === 'approve') {
    if (actor.role !== 'FUND_LEADER' || project.status !== 'pending_approval') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可批准待审项目。' };
    project.status = 'active';
    project.approvedBy = actor.userId;
  } else if (input.action === 'reject') {
    if (actor.role !== 'FUND_LEADER' || project.status !== 'pending_approval') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可退回待审项目。' };
    project.status = 'rejected';
    project.approvedBy = actor.userId;
  } else if (input.action === 'suspend') {
    if (actor.role !== 'FUND_LEADER' || project.status !== 'active') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可暂停运行中项目。' };
    project.status = 'suspended';
  } else if (input.action === 'reopen') {
    if (actor.role !== 'FUND_LEADER' || project.status !== 'suspended') return { success: false, code: 'ACTION_DENIED', message: '只有资助中心领导可恢复暂停项目。' };
    project.status = 'active';
  } else if (input.action === 'close') {
    if (actor.role !== 'FUND_ADMIN' || !['active', 'suspended'].includes(project.status)) return { success: false, code: 'ACTION_DENIED', message: '只有项目管理员可关闭已运行或暂停项目。' };
    project.status = 'closed';
  } else {
    if (actor.role !== 'FUND_ADMIN' || !['draft', 'active', 'suspended'].includes(project.status)) return { success: false, code: 'ACTION_DENIED', message: '当前角色或项目状态不能调整名额。' };
    if (!Number.isInteger(input.quota) || (input.quota ?? 0) < project.usedQuota) return { success: false, code: 'INVALID_QUOTA', message: '调整后名额必须是整数且不能小于已使用名额。' };
    if ((input.quota ?? 0) * project.defaultAmount > project.budgetAmount) return { success: false, code: 'BUDGET_QUOTA_MISMATCH', message: '调整后预算不足以覆盖默认标准与名额。' };
    project.quota = input.quota!;
  }
  project.lastComment = input.comment.slice(0, 500);
  project.version += 1;
  project.updatedAt = new Date().toISOString();
  store.fundingIdempotency.set(scope, { ...project });
  persistDemoBusinessSnapshot();
  writeAuditSnapshot({ taskId: `project-${input.idempotencyKey}`, actorId: actor.userId, actorRole: actor.role, action: `aid_project:${input.action}`, outcome: 'success', evidenceSummary: `项目 ${project.code} 从 ${from} 处理为 ${project.status}；版本 ${project.version}；人工意见：${input.comment.slice(0, 100)}。` });
  return { success: true, code: 'ACTION_COMPLETED', message: input.action === 'adjust_quota' ? `项目名额已调整为 ${project.quota}。` : `项目状态已更新为 ${project.status}。`, project: { ...project } };
}
type AuditSnapshotWrite = Omit<AuditSnapshot, 'id' | 'createdAt' | 'evidenceHash'> & {
  category?: AuditEvidenceInput['category'];
  level?: AuditEvidenceInput['level'];
  actorType?: AuditEvidenceInput['actorType'];
  resource?: AuditEvidenceInput['resource'];
  operationDetails?: AuditEvidenceInput['operationDetails'];
  before?: AuditEvidenceInput['before'];
  after?: AuditEvidenceInput['after'];
  ai?: AuditEvidenceInput['ai'];
  permission?: AuditEvidenceInput['permission'];
  context?: AuditEvidenceInput['context'];
  evidenceRefs?: AuditEvidenceInput['evidenceRefs'];
  errorCode?: string;
  errorMessage?: string;
  affectedRows?: number;
};

export function writeAuditSnapshot(snapshot: AuditSnapshotWrite): AuditSnapshot {
  const evidence = appendAuditEvidence({
    taskId: snapshot.taskId,
    actorId: snapshot.actorId,
    actorRole: snapshot.actorRole,
    actorType: snapshot.actorType,
    action: snapshot.action,
    category: snapshot.category,
    level: snapshot.level,
    outcome: snapshot.outcome,
    evidenceSummary: snapshot.evidenceSummary,
    resource: snapshot.resource,
    operationDetails: snapshot.operationDetails,
    before: snapshot.before,
    after: snapshot.after,
    ai: snapshot.ai,
    permission: snapshot.permission,
    context: snapshot.context,
    evidenceRefs: snapshot.evidenceRefs,
    errorCode: snapshot.errorCode,
    errorMessage: snapshot.errorMessage,
    affectedRows: snapshot.affectedRows,
  });
  const record: AuditSnapshot = { id: evidence.id, createdAt: evidence.timestamp, taskId: snapshot.taskId, actorId: snapshot.actorId, actorRole: snapshot.actorRole, action: snapshot.action, outcome: snapshot.outcome, evidenceSummary: snapshot.evidenceSummary, evidenceHash: evidence.recordHash };
  store.audits.unshift(record);
  return record;
}

export function listAuditSnapshots(): readonly AuditSnapshot[] {
  return store.audits;
}

export function getDemoStoreStatus(): { mode: 'in-memory-demo'; applications: number; notifications: number; audits: number } {
  return { mode: 'in-memory-demo', applications: store.applications.length, notifications: store.notifications.length, audits: store.audits.length };
}

























