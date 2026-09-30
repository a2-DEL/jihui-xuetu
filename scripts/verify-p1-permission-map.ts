import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BUSINESS_INTENTS, BUSINESS_INTENT_CATALOG, type BusinessUnderstanding } from '../src/lib/ai/business-intent';
import { INTENT_PERMISSION_MATRIX } from '../src/lib/ai/intent-engine';
import { CHAT_READ_FUNCTIONS, dispatchChatRead } from '../src/lib/ai/chat-function-tools';
import { preflightReadTool, verifyReadResultScope, TOOL_REGISTRY } from '../src/lib/ai/tools';
import { DIMENSION_CODES, evaluateAgentReadQuery, defaultRuntime } from '../src/lib/platform/nine-dimension-engine';
import { DEMO_IDENTITIES, toActorContext } from '../src/lib/platform/demo-identities';
import { ROLE_CODES, ROLE_PROFILES } from '../src/lib/platform/roles';
import { createAndDispatch } from '../src/lib/ai/orchestrator';
import { searchPublicKnowledge } from '../src/lib/ai/knowledge-store';
if (existsSync(join(process.cwd(),'package.json'))) throw new Error('ISOLATED_RUNTIME_REQUIRED');
process.env.MODEL_EXTERNAL_CALLS_ENABLED='false';
const student=toActorContext(DEMO_IDENTITIES.find(item=>item.role==='STUDENT')!);
const counselor=toActorContext(DEMO_IDENTITIES.find(item=>item.role==='COUNSELOR')!);
async function main() {
  assert.equal(BUSINESS_INTENTS.length,14);assert.equal(Object.keys(INTENT_PERMISSION_MATRIX).length,14);
  assert.equal(CHAT_READ_FUNCTIONS.length,5);
  for(const intent of BUSINESS_INTENTS){
    const m=INTENT_PERMISSION_MATRIX[intent],catalog=BUSINESS_INTENT_CATALOG[intent];
    assert(m && m.riskLevel===catalog.riskLevel,intent);
    assert.deepEqual(m.dimensions,DIMENSION_CODES,intent);
    if(m.automatic){assert(m.tool && TOOL_REGISTRY[m.tool].riskLevel===m.riskLevel,intent);assert(['policy_consult','material_requirements'].includes(intent));}
    if(m.scopeByRole) for(const role of m.roles) assert.equal(m.scopeByRole[role],ROLE_PROFILES[role].dataScope);
  }
  assert.equal(ROLE_CODES.length,17);assert.equal(DEMO_IDENTITIES.length,17);
  const allowed:string[]=[];
  for(const identity of DEMO_IDENTITIES){const actor=toActorContext(identity);if(preflightReadTool('policy_qa',actor,`policy-${actor.role}`))allowed.push(actor.role);}
  assert.equal(allowed.length,13);
  assert.deepEqual(ROLE_CODES.filter(role=>!allowed.includes(role)), ['BANK','AUDIT_EXTERNAL','AUDITOR','DISCIPLINE']);
  assert.deepEqual(INTENT_PERMISSION_MATRIX.policy_consult.roles,allowed);
  assert.equal(preflightReadTool('query_pending_applications',counselor,'pending-l1'),false);
  assert.equal(preflightReadTool('query_aid_progress',student,'student-tool-l0'),true);
  const pending:BusinessUnderstanding={intent:'pending_tasks',confidence:.99,status:'ready',riskLevel:'L1',resolvedQuery:'我的待办',source:'model',tokens:0};
  assert.equal(await dispatchChatRead(pending,counselor,[],'no-model-call'),null);
  assert.equal(INTENT_PERMISSION_MATRIX.application_progress.automatic,false);
  assert.equal(INTENT_PERMISSION_MATRIX.quota_amount.automatic,false);
  const oldProgress=await createAndDispatch('我的申请进度',student);
  assert.equal(oldProgress.execution?.success,false);assert.equal(oldProgress.execution?.result.code,'READ_POLICY_NOT_APPROVED');
  const oldReport=await createAndDispatch('生成资助月报草稿',counselor);
  assert.equal(oldReport.execution?.result.code,'AGGREGATION_MANUAL_ONLY');
  assert(searchPublicKnowledge(student,'临时困难补助').hits.every(hit=>hit.documentId==='kb-policy-national'));
  assert.equal(verifyReadResultScope('query_aid_progress',student,{success:true,message:'',evidenceSummary:'',result:{applications:[{id:'app-foreign'}]}},'进度'),false);
  assert.equal(verifyReadResultScope('query_aid_projects',student,{success:true,message:'',evidenceSummary:'',result:{projects:[{code:'secret-internal'}]}},'项目'),false);
  assert.equal(verifyReadResultScope('policy_qa',student,{success:true,message:'',evidenceSummary:'',result:{citations:[{documentId:'kb-emergency',citation:'学生临时困难补助管理办法 · V1.3-draft'}]}},'临时困难补助'),false);
  assert.throws(()=>evaluateAgentReadQuery(student,{permission:'assistant:use',operation:'CREATE',actorType:'agent',aiRiskLevel:'L0',resource:{id:'x',type:'x',dataTags:['PUBLIC'],sensitiveLevel:'P0'},runtime:defaultRuntime()}),/READ_ONLY_REQUIRED/);
  console.log(JSON.stringify({intents:14,roles:17,autoIntents:BUSINESS_INTENTS.filter(intent=>INTENT_PERMISSION_MATRIX[intent].automatic),policyRolesAllowed:allowed.length,l1Pending:'requires-approval',legacyProgress:'blocked',legacyAggregation:'blocked',draftPolicy:'not-public',selfProgressIntent:'risk-mismatch-closed',crossScopeResult:'blocked',nineDimensionCore:'unchanged'}));
}
main().catch(error=>{console.error(error);process.exitCode=1});

