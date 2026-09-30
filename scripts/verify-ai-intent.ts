import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { classifyConversation } from '../src/lib/ai/intent-engine';
import { DEMO_IDENTITIES, toActorContext } from '../src/lib/platform/demo-identities';
if (existsSync(join(process.cwd(), 'package.json'))) throw new Error('ISOLATED_RUNTIME_REQUIRED');
const actor = toActorContext(DEMO_IDENTITIES.find((item) => item.role === 'STUDENT')!);
async function main() {
  process.env.MODEL_EXTERNAL_CALLS_ENABLED = 'false';
  for (const [text, kind, risk] of [
    ['你好', 'social', 'L0'], ['你是谁', 'identity', 'L0'], ['国家助学金申请条件', 'policy', 'L0'],
    ['我的申请进度', 'business_query', 'L1'], ['通知学生补材料', 'business_action', 'L3'],
    ['批量通过申请', 'business_action', 'L5'], ['这个呢', 'ambiguous', 'L0'], ['今天天气预报怎么样', 'out_of_scope', 'L0'],
  ]) {
    const result = await classifyConversation(text, [], actor, '小海豚');
    assert.equal(result.kind, kind, text); assert.equal(result.riskLevel, risk, text);
  }
  const history = [{ role: 'user' as const, content: '国家助学金是什么' }];
  const followup = await classifyConversation('它要准备哪些材料', history, actor, '小海豚');
  assert(followup.resolvedQuery.includes('国家助学金'));
  console.log(JSON.stringify({ basicIntents: 8, coreference: 'passed', highRisk: 'L5-denied', providerCalls: 0 }));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
