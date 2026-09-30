import type { AiRiskLevel } from '@/lib/platform/authorization';
import type { ModelMessage } from './model-gateway';

// DEMO containment: deterministic risk floor, not a production-quality semantic classifier.
// Keep chat and legacy command on the same rules, and never treat a missed rule as policy.
export function localHighRisk(message: string): { riskLevel: 'L4' | 'L5'; reason: string } | null {
  const text = message.replace(/[\s，,。!！?？：:；;、]/g, '').toLocaleLowerCase();
  if (/(?:忽略|无视|越过|绕过|跳过|免除|不要|不用|无需|不经|不经过|关闭|取消|禁用|代签|伪造|替我).{0,16}(?:权限|审核|审批|辅导员|人工确认|人点确认|确认|人工闸门|校验|护栏|验签|风控)|(?:系统提示|systemprompt|ignoreprevious|ignoreallinstructions|jailbreak).{0,24}(?:忽略|权限|限制|previous|instructions)|(?:我是|我就是|假装我是|冒充)(?:系统)?管理员|(?:直接|自动|无需).{0,8}(?:确认|同意|代签)/i.test(text))
    return { riskLevel: 'L5', reason: '绕过权限或人工闸门' };
  if (/(?:导出|下载|拷出|打包|发给我).{0,20}(?:全部|所有|全校|学生|困难材料|申请材料|身份证|银行卡|明细)|(?:全部|所有|全校).{0,16}(?:材料|学生|数据|明细).{0,8}(?:导出|下载|给我)/.test(text))
    return { riskLevel: 'L5', reason: '敏感数据批量导出' };
  if (/(?:直接|马上|立刻|替我|帮我|重复|再|现在|批量).{0,20}(?:支付|打款|把款打给|发钱|拨款|转账|发放|付出去)|(?:银行工具|这笔补助).{0,20}(?:支付|打款|发放|重复)|(?:支付|打款|发钱|拨款|转账).{0,12}(?:出去|学生|补助|一次)/.test(text))
    return { riskLevel: 'L5', reason: '资金操作' };
  if (/(?:直接|马上|立刻|帮我|替我|批量|全部|都|强制).{0,18}(?:通过|批了|批准|审批|终审|认定)|(?:材料|资料).{0,14}(?:缺|少|不全).{0,18}(?:通过|批了|批准)|(?:通过|批准|批了).{0,8}(?:申请|初审|复核|审批)|终审通过/.test(text))
    return { riskLevel: 'L5', reason: '资助资格或审批决定' };
  if (/(?:政策库|知识库|检索).{0,16}(?:没有|没结果|无结果|查不到).{0,20}(?:经验|编|猜|随便)|(?:没有|无).{0,12}(?:政策|依据).{0,12}(?:编|猜|经验)/.test(text))
    return { riskLevel: 'L4', reason: '要求编造政策依据' };
  return null;
}

const knownTopics = ['国家奖学金', '国家助学金', '临时困难补助', '勤工助学', '困难认定'] as const;
export function referentialAmbiguity(message: string, history: readonly ModelMessage[]): string | undefined {
  if (!/(?:它|这个|那个|该项目|上次那个|这笔|这些)/.test(message) && !/^(?:这|那)(?:是|个|项|事)/.test(message)) return undefined;
  const current = knownTopics.filter(topic => message.includes(topic));
  const recent = history.filter(item => item.role === 'user').slice(-10).map(item => item.content);
  const candidates = [...new Set(recent.flatMap(line => knownTopics.filter(topic => line.includes(topic))))];
  if (!current.length && candidates.length > 1) return '您指的是' + candidates.join('，还是') + '？请明确选择后我再继续。';
  const ids = [...new Set(recent.flatMap(line => [...line.matchAll(/\b(?:app|application)-[A-Za-z0-9-]{3,80}\b/gi)].map(match => match[0])))];
  if (!/\b(?:app|application)-[A-Za-z0-9-]{3,80}\b/i.test(message) && ids.length > 1)
    return '您指的是申请 ' + ids.join('，还是') + '？请明确编号后我再继续。';
  if (/(?:这个|那个|该|上次那个)学生/.test(message) && !/\b(?:app|application)-[A-Za-z0-9-]{3,80}\b/i.test(message))
    return '您指的是哪位学生的哪份申请？请到授权页面核对申请编号，我不会猜测学生身份或读取他人数据。';
  if (/^(?:这|那|这个|那个|它).{0,12}(?:什么操作|怎么处理|怎么办|咋办|是什么)/.test(message))
    return '您指的是哪项资助业务或哪一步操作？请补充项目或申请编号，我不会猜测。';
  return undefined;
}

export function higherRisk(a: AiRiskLevel, b: AiRiskLevel): AiRiskLevel {
  return Number(a.slice(1)) >= Number(b.slice(1)) ? a : b;
}
