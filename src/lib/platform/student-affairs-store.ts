import type { ActorContext } from "@/lib/platform/authorization";
import { completeWithDeepSeek, isModelConfigured } from "@/lib/ai/model-gateway";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";

export interface GrowthCase { id: string; studentCode: string; college: string; grade: string; project: string; growthScore: number; growthDelta: number; academicDelta: number; serviceHours: number; keyEvent: string; risk: "stable" | "attention" | "priority"; status: "tracking" | "intervening" | "closed"; nextFollowUp: string; version: number }
export interface EducationProject { id: string; name: string; category: string; participants: number; completionRate: number; growthGain: number; costPerStudent: number; roi: number; status: "running" | "evaluating" | "completed" }
export interface TypicalCase { id: string; title: string; studentCode: string; tags: string[]; highlights: string; evidenceCount: number; consent: boolean; status: "draft" | "approved" | "published"; version: number }
export interface EducationActivity { id: string; name: string; type: string; date: string; audience: string; enrolled: number; completed: number; satisfaction: number; status: "draft" | "open" | "completed"; version: number }
export interface AffairsReport { id: string; title: string; content: string; model: string; generatedAt: string; aggregateOnly: true }
export interface StudentAffairsSnapshot { cases: GrowthCase[]; projects: EducationProject[]; typicalCases: TypicalCase[]; activities: EducationActivity[]; reports: AffairsReport[]; indicators: { supportedStudents: number; averageGrowthGain: number; volunteerHours: number; projectCompletionRate: number; highPriorityCases: number; consentCoverage: number } }
interface Store extends StudentAffairsSnapshot { idempotency: Map<string, { success: boolean; code: string; message: string }> }
function createStore(): Store { return {
 cases: [
  { id: "growth-001", studentCode: "农学·24***01", college: "农学院", grade: "2024级", project: "国家助学金 + 学业伙伴计划", growthScore: 86, growthDelta: 14, academicDelta: 0.62, serviceHours: 36, keyEvent: "获校级乡村振兴调研项目优秀成员", risk: "stable", status: "tracking", nextFollowUp: "2026-09-15", version: 2 },
  { id: "growth-002", studentCode: "经管·23***18", college: "经济管理学院", grade: "2023级", project: "勤工助学 + 职业启航", growthScore: 78, growthDelta: 9, academicDelta: 0.31, serviceHours: 22, keyEvent: "完成银行实务技能认证", risk: "stable", status: "tracking", nextFollowUp: "2026-09-20", version: 3 },
  { id: "growth-003", studentCode: "信息·24***07", college: "信息科学与技术学院", grade: "2024级", project: "国家助学金", growthScore: 61, growthDelta: -3, academicDelta: -0.44, serviceHours: 4, keyEvent: "连续两次学业预警，近期活动参与下降", risk: "priority", status: "intervening", nextFollowUp: "2026-08-08", version: 4 },
  { id: "growth-004", studentCode: "海洋·22***26", college: "海洋学院", grade: "2022级", project: "基层就业学费补偿", growthScore: 82, growthDelta: 11, academicDelta: 0.18, serviceHours: 48, keyEvent: "签约县域水产技术推广岗位", risk: "stable", status: "closed", nextFollowUp: "已结项", version: 2 },
  { id: "growth-005", studentCode: "动科·23***12", college: "动物科技学院", grade: "2023级", project: "临时困难补助 + 心理关怀", growthScore: 68, growthDelta: 4, academicDelta: 0.06, serviceHours: 12, keyEvent: "家庭突发变故后恢复返校", risk: "attention", status: "tracking", nextFollowUp: "2026-08-18", version: 1 },
 ],
 projects: [
  { id: "edu-001", name: "学业伙伴成长计划", category: "学业帮扶", participants: 386, completionRate: 92.4, growthGain: 12.8, costPerStudent: 286, roi: 4.7, status: "running" },
  { id: "edu-002", name: "职业启航训练营", category: "就业能力", participants: 214, completionRate: 88.1, growthGain: 10.3, costPerStudent: 420, roi: 3.9, status: "evaluating" },
  { id: "edu-003", name: "乡村振兴志愿行动", category: "感恩教育", participants: 528, completionRate: 95.6, growthGain: 15.2, costPerStudent: 168, roi: 6.2, status: "completed" },
  { id: "edu-004", name: "心理韧性支持小组", category: "心理关怀", participants: 96, completionRate: 84.3, growthGain: 8.6, costPerStudent: 610, roi: 2.8, status: "running" },
 ],
 typicalCases: [
  { id: "case-001", title: "从受助到助人：乡村技术服务成长案例", studentCode: "农学·24***01", tags: ["乡村振兴", "志愿服务", "学业提升"], highlights: "一年内完成36小时志愿服务，专业成绩提升0.62绩点，形成可复用的“资助+专业实践”路径。", evidenceCount: 8, consent: true, status: "published", version: 3 },
  { id: "case-002", title: "临时困难学生复学支持案例", studentCode: "动科·23***12", tags: ["临时困难", "协同关怀"], highlights: "通过资金、心理与学业三线协同，学生在两周内恢复返校并进入稳定追踪。", evidenceCount: 5, consent: true, status: "approved", version: 2 },
  { id: "case-003", title: "勤工助学岗位能力转化案例", studentCode: "经管·23***18", tags: ["勤工助学", "就业能力"], highlights: "待AI提取亮点并由业务人员确认。", evidenceCount: 4, consent: false, status: "draft", version: 1 },
 ],
 activities: [
  { id: "act-001", name: "受助学生诚信与感恩主题月", type: "感恩教育", date: "2026-09-05", audience: "全体受助学生", enrolled: 1260, completed: 0, satisfaction: 0, status: "open", version: 2 },
  { id: "act-002", name: "优秀受助生成长分享会", type: "励志教育", date: "2026-09-12", audience: "2024级新生", enrolled: 486, completed: 0, satisfaction: 0, status: "open", version: 1 },
  { id: "act-003", name: "暑期乡村振兴志愿行动", type: "志愿服务", date: "2026-07-20", audience: "项目报名学生", enrolled: 528, completed: 505, satisfaction: 96.2, status: "completed", version: 4 },
 ], reports: [],
 indicators: { supportedStudents: 6842, averageGrowthGain: 11.7, volunteerHours: 28640, projectCompletionRate: 91.4, highPriorityCases: 23, consentCoverage: 96.8 },
 idempotency: new Map(),
}; }
type Root = typeof globalThis & { __jhxtStudentAffairs?: Store }; const root = globalThis as Root; const store = root.__jhxtStudentAffairs ?? createStore(); root.__jhxtStudentAffairs = store;
function canRead(actor: ActorContext) { return ["STU_AFFAIRS", "SCHOOL_LEADER"].includes(actor.role); }
export function getStudentAffairsSnapshot(actor: ActorContext) { if (!canRead(actor)) return null; return { cases: store.cases.map(item => ({ ...item })), projects: store.projects.map(item => ({ ...item })), typicalCases: store.typicalCases.map(item => ({ ...item, tags: [...item.tags] })), activities: store.activities.map(item => ({ ...item })), reports: store.reports.map(item => ({ ...item })), indicators: { ...store.indicators } }; }
export type AffairsAction = { action: "record_follow_up"; caseId: string; status: GrowthCase["status"]; nextFollowUp: string; expectedVersion: number; note: string } | { action: "approve_typical_case"; caseId: string; expectedVersion: number; note: string } | { action: "close_activity"; activityId: string; completed: number; satisfaction: number; expectedVersion: number; note: string };
export function processAffairsAction(actor: ActorContext, input: AffairsAction, key: string) {
 if (actor.role !== "STU_AFFAIRS") return { success: false, code: "ROLE_DENIED", message: "仅资助育人岗位可变更成长追踪数据。" }; if (!key) return { success: false, code: "IDEMPOTENCY_REQUIRED", message: "缺少幂等键。" }; if (input.note.trim().length < 4) return { success: false, code: "NOTE_REQUIRED", message: "请填写跟进依据。" }; const scope = `${actor.userId}:${key}`; const replay = store.idempotency.get(scope); if (replay) return replay; let message = "育人记录已更新";
 if (input.action === "record_follow_up") { const item = store.cases.find(row => row.id === input.caseId); if (!item) return { success: false, code: "NOT_FOUND", message: "成长追踪记录不存在。" }; if (item.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "成长记录已更新，请刷新后重试。" }; item.status = input.status; item.nextFollowUp = input.nextFollowUp; item.keyEvent = input.note.trim(); item.version += 1; message = `${item.studentCode} 的成长跟进已登记`;
 } else if (input.action === "approve_typical_case") { const item = store.typicalCases.find(row => row.id === input.caseId); if (!item) return { success: false, code: "NOT_FOUND", message: "典型案例不存在。" }; if (item.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "案例已更新，请刷新后重试。" }; if (!item.consent) return { success: false, code: "CONSENT_REQUIRED", message: "未取得学生授权同意，案例不得批准或发布。" }; item.status = "approved"; item.version += 1; message = `${item.title} 已通过业务审核`;
 } else { const item = store.activities.find(row => row.id === input.activityId); if (!item) return { success: false, code: "NOT_FOUND", message: "活动不存在。" }; if (item.version !== input.expectedVersion) return { success: false, code: "VERSION_CONFLICT", message: "活动已更新，请刷新后重试。" }; if (input.completed < 0 || input.completed > item.enrolled || input.satisfaction < 0 || input.satisfaction > 100) return { success: false, code: "VALIDATION_FAILED", message: "完成人数或满意度不符合确定性校验规则。" }; item.completed = input.completed; item.satisfaction = input.satisfaction; item.status = "completed"; item.version += 1; message = `${item.name} 已完成结项`;
 }
 const result = { success: true, code: "ACTION_COMPLETED", message }; store.idempotency.set(scope, result); writeAuditSnapshot({ taskId: `affairs-${Date.now()}`, actorId: actor.userId, actorRole: actor.role, action: `student_affairs:${input.action}`, outcome: "success", evidenceSummary: `${message}；人工说明：${input.note.slice(0, 120)}` }); return result;
}
export async function generateAffairsReport(actor: ActorContext) {
 if (actor.role !== "STU_AFFAIRS") return { success: false, code: "ROLE_DENIED", message: "仅资助育人岗位可生成育人成效报告。" } as const; if (!isModelConfigured()) return { success: false, code: "MODEL_NOT_CONFIGURED", message: "模型网关未配置。" } as const;
 const aggregate = store.indicators; const projects = store.projects.map(item => ({ name: item.name, completionRate: item.completionRate, growthGain: item.growthGain, roi: item.roi }));
 try { const completion = await completeWithDeepSeek([{ role: "system", content: "你是高校资助育人成效分析助手。只能依据传入的脱敏汇总指标生成专业、审慎、可解释的中文报告；不得推断个人身份，不得虚构政策或数据。输出包括：总体结论、项目对比、风险提示、下阶段行动建议，并明确AI内容需人工复核。" }, { role: "user", content: `汇总指标：${JSON.stringify(aggregate)}\n项目效果：${JSON.stringify(projects)}` }], { temperature: 0.2, maxTokens: 900 }); const report: AffairsReport = { id: `report-${Date.now()}`, title: "2026年度资助育人成效AI分析草稿", content: completion.content, model: completion.model, generatedAt: new Date().toISOString(), aggregateOnly: true }; store.reports.unshift(report); writeAuditSnapshot({ taskId: report.id, actorId: actor.userId, actorRole: actor.role, action: "student_affairs:generate_report", outcome: "success", evidenceSummary: `基于脱敏汇总数据调用 ${completion.model} 生成报告草稿，未包含个人敏感字段。` }); return { success: true, code: "REPORT_GENERATED", message: "AI报告草稿已生成，需人工复核后使用。", report } as const; } catch { return { success: false, code: "MODEL_FAILED", message: "模型调用失败，未生成或保存报告。" } as const; }
}
