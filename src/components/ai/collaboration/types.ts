// Agent 协作可视化类型定义

export type RACIRole = 'R' | 'A' | 'C' | 'I';
export type AgentStatus = 'idle' | 'thinking' | 'working' | 'reviewing' | 'done';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'rejected';
export type CommType = 'sync' | 'async' | 'decision' | 'handover';
export type HandoverStatus = 'pending' | 'accepted' | 'rejected';

export interface Agent {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  status: AgentStatus;
  progress: number;
  quality: number;
  workload: number;
  maxWorkload: number;
  skills: string[];
  raci?: RACIRole;
}

export interface SubTask {
  id: string;
  name: string;
  status: TaskStatus;
  assigneeId: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  deliverables?: string[];
  sla: { promised: number; actual: number };
  progress?: number;
  order?: number;
  raci?: Record<string, RACIRole>;
}

export interface ActionItem {
  agentId: string;
  task: string;
  done: boolean;
}

export interface ReasoningNode {
  premise: string;
  conclusion: string;
}

export interface CommRecord {
  id: string;
  type: CommType;
  title: string;
  participants: string[];
  content: string;
  timestamp: number;
  duration?: number;
  decision?: string;
  reasoning?: ReasoningNode[];
  actionItems?: ActionItem[];
  handover?: {
    from: string;
    to: string;
    deliverables: string[];
    status: HandoverStatus;
    feedback?: string;
  };
}
