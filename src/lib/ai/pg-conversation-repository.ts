import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { aiConversations, aiMessages, operationLogs } from '@/storage/database/shared/schema';
import type { ActorContext } from '@/lib/platform/authorization';
import type { ConversationRecord, ConversationRepository, ConversationSnapshot, ExchangeInput, StoredMessage, ChatRole } from './conversation-memory-store';
import { redactConversationText } from './conversation-privacy';

type ConversationRow = typeof aiConversations.$inferSelect;
type MessageRow = typeof aiMessages.$inferSelect;
function asConversation(row: ConversationRow): ConversationRecord {
  return { id: row.id, ownerId: row.user_id, role: row.role_code as ActorContext['role'], title: row.title,
    sceneTag: row.scene_tag, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    messageCount: row.message_count, totalTokens: row.token_total, version: row.version,
    ...(row.summary ? { summary: row.summary } : {}), summaryThrough: row.summary_through,
    ...(row.archived_at ? { archivedAt: row.archived_at.toISOString() } : {}),
    ...(row.deleted_at ? { deletedAt: row.deleted_at.toISOString() } : {}) };
}
function asMessage(row: MessageRow): StoredMessage {
  return { id: row.id, conversationId: row.conversation_id, role: row.role as ChatRole, content: row.content,
    createdAt: row.created_at.toISOString(), tokens: row.tokens_used, ...(row.intent ? { intent: row.intent } : {}),
    ...(row.risk_level ? { riskLevel: row.risk_level as StoredMessage['riskLevel'] } : {}),
    ...(row.tool_name ? { toolName: row.tool_name } : {}),
    ...(row.tool_arguments ? { toolArguments: row.tool_arguments as Record<string, unknown> } : {}),
    sources: Array.isArray(row.sources) ? row.sources.filter((item): item is string => typeof item === 'string') : [] };
}
const scope = (actor: ActorContext) => and(eq(aiConversations.user_id, actor.userId), eq(aiConversations.role_code, actor.role), isNull(aiConversations.deleted_at));
const live = (actor: ActorContext) => and(scope(actor), isNull(aiConversations.archived_at));

/** REVIEW-ONLY adapter: schema, trusted IdP and audit-chain release gates remain closed.
 * Every message mutation and its SQL audit projection share one PostgreSQL transaction;
 * operation_logs is NOT a replacement for the project's global immutable audit chain. */
export class PostgresConversationRepository implements ConversationRepository {
  private pool: Pool;
  private db;
  constructor() {
    if (process.env.NODE_ENV === 'production' || !process.env.DATABASE_URL || process.env.AI_PG_SCHEMA_VERIFIED !== 'true') throw new Error('AI_MEMORY_PG_NOT_VERIFIED');
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, connectionTimeoutMillis: 3_000, idleTimeoutMillis: 5_000 });
    this.db = drizzle(this.pool);
  }
  async close() { await this.pool.end(); }
  private async archive(actor: ActorContext) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.db.transaction(async (tx) => {
      const expired = await tx.select().from(aiConversations)
        .where(and(live(actor), lt(aiConversations.updated_at, cutoff))).for('update');
      for (const row of expired) {
        await tx.update(aiConversations).set({ archived_at: new Date(), version: row.version + 1 }).where(eq(aiConversations.id, row.id));
        await tx.insert(operationLogs).values({ id: randomUUID(), user_id: actor.userId, module: 'ai_conversation', action: 'archive',
          resource_type: 'ai_conversation', resource_id: row.id, description: '超过30天自动归档；不记录消息内容。' });
      }
    });
  }
  async list(actor: ActorContext) {
    await this.archive(actor);
    return (await this.db.select().from(aiConversations).where(live(actor)).orderBy(desc(aiConversations.updated_at))).map(asConversation);
  }
  async get(actor: ActorContext, id: string): Promise<ConversationSnapshot | null> {
    await this.archive(actor);
    const rows = await this.db.select().from(aiConversations).where(and(live(actor), eq(aiConversations.id, id))).limit(1);
    if (!rows[0]) return null;
    const messages = await this.db.select().from(aiMessages).where(eq(aiMessages.conversation_id, id)).orderBy(aiMessages.sequence);
    return { conversation: asConversation(rows[0]), messages: messages.map(asMessage) };
  }
  async create(actor: ActorContext, sceneTag = 'general') {
    if (!actor.authenticated) throw new Error('AI_MEMORY_UNAUTHORIZED');
    const id = randomUUID();
    const row = await this.db.transaction(async (tx) => {
      const [created] = await tx.insert(aiConversations).values({ id, user_id: actor.userId, role_code: actor.role,
        title: '新对话', scene_tag: sceneTag.slice(0, 60) }).returning();
      await tx.insert(operationLogs).values({ id: randomUUID(), user_id: actor.userId, module: 'ai_conversation',
        action: 'create', resource_type: 'ai_conversation', resource_id: id, description: '创建独立对话；未记录用户输入。' });
      return created;
    });
    return asConversation(row);
  }
  async rename(actor: ActorContext, id: string, title: string) {
    const safe = redactConversationText(title.trim()).slice(0, 80);
    if (!safe) throw new Error('AI_MEMORY_TITLE_INVALID');
    const row = await this.db.transaction(async (tx) => {
      const [found] = await tx.select().from(aiConversations).where(and(live(actor), eq(aiConversations.id, id))).limit(1).for('update');
      if (!found) return null;
      const [updated] = await tx.update(aiConversations).set({ title: safe, version: found.version + 1, updated_at: new Date() }).where(eq(aiConversations.id, id)).returning();
      await tx.insert(operationLogs).values({ id: randomUUID(), user_id: actor.userId, module: 'ai_conversation', action: 'rename',
        resource_type: 'ai_conversation', resource_id: id, description: '会话重命名，未记录标题原文。' });
      return updated;
    });
    return row ? asConversation(row) : null;
  }
  async softDelete(actor: ActorContext, id: string) {
    return this.db.transaction(async (tx) => {
      const [found] = await tx.select().from(aiConversations).where(and(scope(actor), eq(aiConversations.id, id))).limit(1).for('update');
      if (!found) return false;
      await tx.update(aiConversations).set({ deleted_at: new Date(), version: found.version + 1 }).where(eq(aiConversations.id, id));
      await tx.insert(operationLogs).values({ id: randomUUID(), user_id: actor.userId, module: 'ai_conversation', action: 'delete',
        resource_type: 'ai_conversation', resource_id: id, description: '用户主动软删除会话。' });
      return true;
    });
  }
  async appendExchange(actor: ActorContext, id: string, version: number, input: ExchangeInput) {
    await this.db.transaction(async (tx) => {
      const [found] = await tx.select().from(aiConversations).where(and(live(actor), eq(aiConversations.id, id))).limit(1).for('update');
      if (!found) throw new Error('AI_MEMORY_NOT_FOUND');
      if (found.version !== version) throw new Error('AI_MEMORY_VERSION_CONFLICT');
      if (found.message_count >= 2_000) throw new Error('AI_MEMORY_LIMIT');
      const user = redactConversationText(input.user), assistant = redactConversationText(input.assistant);
      const userTokens = input.estimatedUserTokens ?? Math.ceil(user.length / 2);
      await tx.insert(aiMessages).values([
        { id: randomUUID(), conversation_id: id, sequence: found.message_count + 1, role: 'user', content: user,
          tokens_used: userTokens, intent: input.intent, risk_level: input.riskLevel },
        ...(input.tool ? [{ id: randomUUID(), conversation_id: id, sequence: found.message_count + 2, role: 'tool',
          content: redactConversationText(JSON.stringify(input.tool.result)).slice(0, 4000), tokens_used:0,
          tool_name:input.tool.name, tool_arguments:input.tool.arguments, intent:input.intent, risk_level:input.riskLevel }] : []),
        { id: randomUUID(), conversation_id: id, sequence: found.message_count + (input.tool ? 3 : 2), role: 'assistant', content: assistant,
          tokens_used: Math.max(0, input.modelTokens), intent: input.intent, risk_level: input.riskLevel,
          sources: (input.sources ?? []).slice(0, 8).map((source) => redactConversationText(source.slice(0, 200))) },
      ]);
      await tx.update(aiConversations).set({ message_count: found.message_count + (input.tool ? 3 : 2), token_total: found.token_total + userTokens + Math.max(0, input.modelTokens),
        title: found.title === '新对话' ? user.replace(/[\r\n]/g, ' ').slice(0, 36) || '新对话' : found.title,
        updated_at: new Date(), version: found.version + 1 }).where(eq(aiConversations.id, id));
      await tx.insert(operationLogs).values({ id: randomUUID(), user_id: actor.userId, module: 'ai_conversation', action: 'exchange',
        resource_type: 'ai_conversation', resource_id: id, description: '当前身份发送并接收已脱敏对话；未记录正文。',
        request_data: { intent: input.intent, risk: input.riskLevel } });
    });
    const result = await this.get(actor, id);
    if (!result) throw new Error('AI_MEMORY_NOT_FOUND');
    return result;
  }
  async updateSummary(actor: ActorContext, id: string, through: number, summary: string, modelTokens = 0) {
    await this.db.transaction(async (tx) => {
      const [found] = await tx.select().from(aiConversations).where(and(live(actor), eq(aiConversations.id, id))).limit(1).for('update');
      if (!found) throw new Error('AI_MEMORY_NOT_FOUND');
      if (through <= found.summary_through || through > found.message_count - 20) return;
      await tx.update(aiConversations).set({ summary: redactConversationText(summary).slice(0, 2000), summary_through: through,
        version: found.version + 1, token_total: found.token_total + Math.max(0, modelTokens) }).where(eq(aiConversations.id, id));
      await tx.insert(operationLogs).values({ id: randomUUID(), user_id: actor.userId, module: 'ai_conversation', action: 'summarize',
        resource_type: 'ai_conversation', resource_id: id, description: '长期历史摘要更新；未记录摘要原文。' });
    });
  }
}
