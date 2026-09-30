import { type AiRiskLevel } from '@/lib/platform/authorization';

export type ToolName =
  | 'policy_qa'
  | 'query_aid_progress'
  | 'query_pending_applications'
  | 'query_application_detail'
  | 'query_aid_projects'
  | 'query_application_detail'
  | 'query_aid_projects'
  | 'draft_monthly_report'
  | 'draft_review_batch'
  | 'create_overdue_reminders'
  | 'submit_approval'
  | 'export_sensitive_data';

export type IntentType = 'policy_qa' | 'progress_query' | 'pending_query' | 'report_draft' | 'review_draft' | 'reminder' | 'approval' | 'export';
export type AgentAction = 'thinking' | 'executing' | 'communicating' | 'complete';

export interface AgentStep {
  id: string;
  agent: string;
  agentAvatar: string;
  action: AgentAction;
  title: string;
  detail: string;
  result?: string;
}

export interface CommandPlan {
  taskId: string;
  intent: IntentType;
  tool: ToolName;
  riskLevel: AiRiskLevel;
  confidence: number;
  summary: string;
  evidenceSummary: string;
  source: 'model' | 'deterministic-fallback';
  safetyBlocked: boolean;
  createdAt: string;
}

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  result: Record<string, unknown>;
  evidenceSummary: string;
}

export interface PreparedTask {
  plan: CommandPlan;
  actorId: string;
  actorRole: string;
  messageDigest: string;
  executedAt?: string;
}
