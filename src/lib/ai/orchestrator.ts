import { completeWithDeepSeek, isModelConfigured } from "./model-gateway";
import { executeTool, preflightReadTool, TOOL_REGISTRY } from "./tools";
import { INTENT_PERMISSION_MATRIX, classifyConversation } from "./intent-engine";
import { higherRisk } from "./safety-intent";
import type { AgentStep, CommandPlan, IntentType, ToolExecutionResult, ToolName } from "./types";
import { claimPreparedTask, finishPreparedTask, readPreparedTask, rememberPreparedTask } from "./prepared-task-store";
import { randomUUID } from "node:crypto";
import type { ActorContext } from "@/lib/platform/authorization";
import { evaluateAiAction } from "@/lib/platform/authorization";
import { writeAuditSnapshot } from "@/lib/platform/demo-store";
import { ROLE_PROFILES } from "@/lib/platform/roles";

interface ClassifierOutput{intent?:IntentType;tool?:ToolName;confidence?:number;summary?:string}
const suspiciousFragments=["ignore previous","ignore all instructions","system prompt","developer message","jailbreak","越过权限","绕过权限","忽略之前","泄露密钥","显示系统提示词","导出全部身份证","disable guardrail","关闭护栏"];
const intents:IntentType[]=["policy_qa","progress_query","pending_query","report_draft","review_draft","reminder","approval","export"];
function createTaskId(){return`agent-task-${randomUUID()}`}
function isToolName(value:unknown):value is ToolName{return typeof value==="string"&&Object.prototype.hasOwnProperty.call(TOOL_REGISTRY,value)}
function isIntent(value:unknown):value is IntentType{return typeof value==="string"&&intents.includes(value as IntentType)}
const intentTools:Record<IntentType,ToolName>={policy_qa:"policy_qa",progress_query:"query_aid_progress",pending_query:"query_pending_applications",report_draft:"draft_monthly_report",review_draft:"draft_review_batch",reminder:"create_overdue_reminders",approval:"submit_approval",export:"export_sensitive_data"};
function containsPromptInjection(message:string){const normalized=message.toLocaleLowerCase();return suspiciousFragments.some(fragment=>normalized.includes(fragment))}
function planFor(tool:ToolName,intent:IntentType,confidence:number,source:"model"|"deterministic-fallback",summary?:string):Omit<CommandPlan,"taskId"|"createdAt"|"safetyBlocked">{const definition=TOOL_REGISTRY[tool];return{intent,tool,riskLevel:definition.riskLevel,confidence,summary:summary??`已识别为“${definition.label}”请求。`,evidenceSummary:source==="model"?"模型仅在预注册工具集合中完成意图分类，未接触业务明细，也未执行工具。":"确定性意图规则命中预注册工具；未调用模型，未读取业务数据。",source}}
function deterministicClassification(message:string,actor:ActorContext){const normalized=message.toLocaleLowerCase();
 if(["导出","下载明细","身份证","银行卡明细"].some(term=>normalized.includes(term)))return planFor("export_sensitive_data","export",.98,"deterministic-fallback");
 if(["通过审批","驳回申请","提交审批","审批决定"].some(term=>normalized.includes(term)))return planFor("submit_approval","approval",.98,"deterministic-fallback");
 if(["催办","提醒超时","发送提醒"].some(term=>normalized.includes(term)))return planFor("create_overdue_reminders","reminder",.97,"deterministic-fallback");
 if(["审核建议","材料预检","批量审核","待审核分析"].some(term=>normalized.includes(term)))return planFor("draft_review_batch","review_draft",.96,"deterministic-fallback");
 if(["月报","报表草稿","统计报告","汇总报告"].some(term=>normalized.includes(term)))return planFor("draft_monthly_report","report_draft",.96,"deterministic-fallback");
 if(["我的申请","资助进度","申请进度"].some(term=>normalized.includes(term))&&actor.role==="STUDENT")return planFor("query_aid_progress","progress_query",.98,"deterministic-fallback");
 if(["待办","待审核申请","待审批申请","查询待审批","查询申请","申请列表"].some(term=>normalized.includes(term)))return planFor("query_pending_applications","pending_query",.95,"deterministic-fallback");
 if(["政策","条件","标准","流程","公示","困难认定","助学金","奖学金"].some(term=>normalized.includes(term)))return planFor("policy_qa","policy_qa",.92,"deterministic-fallback");
 return null}
async function modelClassification(message:string,actor:ActorContext){if(!isModelConfigured())return null;const profile=ROLE_PROFILES[actor.role],tools=Object.values(TOOL_REGISTRY).map(tool=>({tool:tool.name,label:tool.label,description:tool.description}));try{const response=await completeWithDeepSeek([{role:"system",content:`你是冀慧学途的受控意图网关。当前岗位是“${profile.name}”。只能从候选工具中选择一个，且只返回 JSON：{\"intent\":\"...\",\"tool\":\"...\",\"confidence\":0到1,\"summary\":\"不超过60字\"}。不得执行工具、生成 SQL/Shell、要求密钥或建议绕过权限。候选：${JSON.stringify(tools)}`},{role:"user",content:message}],{temperature:0,maxTokens:180,responseFormat:"json"});const parsed=JSON.parse(response.content) as ClassifierOutput;if(!isToolName(parsed.tool)||!isIntent(parsed.intent)||intentTools[parsed.intent]!==parsed.tool)return null;return planFor(parsed.tool,parsed.intent,typeof parsed.confidence==="number"&&parsed.confidence>=0&&parsed.confidence<=1?parsed.confidence:.7,"model")}catch{return null}}

export async function prepareCommand(message:string,actor:ActorContext):Promise<CommandPlan>{
 if(process.env.NODE_ENV==='production')throw new Error('AGENT_RUNTIME_UNAVAILABLE');
 const taskId=createTaskId();
 const semantic=await classifyConversation(message,[],actor,ROLE_PROFILES[actor.role].assistantName);
 const candidate=deterministicClassification(message,actor)??(semantic.kind==='unknown'||semantic.kind==='ambiguous'?null:await modelClassification(message,actor));
 const risk=higherRisk(semantic.riskLevel,candidate?.riskLevel??'L0');
 const highRisk=Number(risk.slice(1))>=4||containsPromptInjection(message);
 const unclear=semantic.kind==='unknown'||semantic.kind==='ambiguous'||!candidate||
   (semantic.kind!=='policy'&&semantic.kind!=='business_query'&&semantic.kind!=='business_action');
 const safetyBlocked=highRisk||unclear;
 const base=candidate??planFor('policy_qa','policy_qa',0,'deterministic-fallback');
 const summary=highRisk?'该操作属于高风险业务，请前往对应业务页面由授权人员人工办理；智能任务未执行。'
   : semantic.kind==='business_action'&&!candidate?'当前对话不支持该写操作，请到对应业务页面按人工闸门办理；未执行。'
   : unclear?(semantic.clarification??'我没能明确识别您的指令。请说明具体资助业务和对象；不会按政策问答猜测执行。'):base.summary;
 const plan:CommandPlan={taskId,...base,riskLevel:highRisk?(Number(risk.slice(1))<4?'L5':risk):semantic.kind==='unknown'?'L2':risk,
   confidence:safetyBlocked?0:base.confidence,summary,
   evidenceSummary:safetyBlocked?'安全或歧义规则阻断；未调用业务工具，未读取业务数据。':base.evidenceSummary,
   safetyBlocked,createdAt:new Date().toISOString()};
 writeAuditSnapshot({taskId,actorId:actor.userId,actorRole:actor.role,action:'intent_plan',outcome:safetyBlocked?'blocked':'prepared',evidenceSummary:plan.evidenceSummary});
 rememberPreparedTask(plan,actor,message);
 return plan;
}
export function getPlanSteps(plan:CommandPlan):AgentStep[]{
 if(plan.safetyBlocked)return[{id:`${plan.taskId}-intent`,agent:'小海豚总调度',agentAvatar:'🐬',action:'thinking',title:'识别请求风险',detail:plan.summary},{id:`${plan.taskId}-guardrail`,agent:'安全护栏',agentAvatar:'🛡️',action:'executing',title:'阻断不明确或高风险指令',detail:'未调度工具，未读取业务数据。'}];
 const definition=TOOL_REGISTRY[plan.tool];return[{id:`${plan.taskId}-intent`,agent:"小海豚总调度",agentAvatar:"🐬",action:"thinking",title:"识别任务意图",detail:plan.summary,result:`置信度 ${(plan.confidence*100).toFixed(0)}%`},{id:`${plan.taskId}-guardrail`,agent:"安全护栏",agentAvatar:"🛡️",action:"executing",title:"执行身份、权限、数据范围和风险校验",detail:plan.safetyBlocked?"安全或歧义审查已阻断，不执行任何工具。":`预注册工具：${definition.label}；风险等级：${plan.riskLevel}`},{id:`${plan.taskId}-agent`,agent:definition.agent,agentAvatar:definition.agentAvatar,action:"communicating",title:"分派受控任务",detail:"工具只能通过注册表调用；模型不能直接操作数据库、文件、Shell 或审批状态。"}]}
export interface CommandDispatchResult{plan:CommandPlan;steps:AgentStep[];execution?:ToolExecutionResult;confirmationRequired:boolean;confirmationText?:string}
export async function dispatchPreparedCommand(taskId:string,actor:ActorContext,confirmed=false,message=""):Promise<CommandDispatchResult>{
 const prepared=readPreparedTask(taskId,actor),{plan}=prepared;
 const steps=getPlanSteps(plan);
 if(plan.safetyBlocked)return{plan,steps,execution:{success:false,message:plan.summary,result:{code:Number(plan.riskLevel.slice(1))>=4?"HIGH_RISK_BLOCKED":plan.riskLevel==="L3"?"MANUAL_BUSINESS_ONLY":"INTENT_UNCLEAR"},evidenceSummary:plan.evidenceSummary},confirmationRequired:false};
 const requiresConfirmation=plan.riskLevel==="L1"||plan.riskLevel==="L3"||plan.riskLevel==="L4"||plan.riskLevel==="L5";
 if(confirmed&&!requiresConfirmation)throw new Error("TASK_CONFIRMATION_NOT_REQUIRED");
 // Confirmation must never execute a tool whose raw command was not retained.
 if(confirmed&&!["query_pending_applications","create_overdue_reminders","submit_approval","export_sensitive_data"].includes(plan.tool))throw new Error("TASK_CONFIRMATION_UNSUPPORTED");
 const guardrail=evaluateAiAction(actor,"assistant:use",plan.riskLevel,{userConfirmed:confirmed});
 if(!guardrail.allowed&&guardrail.code==="CONFIRMATION_REQUIRED")return{plan,steps,confirmationRequired:true,confirmationText:`“${TOOL_REGISTRY[plan.tool].label}”将执行 ${plan.riskLevel} 级操作。请核对对象和影响范围后人工确认；确认记录会写入审计日志。`};
 // Legacy command entry cannot bypass the P1 intent mapping or nine-dimension read policy.
 const readIntent = ({policy_qa:'policy_consult',query_aid_progress:'application_progress',
   query_pending_applications:'pending_tasks',query_application_detail:'application_progress',
   query_aid_projects:'quota_amount'} as Partial<Record<ToolName,keyof typeof INTENT_PERMISSION_MATRIX>>)[plan.tool];
 if (readIntent) {
   const mapping=INTENT_PERMISSION_MATRIX[readIntent];
   const approved = mapping.tool===plan.tool && mapping.riskLevel===plan.riskLevel &&
     mapping.roles.includes(actor.role) && (mapping.automatic || confirmed) &&
     preflightReadTool(plan.tool,actor,`${taskId}:command-preflight`,confirmed);
   if (!approved) {
     writeAuditSnapshot({taskId,actorId:actor.userId,actorRole:actor.role,action:'ai:command:read_gate',
       category:'AI_OPERATION',outcome:'blocked',evidenceSummary:'现役意图映射或九维只读预校验未通过；未查询业务数据。'});
     return {plan,steps,execution:{success:false,message:'您暂无权限在智能命令中自动查看该数据，请按业务页面授权流程办理。',
       result:{code:'READ_POLICY_NOT_APPROVED'},evidenceSummary:'意图与九维只读口径不一致，未执行。'},confirmationRequired:false};
   }
 }
 if ((plan.tool==='draft_monthly_report'||plan.tool==='draft_review_batch')&&!confirmed) {
   writeAuditSnapshot({taskId,actorId:actor.userId,actorRole:actor.role,action:'ai:command:aggregation_gate',
     category:'AI_OPERATION',outcome:'blocked',evidenceSummary:'敏感聚合草稿禁止智能命令自动执行。'});
   return {plan,steps,execution:{success:false,message:'聚合/审核草稿需要在授权业务页面人工触发，聊天不会自动查询。',
     result:{code:'AGGREGATION_MANUAL_ONLY'},evidenceSummary:'敏感聚合自动调度已阻断。'},confirmationRequired:false};
 }
 claimPreparedTask(taskId,actor);
 // If a tool wrote data but its audit or result failed, the claim stays executing.
 // Never retry an ambiguous write: reconciliation and a new human decision are required.
 const execution=await executeTool(plan.tool,actor,taskId,message,confirmed);
 finishPreparedTask(taskId,actor);
 return{plan,steps,execution,confirmationRequired:false};
}
export async function createAndDispatch(message:string,actor:ActorContext){const plan=await prepareCommand(message,actor);return dispatchPreparedCommand(plan.taskId,actor,false,message)}