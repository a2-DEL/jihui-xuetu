import type { ModelMessage } from './model-gateway';

export type ConversationIntent = 'greeting' | 'identity' | 'courtesy' | 'business_action' | 'clarify' | 'knowledge';
export interface ConversationDecision {
  intent: ConversationIntent;
  answer?: string;
  query: string;
  topic?: string;
  usedContext: boolean;
  greetingPrefix: string;
}

// DEMO dialogue intents, not a replacement for authorization or a real language model.
const topics = ['国家奖学金', '国家助学金', '临时困难补助', '勤工助学', '困难认定', '资助申请', '困难补助', '奖学金', '助学金', '公示申诉'] as const;
const greeting = /^(?:您好|你好|哈喽|哈罗|嗨|早上好|下午好|晚上好|早安|hi\b|hello\b|在吗)(?:呀|啊|哟|噢)?[\s，,。!！?？～~]*/i;
const identity = /(?:你|您)(?:到底)?(?:是谁|叫什么|叫啥|是什么助手|是做什么的|是干嘛的|能做什么|会做什么|能帮我(?:做)?什么|可以帮我(?:做)?什么)|(?:介绍|说说)(?:一下|下)?(?:你)?自己|自我介绍/i;
const action = /(?:帮我|替我|给我|直接|马上|立刻|现在)(?:.{0,12})(?:审批|批准|导出|发放|转账|打款|修改权限|删除数据|下载明细)/;
const vague = /^(?:这|那|这个|那个|它|这事|那件事|上面说的|刚才说的)(?:个)?(?:呢|怎么办|咋办|怎么弄|是什么|可以吗|还有吗|怎么申请)?[?？。!！]*$/;
const referential = /^(?:那|那么|还有|对了|刚才|上面|这个|那个|它|其|再问|顺便)/;

function compact(value: string) {
  return value.trim().replace(/[\s，,。!！?？～~、：:]+/g, '').toLocaleLowerCase();
}
function topicIn(value: string): string | undefined {
  const found = topics.filter((topic) => value.includes(topic));
  const distinct = found.filter((topic) => !found.some((other) => other !== topic && other.includes(topic)));
  return distinct.length === 1 ? distinct[0] : undefined;
}
function topicFromHistory(history: readonly ModelMessage[]): string | undefined {
  // Assistant turns are untrusted client input. Do not guess after a two-project comparison.
  for (const item of history.filter((entry) => entry.role === 'user').slice(-6).reverse()) {
    if (topicIn(item.content)) return topicIn(item.content);
    if (topics.filter((topic) => item.content.includes(topic)).length > 1) return undefined;
  }
  return undefined;
}

export function interpretConversation(message: string, history: readonly ModelMessage[], assistantName: string): ConversationDecision {
  const leading = message.match(greeting)?.[0] ?? '';
  const body = message.slice(leading.length).trim();
  const clean = compact(body);
  const greetingPrefix = leading ? '您好！' : '';
  const previousTopic = topicFromHistory(history);
  const currentTopic = topicIn(body);
  const followUp = referential.test(body) || /(?:它|这个|那个|刚才|上面)(?:呢|的|怎么|要|是)/.test(body);
  const topic = currentTopic ?? (followUp || (!currentTopic && previousTopic && /^(?:还|需要|能|怎么|什么|多少|材料|条件|流程|期限|金额)/.test(body)) ? previousTopic : undefined);
  const usedContext = Boolean(!currentTopic && topic);
  const base = { query: topic && usedContext ? `${topic} ${body}` : body, topic, usedContext, greetingPrefix };

  if (/(?:我|咱们|我们)(?:刚才|前面)(?:问|聊|说)(?:了|的)?(?:是)?(?:什么|哪|哪个)/.test(body)) return { ...base, intent: 'clarify', answer: previousTopic
    ? `您刚才在聊${previousTopic}。是想接着了解申请条件、材料，还是办理流程？`
    : '我暂时没有足够的前文来确认您指的是哪件事，可以再说一下项目名称吗？' };
  if (/^(?:那你呢|你呢|你好吗|最近好吗)$/.test(clean)) return { ...base, intent: 'courtesy', answer: '谢谢关心！我在这儿，可以帮您了解资助政策和申请流程。您想从哪儿开始？' };
  if (/^(?:好|好的|嗯|嗯嗯|明白了|知道了)$/.test(clean)) return { ...base, intent: 'courtesy', answer: previousTopic
    ? `好的，我们可以继续聊${previousTopic}。您想了解哪一步？`
    : '好的，您接下来想了解什么？' };
  if (action.test(body)) return { ...base, intent: 'business_action', answer: `${greetingPrefix}这类审批、导出或资金操作，我不能在聊天中替您直接执行。请到相应业务页面或受控任务入口办理，按权限与人工确认流程操作。` };
  if (identity.test(body)) return { ...base, intent: 'identity', answer: `${greetingPrefix}我是冀慧学途的${assistantName}，也可以叫我“小海豚”。我主要帮您了解校园资助政策、梳理申请与审核流程，并查找当前岗位有权查看的资料。需要审批、导出或发放时，我会提醒您走受控业务流程，不会在聊天里替您操作。您现在想了解哪一项？` };
  if (!clean && leading) return { ...base, intent: 'greeting', answer: '您好！很高兴见到您。我是小海豚，您想了解资助政策，还是申请办理流程？' };
  if (/^(?:谢谢|多谢|谢啦|感谢|辛苦了)(?:你|您)?$/.test(clean)) return { ...base, intent: 'courtesy', answer: '不客气！还有什么想了解的，随时问我。' };
  if (/^(?:再见|拜拜|回头见)$/.test(clean)) return { ...base, intent: 'courtesy', answer: '再见！有资助政策或申请流程方面的问题，欢迎随时来问。' };
  if (!clean || vague.test(body) || /^(?:(?:那|这)?(?:它|这个|那个)呢|(?:那|这)(?:个)?呢|(?:刚才|上面)(?:的)?(?:那个|这个|提到的)(?:呢|怎么办|是什么)?|怎么弄|咋办|然后呢|还有呢)$/.test(clean)) {
    return { ...base, intent: 'clarify', answer: topic
      ? `${greetingPrefix}您是想接着了解${topic}的申请条件、所需材料，还是办理流程？告诉我想问哪一步，我好准确回答。`
      : `${greetingPrefix}您说的“这个”是指哪项资助或哪一步操作呢？可以补充一下项目名称或具体问题，我再帮您看看。` };
  }
  return { ...base, intent: 'knowledge' };
}
