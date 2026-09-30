import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ActorContext, AiRiskLevel } from '@/lib/platform/authorization';
import { writeAuditSnapshot } from '@/lib/platform/demo-store';
import { redactConversationText } from './conversation-privacy';
import { PostgresConversationRepository } from './pg-conversation-repository';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';
export interface StoredMessage {
  id: string; conversationId: string; role: ChatRole; content: string; createdAt: string;
  tokens: number; intent?: string; riskLevel?: AiRiskLevel; sources?: string[];
  toolName?: string; toolArguments?: Record<string, unknown>;
}
export interface ConversationRecord {
  id: string; ownerId: string; role: ActorContext['role']; title: string; sceneTag: string;
  createdAt: string; updatedAt: string; messageCount: number; totalTokens: number;
  version: number; summary?: string; summaryThrough?: number; archivedAt?: string; deletedAt?: string;
}
export interface ConversationSnapshot { conversation: ConversationRecord; messages: StoredMessage[] }
export interface ExchangeInput {
  user: string; assistant: string; intent: string; riskLevel: AiRiskLevel; modelTokens: number;
  sources?: string[]; estimatedUserTokens?: number;
  tool?: { name: string; arguments: Record<string, string>; result: Record<string, unknown> };
}
export interface ConversationRepository {
  list(actor: ActorContext): Promise<ConversationRecord[]>;
  get(actor: ActorContext, id: string): Promise<ConversationSnapshot | null>;
  create(actor: ActorContext, sceneTag?: string): Promise<ConversationRecord>;
  rename(actor: ActorContext, id: string, title: string): Promise<ConversationRecord | null>;
  softDelete(actor: ActorContext, id: string): Promise<boolean>;
  appendExchange(actor: ActorContext, id: string, version: number, input: ExchangeInput): Promise<ConversationSnapshot>;
  updateSummary(actor: ActorContext, id: string, through: number, summary: string, modelTokens?: number): Promise<void>;
}
interface DiskState { schemaVersion: 1; conversations: ConversationRecord[]; messages: StoredMessage[] }
const file = join(process.cwd(), '.runtime', 'ai-conversations.json');
const lockFile = `${file}.lock`;
const empty = (): DiskState => ({ schemaVersion: 1, conversations: [], messages: [] });
const clone = <T,>(value: T): T => structuredClone(value);
const thirtyDays = 30 * 24 * 60 * 60 * 1000;

function load(): DiskState {
  if (!existsSync(file)) return empty();
  const data: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      (data as DiskState).schemaVersion !== 1 || !Array.isArray((data as DiskState).conversations) || !Array.isArray((data as DiskState).messages))
    throw new Error('AI_MEMORY_STATE_INVALID');
  return data as DiskState;
}
function save(data: DiskState) {
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temp, `${JSON.stringify(data)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  try { renameSync(temp, file); } catch (error) { unlinkSync(temp); throw error; }
}
function locked<T>(work: (data: DiskState) => T): T {
  mkdirSync(dirname(file), { recursive: true });
  let fd: number;
  try { fd = openSync(lockFile, 'wx', 0o600); }
  catch { throw new Error('AI_MEMORY_BUSY'); }
  try { return work(load()); }
  finally { closeSync(fd); unlinkSync(lockFile); }
}
function owned(data: DiskState, actor: ActorContext, id: string) {
  if (!actor.authenticated) return undefined;
  return data.conversations.find((item) => item.id === id && item.ownerId === actor.userId && item.role === actor.role && !item.deletedAt);
}
function audit(actor: ActorContext, id: string, action: string, summary: string) {
  // DEMO ONLY: this JSONL audit and the JSON state file cannot form a DB transaction.
  writeAuditSnapshot({ taskId: id, actorId: actor.userId, actorRole: actor.role, action: `ai:conversation:${action}`,
    outcome: 'success', evidenceSummary: summary, resource: { type: 'ai_conversation', id, campusId: actor.campusIds[0], sensitivity: 'P2' } });
}
function archiveIdle(data: DiskState, actor: ActorContext) {
  const now = Date.now(); let changed = false;
  for (const item of data.conversations) {
    if (item.ownerId === actor.userId && item.role === actor.role && !item.archivedAt && !item.deletedAt && now - Date.parse(item.updatedAt) > thirtyDays) {
      audit(actor, item.id, 'archive', '超过30天未交互，会话已自动归档。');
      item.archivedAt = new Date().toISOString(); changed = true;
    }
  }
  if (changed) save(data);
}
export class DemoConversationRepository implements ConversationRepository {
  private available() { if (process.env.NODE_ENV === 'production') throw new Error('AI_MEMORY_PRODUCTION_UNAVAILABLE'); }
  async list(actor: ActorContext) {
    this.available(); return locked((data) => { archiveIdle(data, actor); return clone(data.conversations.filter((item) => owned(data, actor, item.id) && !item.archivedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); });
  }
  async get(actor: ActorContext, id: string) {
    this.available(); return locked((data) => { archiveIdle(data, actor); const item = owned(data, actor, id);
      return item && !item.archivedAt ? clone({ conversation: item, messages: data.messages.filter((message) => message.conversationId === id) }) : null;
    });
  }
  async create(actor: ActorContext, sceneTag = 'general') {
    this.available(); if (!actor.authenticated) throw new Error('AI_MEMORY_UNAUTHORIZED');
    return locked((data) => {
      archiveIdle(data, actor);
      if (data.conversations.filter((item) => item.ownerId === actor.userId && !item.deletedAt && !item.archivedAt).length >= 100) throw new Error('AI_MEMORY_LIMIT');
      const now = new Date().toISOString(); const item: ConversationRecord = { id: randomUUID(), ownerId: actor.userId, role: actor.role,
        title: '新对话', sceneTag: sceneTag.slice(0, 60), createdAt: now, updatedAt: now, messageCount: 0, totalTokens: 0, version: 1 };
      audit(actor, item.id, 'create', '创建当前身份专属对话；未保存用户原文。');
      data.conversations.push(item); save(data); return clone(item);
    });
  }
  async rename(actor: ActorContext, id: string, title: string) {
    this.available(); return locked((data) => {
      const item = owned(data, actor, id); if (!item || item.archivedAt) return null;
      const next = redactConversationText(title.trim()).slice(0, 80); if (!next) throw new Error('AI_MEMORY_TITLE_INVALID');
      audit(actor, id, 'rename', '对话标题已更新；未记录标题原文。');
      item.title = next; item.updatedAt = new Date().toISOString(); item.version++; save(data); return clone(item);
    });
  }
  async softDelete(actor: ActorContext, id: string) {
    this.available(); return locked((data) => {
      const item = owned(data, actor, id); if (!item) return false;
      audit(actor, id, 'delete', '用户主动软删除会话，业务数据未被改写。');
      item.deletedAt = new Date().toISOString(); item.version++; save(data); return true;
    });
  }
  async appendExchange(actor: ActorContext, id: string, version: number, input: ExchangeInput) {
    this.available(); return locked((data) => {
      archiveIdle(data, actor); const item = owned(data, actor, id);
      if (!item || item.archivedAt) throw new Error('AI_MEMORY_NOT_FOUND');
      if (item.version !== version) throw new Error('AI_MEMORY_VERSION_CONFLICT');
      if (item.messageCount >= 2_000) throw new Error('AI_MEMORY_LIMIT');
      const now = new Date().toISOString();
      const user = redactConversationText(input.user); const assistant = redactConversationText(input.assistant);
      const safeSources = (input.sources ?? []).slice(0, 8).map((source) => redactConversationText(source.slice(0, 200)));
      const userMessage: StoredMessage = { id: randomUUID(), conversationId: id, role: 'user', content: user,
        createdAt: now, tokens: input.estimatedUserTokens ?? Math.ceil(user.length / 2), intent: input.intent, riskLevel: input.riskLevel };
      const assistantMessage: StoredMessage = { id: randomUUID(), conversationId: id, role: 'assistant', content: assistant,
        createdAt: now, tokens: Math.max(0, input.modelTokens), intent: input.intent, riskLevel: input.riskLevel, sources: safeSources };
      const toolMessage: StoredMessage | undefined = input.tool ? { id: randomUUID(), conversationId:id, role:'tool',
        content:redactConversationText(JSON.stringify(input.tool.result)).slice(0, 4000), createdAt:now, tokens:0,
        intent:input.intent, riskLevel:input.riskLevel, toolName:input.tool.name, toolArguments:input.tool.arguments } : undefined;
      audit(actor, id, 'exchange', `对话消息写入；意图 ${input.intent}；风险 ${input.riskLevel}；工具 ${input.tool?.name ?? 'none'}；内容已脱敏。`);
      data.messages.push(userMessage, ...(toolMessage ? [toolMessage] : []), assistantMessage);
      item.messageCount += toolMessage ? 3 : 2; item.totalTokens += userMessage.tokens + assistantMessage.tokens;
      if (item.title === '新对话') item.title = user.replace(/[\r\n]/g, ' ').slice(0, 36) || '新对话';
      item.updatedAt = now; item.version++; save(data);
      return clone({ conversation: item, messages: data.messages.filter((message) => message.conversationId === id) });
    });
  }
  async updateSummary(actor: ActorContext, id: string, through: number, summary: string, modelTokens = 0) {
    this.available(); locked((data) => {
      const item = owned(data, actor, id); if (!item || item.archivedAt) throw new Error('AI_MEMORY_NOT_FOUND');
      if (through <= (item.summaryThrough ?? 0) || through > item.messageCount - 20) return;
      audit(actor, id, 'summarize', `历史摘要已更新至第 ${through} 条；不记录摘要原文。`);
      item.summary = redactConversationText(summary).slice(0, 2000); item.summaryThrough = through;
      item.totalTokens += Math.max(0, modelTokens); item.version++; save(data);
    });
  }
}
type GlobalWithConversationRepo = typeof globalThis & { __jhxtPgConversationRepo?: PostgresConversationRepository };
export function conversationRepository(): ConversationRepository {
  // Production must not fall back to .runtime, even when DATABASE_URL is missing.
  if (process.env.AI_CONVERSATION_STORAGE === 'postgres') {
    if (process.env.NODE_ENV === 'production' || process.env.AI_PG_SCHEMA_VERIFIED !== 'true' || process.env.OIDC_STAGE_A_PREVIEW !== 'true' || !process.env.DATABASE_URL) throw new Error('AI_MEMORY_PG_NOT_VERIFIED');
    const globalRepo = globalThis as GlobalWithConversationRepo;
    globalRepo.__jhxtPgConversationRepo ??= new PostgresConversationRepository();
    return globalRepo.__jhxtPgConversationRepo;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('AI_MEMORY_PRODUCTION_UNAVAILABLE');
  return new DemoConversationRepository();
}
