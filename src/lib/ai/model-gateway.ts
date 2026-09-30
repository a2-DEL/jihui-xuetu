import { recordModelUsage } from './governance-store';
import { redactConversationText } from './conversation-privacy';

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  actorId?: string; // server-resolved actor only; never accept from a request body
  tools?: readonly DeepSeekFunctionDefinition[];
  toolChoice?: 'auto' | 'required';
}
export interface DeepSeekFunctionDefinition { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }
export interface DeepSeekFunctionCall { id: string; name: string; arguments: string }
interface DeepSeekResponse {
  choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ id?: string; type?: string; function?: { name?: string; arguments?: string } }> } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}
export interface ModelCompletion {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCost: number | null;
  toolCalls?: DeepSeekFunctionCall[];
}
interface GatewayState { failures: number; openUntil: number; userCalls: Map<string, number[]>; globalCalls: number[] }
type WithGatewayState = typeof globalThis & { __jhxtModelGatewayState?: GatewayState };
const root = globalThis as WithGatewayState;
const state = root.__jhxtModelGatewayState ?? { failures: 0, openUntil: 0, userCalls: new Map<string, number[]>(), globalCalls: [] };
root.__jhxtModelGatewayState = state;
const numberEnv = (name: string, fallback: number, ceiling: number) => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), ceiling) : fallback;
};
function config() {
  // Stage A: presence of a key never activates external requests by itself.
  if (process.env.NODE_ENV === 'production') return null; // Stage A release gate: no production model calls.
  if (process.env.MODEL_EXTERNAL_CALLS_ENABLED !== 'true' || !process.env.DEEPSEEK_API_KEY?.trim()) return null;
  const baseUrl = new URL(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com');
  if (baseUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(baseUrl.hostname)) throw new Error('MODEL_ENDPOINT_INVALID');
  return { apiKey: process.env.DEEPSEEK_API_KEY.trim(), baseUrl: baseUrl.href.replace(/\/$/, ''),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', timeoutMs: numberEnv('AI_REQUEST_TIMEOUT_MS', 30_000, 60_000),
    retries: Math.min(3, Math.max(0, Number.parseInt(process.env.AI_MAX_RETRIES ?? '2', 10) || 0)) };
}
export function isModelConfigured() { return config() !== null; }
function takeRateLimit(actorId?: string) {
  const now = Date.now();
  state.globalCalls = state.globalCalls.filter((at) => now - at < 1_000);
  const maxQps = numberEnv('AI_GLOBAL_QPS', 20, 200);
  if (state.globalCalls.length >= maxQps) throw new Error('MODEL_RATE_LIMITED');
  if (actorId) {
    const calls = (state.userCalls.get(actorId) ?? []).filter((at) => now - at < 60_000);
    if (calls.length >= numberEnv('AI_USER_RPM', 15, 120)) throw new Error('MODEL_RATE_LIMITED');
    calls.push(now); state.userCalls.set(actorId, calls);
  }
  state.globalCalls.push(now);
}
function estimatedCost(usage: ModelCompletion['usage']) {
  const input = Number(process.env.AI_INPUT_COST_PER_MILLION);
  const output = Number(process.env.AI_OUTPUT_COST_PER_MILLION);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input <= 0 || output <= 0) return null;
  return Number(((usage.promptTokens * input + usage.completionTokens * output) / 1_000_000).toFixed(6));
}
function modelError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return 'MODEL_TIMEOUT';
  if (error instanceof Error && /^(MODEL_HTTP_\d+|MODEL_TIMEOUT|MODEL_NETWORK_ERROR|MODEL_INVALID_RESPONSE|MODEL_EMPTY_RESPONSE|MODEL_RESPONSE_TOO_LARGE)$/.test(error.message)) return error.message;
  return 'MODEL_NETWORK_ERROR';
}
export async function completeWithDeepSeek(messages: readonly ModelMessage[], options: CompletionOptions = {}): Promise<ModelCompletion> {
  const settings = config();
  if (!settings) throw new Error('MODEL_NOT_CONFIGURED');
  if (Date.now() < state.openUntil) throw new Error('MODEL_CIRCUIT_OPEN');
  takeRateLimit(options.actorId);
  const redacted = messages.map((item) => ({ role: item.role, content: redactConversationText(item.content) }));
  if (redacted.reduce((size, item) => size + item.content.length, 0) > numberEnv('AI_MAX_INPUT_CHARS', 12_000, 32_000)) throw new Error('MODEL_INPUT_TOO_LONG');
  const startedAt = Date.now();
  let lastCode = 'MODEL_NETWORK_ERROR';
  for (let attempt = 0; attempt <= settings.retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), settings.timeoutMs);
    let retryable = false;
    try {
      const response = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
        body: JSON.stringify({ model: settings.model, messages: redacted, stream: false,
          temperature: options.temperature ?? 0.1, max_tokens: options.maxTokens ?? 700,
          ...(options.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
          ...(options.tools?.length ? { tools: options.tools, tool_choice: options.toolChoice ?? 'auto' } : {}) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        lastCode = `MODEL_HTTP_${response.status}`;
        retryable = response.status === 429 || response.status >= 500;
        if (!retryable) throw new Error(lastCode);
      } else {
        const text = await response.text();
        if (text.length > 1_000_000) throw new Error('MODEL_RESPONSE_TOO_LARGE');
        let payload: DeepSeekResponse;
        try { payload = JSON.parse(text) as DeepSeekResponse; } catch { throw new Error('MODEL_INVALID_RESPONSE'); }
        const message = payload.choices?.[0]?.message;
        const content = message?.content?.trim() ?? '';
        const toolCalls = options.tools?.length ? (message?.tool_calls ?? []).map((call) => ({
          id: call.id ?? '', name: call.function?.name ?? '', arguments: call.function?.arguments ?? '',
        })) : [];
        if (!content && !toolCalls.length) throw new Error('MODEL_EMPTY_RESPONSE');
        if (toolCalls.length > 1 || toolCalls.some((call) => !call.name || call.arguments.length > 4000)) throw new Error('MODEL_INVALID_RESPONSE');
        const usage = { promptTokens: payload.usage?.prompt_tokens ?? 0,
          completionTokens: payload.usage?.completion_tokens ?? 0, totalTokens: payload.usage?.total_tokens ?? 0 };
        recordModelUsage(settings.model, usage, Date.now() - startedAt);
        state.failures = 0; state.openUntil = 0;
        return { content: redactConversationText(content), model: settings.model, usage, estimatedCost: estimatedCost(usage), ...(toolCalls.length ? { toolCalls } : {}) };
      }
    } catch (error) {
      lastCode = modelError(error);
      retryable = lastCode === 'MODEL_TIMEOUT' || lastCode === 'MODEL_NETWORK_ERROR' || /^MODEL_HTTP_(429|5\d\d)$/.test(lastCode);
      if (!retryable) throw new Error(lastCode);
    } finally { clearTimeout(timer); }
    if (!retryable || attempt === settings.retries) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(1_000, numberEnv('AI_RETRY_BASE_MS', 200, 1_000) * 2 ** attempt)));
  }
  state.failures++;
  if (state.failures >= 10) { state.openUntil = Date.now() + 5 * 60_000; state.failures = 0; }
  throw new Error(lastCode);
}
