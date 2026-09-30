import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { DEMO_IDENTITIES, toActorContext } from '../src/lib/platform/demo-identities';
import { understandBusinessIntent } from '../src/lib/ai/business-intent';
import { POST as chat } from '../src/app/api/ai/chat/route';
import { conversationRepository } from '../src/lib/ai/conversation-memory-store';
if (existsSync(join(process.cwd(),'package.json'))) throw new Error('ISOLATED_RUNTIME_REQUIRED');
const actor = toActorContext(DEMO_IDENTITIES.find(item => item.role === 'STUDENT')!);
const previous = Object.fromEntries(['MODEL_EXTERNAL_CALLS_ENABLED','DEEPSEEK_API_KEY','DEEPSEEK_BASE_URL','AI_GLOBAL_QPS'].map(key => [key,process.env[key]]));
const original = globalThis.fetch;
const calls:string[]=[];
function response(content:string, tool?:string) { return new Response(JSON.stringify({choices:[{message:tool ? {content:'',tool_calls:[{id:'call-demo',type:'function',function:{name:tool,arguments:'{}'}}]} : {content}}],usage:{prompt_tokens:6,completion_tokens:4,total_tokens:10}})); }
async function main() {
  process.env.MODEL_EXTERNAL_CALLS_ENABLED='true';process.env.DEEPSEEK_API_KEY='test-only-placeholder';
  process.env.DEEPSEEK_BASE_URL='https://no-network.invalid';process.env.AI_GLOBAL_QPS='100';
  let maliciousTool=false;
  globalThis.fetch = async (_url,options) => {
    const body=JSON.parse(String(options?.body)) as {messages:Array<{content:string}>;tools?:Array<{function:{name:string}}>};
    const system=body.messages[0]?.content??'';
    if (system.includes('受控语义分类器')) return response(JSON.stringify({kind: (/申请进度|待办/.test(body.messages.at(-1)?.content??'')) ? 'business_query' : 'policy', riskLevel:'L0',resolvedQuery:body.messages.at(-1)?.content??''}));
    if (system.includes('校园资助业务受控意图解析器')) return response(JSON.stringify({intent:body.messages.at(-1)?.content.includes('待办') ? 'pending_tasks' : 'application_progress',confidence:.99,resolvedQuery:body.messages.at(-1)?.content.includes('待办') ? '我的待办任务' : '我的申请进度'}));
    if (body.tools) { const tool=body.tools[0]?.function.name??'';calls.push(tool);return response('',maliciousTool ? 'submit_approval' : tool); }
    return response('依据当前授权政策，请以正式通知为准。[1]');
  };
  try {
    const ambiguous=await understandBusinessIntent('它需要什么材料',[
      {role:'user',content:'国家助学金和国家奖学金有什么区别？'},
    ],actor);
    assert.equal(ambiguous.status,'clarify');assert.equal(ambiguous.candidates?.length,2);
    const ambiguousId=await understandBusinessIntent('上次那个怎么处理', [{role:'user',content:'我看过 app-2026-001 和 app-2026-002 两个申请'}], actor);
    assert.equal(ambiguousId.status,'clarify');assert.equal(ambiguousId.candidates?.length,2);
    const risky=await understandBusinessIntent('终审通过 app-2026-001',[],actor);
    assert.equal(risky.status,'unsupported');assert.equal(risky.riskLevel,'L5');
    const missing=await understandBusinessIntent('把张三的申请退回',[],actor);
    assert.notEqual(missing.status,'ready');assert.equal(missing.applicationId,undefined);
    const high=await chat(new NextRequest('http://localhost/api/ai/chat',{method:'POST',headers:{authorization:`Bearer ${actor.userId}`,'content-type':'application/json'},body:JSON.stringify({message:'批量通过申请并发钱'})}));
    const deniedText=await high.text();assert(deniedText.includes('高风险'));assert.equal(calls.length,0);
    const policy=await chat(new NextRequest('http://localhost/api/ai/chat',{method:'POST',headers:{authorization:`Bearer ${actor.userId}`,'content-type':'application/json'},body:JSON.stringify({message:'国家助学金政策是什么？'})}));
    const policyText=await policy.text();assert(policyText.includes('政策') && !policyText.includes('"error"'));
    assert(calls.includes('policy_qa'));
    maliciousTool=true;
    const forgedTool=await chat(new NextRequest('http://localhost/api/ai/chat',{method:'POST',headers:{authorization:`Bearer ${actor.userId}`,'content-type':'application/json'},body:JSON.stringify({message:'国家助学金政策是什么？'})}));
    const forgedText=await forgedTool.text();assert(!forgedText.includes('\"toolSuccess\":true'));assert(!forgedText.includes('app-2026-001'));
    maliciousTool=false;
    const progress=await chat(new NextRequest('http://localhost/api/ai/chat',{method:'POST',headers:{authorization:`Bearer ${actor.userId}`,'content-type':'application/json'},body:JSON.stringify({message:'我的申请进度'})}));
    const progressText=await progress.text();assert(!calls.includes('query_aid_progress'));
    assert(!progressText.includes('\"toolSuccess\":true'));assert(progressText.includes('未读取业务明细'));
    const counselor=DEMO_IDENTITIES.find(item=>item.role==='COUNSELOR')!;
    const pending=await chat(new NextRequest('http://localhost/api/ai/chat',{method:'POST',headers:{authorization:`Bearer ${counselor.id}`,'content-type':'application/json'},body:JSON.stringify({message:'我的待办任务'})}));
    const pendingText=await pending.text();assert(!calls.includes('query_pending_applications'));
    assert(!pendingText.includes('\"toolSuccess\":true'));assert(pendingText.includes('未读取业务明细'));
    const bank=DEMO_IDENTITIES.find(item=>item.role==='BANK')!;
    const bankPolicy=await chat(new NextRequest('http://localhost/api/ai/chat',{method:'POST',headers:{authorization:`Bearer ${bank.id}`,'content-type':'application/json'},body:JSON.stringify({message:'国家助学金政策是什么？'})}));
    const bankText=await bankPolicy.text();assert(bankText.includes('暂无权限查看'));
    const id=JSON.parse(policyText.split('\n\n').find(part=>part.startsWith('data: ') && part.includes('conversationId'))!.slice(6)).conversationId as string;
    const stored=await conversationRepository().get(actor,id);
    assert(stored?.messages.some(item=>item.role==='tool' && item.toolName==='policy_qa'));
    assert(!stored?.messages.some(item=>item.content.includes('银行卡号：6217')));
    console.log(JSON.stringify({ambiguous:'two-projects-clarified',untrustedId:'rejected',ambiguousId:'clarified',highRiskUnderstanding:'L5-denied',highRisk:'denied',policyFunction:'called',unregisteredModelTool:'rejected',l1Read:'blocked-by-existing-nine-dimension-policy',bankPublic:'assigned-scope-denied',toolMessage:'persisted',externalNetworkCalls:0}));
  } finally {globalThis.fetch=original;for(const [key,value] of Object.entries(previous)) if(value===undefined) Reflect.deleteProperty(process.env,key); else Reflect.set(process.env,key,value);}
}
main().catch(error=>{console.error(error);process.exitCode=1});




