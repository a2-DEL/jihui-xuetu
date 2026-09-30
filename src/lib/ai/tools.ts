import { completeWithDeepSeek, isModelConfigured } from "./model-gateway";
import { searchPublicKnowledge } from "./knowledge-store";
import type { ToolExecutionResult, ToolName } from "./types";
import type { ActorContext, AiRiskLevel } from "@/lib/platform/authorization";
import { evaluateAiAction } from "@/lib/platform/authorization";
import { buildMonthlyFundingReport, createOverdueReminders, getMyAidProgress, getVisibleApplication, listVisibleApplications, writeAuditSnapshot } from "@/lib/platform/demo-store";
import { listApplicationProjects } from "@/lib/platform/application-intake-store";
import { ROLE_CODES, type RoleCode } from "@/lib/platform/roles";
import { defaultRuntime, evaluateNineDimensionPermission, evaluateAgentReadQuery, type OperationType, type TimePolicy } from "@/lib/platform/nine-dimension-engine";
import { ROLE_GOVERNANCE_POLICIES } from "@/lib/platform/role-context";
import { recordRuntimePermissionDecision } from "@/lib/platform/access-control-store";

export interface ToolDefinition { name:ToolName; label:string; description:string; riskLevel:AiRiskLevel; allowedRoles:readonly RoleCode[]; agent:string; agentAvatar:string }
export const TOOL_REGISTRY:Record<ToolName,ToolDefinition>={
 policy_qa:{name:"policy_qa",label:"政策知识问答",description:"基于权限过滤的 RAG 检索并生成带引用回答",riskLevel:"L0",allowedRoles:ROLE_CODES,agent:"政策知识 Agent",agentAvatar:"📚"},
 query_aid_progress:{name:"query_aid_progress",label:"查询本人资助进度",description:"仅查询当前学生本人的申请进度",riskLevel:"L0",allowedRoles:["STUDENT"],agent:"进度查询 Agent",agentAvatar:"📍"},
 query_pending_applications:{name:"query_pending_applications",label:"查询待办申请",description:"按组织和任务授权范围读取待审核申请",riskLevel:"L1",allowedRoles:["FUND_ADMIN","FUND_LEADER","DEPT_ADMIN","COUNSELOR","AUDITOR","AUDIT_EXTERNAL","EDU_BUREAU"],agent:"申请查询 Agent",agentAvatar:"📋"},
 query_application_detail:{name:"query_application_detail",label:"查询申请详情",description:"按申请编号查询本人或授权范围内的非敏感概要",riskLevel:"L1",allowedRoles:["STUDENT","FUND_ADMIN","DEPT_ADMIN","COUNSELOR"],agent:"申请查询 Agent",agentAvatar:"📋"},
 query_aid_projects:{name:"query_aid_projects",label:"查询资助项目",description:"查询当前校区可申请项目概要（演示目录）",riskLevel:"L0",allowedRoles:ROLE_CODES,agent:"政策知识 Agent",agentAvatar:"📚"},
 draft_monthly_report:{name:"draft_monthly_report",label:"生成资助月报草稿",description:"基于授权聚合数据生成不可自动发布的月报草稿",riskLevel:"L2",allowedRoles:["SCHOOL_LEADER","FUND_LEADER","STU_AFFAIRS","FUND_ADMIN","FINANCE","DEPT_ADMIN","EDU_BUREAU","AUDITOR"],agent:"报表生成 Agent",agentAvatar:"📊"},
 draft_review_batch:{name:"draft_review_batch",label:"生成审核建议草稿",description:"汇总完整度、超时和风险标签，不形成审批结论",riskLevel:"L2",allowedRoles:["FUND_ADMIN","FUND_LEADER","DEPT_ADMIN","COUNSELOR"],agent:"智能评审 Agent 团队",agentAvatar:"🔎"},
 create_overdue_reminders:{name:"create_overdue_reminders",label:"创建超时待办催办",description:"经人工确认后写入站内催办通知",riskLevel:"L3",allowedRoles:["FUND_ADMIN","DEPT_ADMIN","COUNSELOR"],agent:"智能催办 Agent",agentAvatar:"⏰"},
 submit_approval:{name:"submit_approval",label:"提交审批决定",description:"L4 关键决定只能由当前处理人在业务页面操作",riskLevel:"L4",allowedRoles:["FUND_LEADER","FUND_ADMIN","DEPT_ADMIN","COUNSELOR"],agent:"审批协作 Agent",agentAvatar:"🛡️"},
 export_sensitive_data:{name:"export_sensitive_data",label:"导出敏感数据",description:"L5 数据动作需要受控导出和双人审批，AI 不可直执",riskLevel:"L5",allowedRoles:["SYS_ADMIN","AUDITOR","DISCIPLINE"],agent:"安全导出 Agent",agentAvatar:"🔐"},
};
const TOOL_PERMISSION_POLICY:Record<ToolName,{operation:OperationType;sensitiveLevel:"P0"|"P1"|"P2"|"P3";dataTags:readonly string[];timePolicy:TimePolicy;agentIndex:number}>={
 policy_qa:{operation:"READ",sensitiveLevel:"P0",dataTags:["PUBLIC"],timePolicy:"always",agentIndex:0},
 query_aid_progress:{operation:"READ",sensitiveLevel:"P2",dataTags:["APPLICATION"],timePolicy:"always",agentIndex:0},
 query_pending_applications:{operation:"READ",sensitiveLevel:"P2",dataTags:["APPLICATION"],timePolicy:"always",agentIndex:1},
 query_application_detail:{operation:"READ",sensitiveLevel:"P2",dataTags:["APPLICATION"],timePolicy:"always",agentIndex:0},
 query_aid_projects:{operation:"READ",sensitiveLevel:"P0",dataTags:["PUBLIC"],timePolicy:"always",agentIndex:0},
 draft_monthly_report:{operation:"READ",sensitiveLevel:"P1",dataTags:["REPORT"],timePolicy:"always",agentIndex:1},
 draft_review_batch:{operation:"READ",sensitiveLevel:"P2",dataTags:["APPLICATION","MATERIAL"],timePolicy:"always",agentIndex:0},
 create_overdue_reminders:{operation:"CREATE",sensitiveLevel:"P1",dataTags:["APPLICATION"],timePolicy:"work-hours",agentIndex:2},
 submit_approval:{operation:"UPDATE",sensitiveLevel:"P3",dataTags:["APPLICATION"],timePolicy:"work-hours",agentIndex:1},
 export_sensitive_data:{operation:"EXPORT",sensitiveLevel:"P3",dataTags:["AUDIT_LOG"],timePolicy:"work-hours",agentIndex:3},
};function money(value:number){return new Intl.NumberFormat("zh-CN",{style:"currency",currency:"CNY",maximumFractionDigits:0}).format(value)}
async function answerPolicyQuestion(message:string,actor:ActorContext):Promise<ToolExecutionResult>{
 const retrieval=searchPublicKnowledge(actor,message);const citations=retrieval.hits.slice(0,4);
 if(!citations.length)return{success:true,message:"在当前权限范围的知识库中没有检索到足够证据。请补充政策名称、年度或具体业务环节，我不会在缺少依据时猜测。",result:{source:"rag",citations:[]},evidenceSummary:"权限过滤后的知识库未命中足够证据，未调用模型生成事实结论。"};
 if(isModelConfigured())try{const context=citations.map((hit,index)=>`[${index+1}] ${hit.citation}\n${hit.chunk}`).join("\n\n");const completion=await completeWithDeepSeek([{role:"system",content:"你是冀慧学途的政策知识助手。只能依据给定检索证据回答；每个事实结论用[1]这类编号标注来源。若证据不足必须明确说明。不得推断个人是否符合资格，不得泄露敏感信息。使用简洁中文。"},{role:"user",content:`问题：${message}\n\n检索证据：\n${context}`}],{temperature:0,maxTokens:700});return{success:true,message:completion.content,result:{model:completion.model,usage:completion.usage,citations},evidenceSummary:`基于 ${citations.length} 个经过文档权限过滤的知识片段生成回答；模型 ${completion.model}。`}}catch{/* 受控降级 */}
 return{success:true,message:`根据当前知识库：${citations.map((hit,index)=>`\n[${index+1}] ${hit.chunk}`).join("")}\n\n以上内容来自当前授权可见政策，请以正式通知和业务人员复核为准。`,result:{source:"rag-local-fallback",citations},evidenceSummary:`模型不可用时使用本地 RAG 降级回答，返回 ${citations.length} 个带版本引用片段。`}
}
function safeApplication(item: ReturnType<typeof getMyAidProgress>[number]) {
 return { id:item.id, projectName:item.projectName, status:item.status, materialCompleteness:item.materialCompleteness, version:item.version, overdue:item.overdue };
}
function assertToolAllowed(actor:ActorContext,definition:ToolDefinition,confirmed:boolean,taskId:string){
 const policy=TOOL_PERMISSION_POLICY[definition.name],agent=ROLE_GOVERNANCE_POLICIES[actor.role].agentTeam[policy.agentIndex]??ROLE_GOVERNANCE_POLICIES[actor.role].agentTeam[0];
 const request={permission:"assistant:use",operation:policy.operation,actorType:"agent" as const,aiRiskLevel:definition.riskLevel,agent:{agentCode:agent.code,toolName:definition.name,toolRegistered:true,allowedRoles:definition.allowedRoles,registeredPermissions:["assistant:use"],guardrailPassed:true},resource:{id:`ai-tool:${definition.name}`,type:"Agent注册工具",campusId:actor.campusIds[0],departmentId:actor.departmentIds?.[0],classId:actor.classIds?.[0],ownerId:actor.role==="STUDENT"?actor.userId:undefined,assignedTaskId:policy.dataTags.includes("PUBLIC")?undefined:actor.assignedTaskIds?.[0],dataTags:policy.dataTags,sensitiveLevel:policy.sensitiveLevel,processState:definition.name==="submit_approval"?"待校级复审":undefined,currentHandlerId:definition.name==="submit_approval"?actor.userId:undefined},runtime:defaultRuntime({timePolicy:policy.timePolicy,geographicLevel:"L2",confirmations:confirmed?1:0,purpose:policy.sensitiveLevel==="P3"?"受控Agent工具执行":undefined,itemCount:definition.name==="export_sensitive_data"?100:1,trialApproved:true,sandboxPassed:true})};
 const nineDimension=policy.operation==="READ"?evaluateAgentReadQuery(actor,request):evaluateNineDimensionPermission(actor,request);recordRuntimePermissionDecision(actor,{scenarioId:`runtime-${definition.name}`,scenarioName:`Agent工具：${definition.label}`,request,decision:nineDimension,initiatedBy:actor.userId,idempotencyKey:`${taskId}:${confirmed?"confirmed":"initial"}`});
 if(!nineDimension.allowed||!definition.allowedRoles.includes(actor.role))return{allowed:false,reason:"当前身份未获得该工具的完整九维授权。"};
 const legacy=evaluateAiAction(actor,"assistant:use",definition.riskLevel,{userConfirmed:confirmed});return legacy.allowed?{allowed:true}:{allowed:false,reason:legacy.reason};
}
/** Preview uses the exact same nine-dimension + legacy guards as execution; no state transition. */
export function preflightReadTool(toolName:ToolName,actor:ActorContext,taskId:string,confirmed=false):boolean {
 const definition=TOOL_REGISTRY[toolName];
 if(!definition||TOOL_PERMISSION_POLICY[toolName].operation!=="READ")return false;
 return assertToolAllowed(actor,definition,confirmed,taskId).allowed;
}
/** Result-side data scope verification before returning a redacted projection to the model or UI. */
export function verifyReadResultScope(toolName:ToolName,actor:ActorContext,result:ToolExecutionResult,query:string):boolean {
 if(!result.success)return true;
 if(toolName==="policy_qa"){
  const citations=result.result.citations;
  if(!Array.isArray(citations))return false;
  const visible=new Set(searchPublicKnowledge(actor,query).hits.map(hit=>`${hit.documentId}:${hit.citation}`));
  return citations.every(item=>item&&typeof item==="object"&&"documentId" in item&&"citation" in item&&visible.has(`${item.documentId}:${item.citation}`));
 }
 if(toolName==="query_aid_progress"||toolName==="query_pending_applications"){
  const items=result.result.applications;
  if(!Array.isArray(items))return false;
  const visible=new Set((toolName==="query_aid_progress"?getMyAidProgress(actor):listVisibleApplications(actor,["待辅导员初审","待院系复核","待校级复审"])).map(item=>item.id));
  return items.every(item=>item&&typeof item==="object"&&"id" in item&&typeof item.id==="string"&&visible.has(item.id));
 }
 if(toolName==="query_application_detail"){
  const item=result.result.application;
  return Boolean(item&&typeof item==="object"&&"id" in item&&typeof item.id==="string"&&getVisibleApplication(actor,item.id));
 }
 if(toolName==="query_aid_projects"){
  const items=result.result.projects;
  if(!Array.isArray(items))return false;
  const visible=new Set(listApplicationProjects(actor.campusIds).filter(item=>item.active).map(item=>item.code));
  return items.every(item=>item&&typeof item==="object"&&"code" in item&&typeof item.code==="string"&&visible.has(item.code));
 }
 return false;
}
export async function executeTool(toolName:ToolName,actor:ActorContext,taskId:string,message:string,confirmed=false):Promise<ToolExecutionResult>{
 const definition=TOOL_REGISTRY[toolName],policy=TOOL_PERMISSION_POLICY[toolName],agent=ROLE_GOVERNANCE_POLICIES[actor.role].agentTeam[policy.agentIndex]??ROLE_GOVERNANCE_POLICIES[actor.role].agentTeam[0],permission=assertToolAllowed(actor,definition,confirmed,taskId);if(!permission.allowed){const denied={success:false,message:permission.reason??"操作被安全护栏拒绝。",result:{code:"TOOL_DENIED"},evidenceSummary:"岗位权限或 AI 风险护栏校验未通过。"};writeAuditSnapshot({taskId,actorId:actor.userId,actorRole:actor.role,actorType:"agent",action:`ai:tool:${toolName}`,category:"AI_OPERATION",outcome:"blocked",evidenceSummary:denied.evidenceSummary,resource:{type:"agent_tool",id:toolName,campusId:actor.campusIds[0],sensitivity:policy.sensitiveLevel},operationDetails:{toolName,riskLevel:definition.riskLevel,confirmed},ai:{agentCode:agent.code,agentName:agent.name,skillVersion:`${toolName}-v1`,workflowVersion:"assistant-orchestration-v2",traceId:taskId,inputSummary:"用户发起Agent工具调用（内容不写入审计）",outputSummary:"确定性权限或AI护栏阻断",advisoryOnly:true},errorCode:"TOOL_DENIED",affectedRows:0});return denied;}let result:ToolExecutionResult;
 switch(toolName){
  case"policy_qa":result=await answerPolicyQuestion(message,actor);break;
  case"query_aid_progress":{const applications=getMyAidProgress(actor);result={success:true,message:applications.length?applications.map(item=>`• ${item.projectName}：${item.status}（材料完整度 ${item.materialCompleteness}%）`).join("\n"):"暂未查询到您的资助申请。",result:{applications:applications.map(safeApplication)},evidenceSummary:`在当前学生本人数据范围内查询到 ${applications.length} 条申请。`};break}
  case"query_pending_applications":{const applications=listVisibleApplications(actor,["待辅导员初审","待院系复核","待校级复审"]);result={success:true,message:applications.length?`当前授权范围有 ${applications.length} 份待审核申请：\n${applications.map(item=>`• ${item.projectName}｜${item.status}｜材料 ${item.materialCompleteness}%｜风险 ${item.riskLevel}`).join("\n")}`:"当前授权范围内没有待审核申请。",result:{count:applications.length,applications:applications.map(safeApplication)},evidenceSummary:`按组织和任务数据范围查询到 ${applications.length} 条待审核申请。`};break}
  case"query_application_detail":{const id=message.trim();const application=getVisibleApplication(actor,id);
   if(!application){result={success:false,message:"未找到当前身份有权查看的申请，请核对申请编号。",result:{code:"APPLICATION_NOT_FOUND"},evidenceSummary:"申请详情查询未命中授权范围。"};break;}
   const safe=safeApplication(application);result={success:true,message:`${safe.projectName}：${safe.status}，材料完整度 ${safe.materialCompleteness}%。`,result:{application:safe},evidenceSummary:"按业务可见范围查询申请概要；未返回个人敏感字段。"};break}
  case"query_aid_projects":{const projects=listApplicationProjects(actor.campusIds).filter(item=>item.active).map(item=>({code:item.code,name:item.name,applicationStart:item.applicationStart,applicationEnd:item.applicationEnd,maximumAmount:item.maximumAmount,defaultAmount:item.defaultAmount}));result={success:true,message:projects.length?projects.map(item=>`• ${item.name}：${item.applicationStart} 至 ${item.applicationEnd}`).join("\n"):"当前未找到可展示的项目。",result:{projects},evidenceSummary:`当前校区演示项目目录查询到 ${projects.length} 项；未形成资格结论。`};break}
  case"draft_monthly_report":{const report=buildMonthlyFundingReport(actor);result={success:true,message:`资助月报草稿已生成：共 ${report.total} 笔申请，待处理 ${report.pending} 笔，超时 ${report.overdue} 笔，申请金额合计 ${money(report.amount)}。该草稿尚未发布，需业务负责人复核。`,result:{...report,status:"draft",requiresHumanReview:true},evidenceSummary:`基于当前授权范围内 ${report.total} 条申请生成聚合统计草稿，未包含个人敏感字段。`};break}
  case"draft_review_batch":{const applications=listVisibleApplications(actor,["待辅导员初审","待院系复核","待校级复审"]),highRisk=applications.filter(item=>item.riskLevel==="高").length,incomplete=applications.filter(item=>item.materialCompleteness<100).length,overdue=applications.filter(item=>item.overdue).length;result={success:true,message:`已生成 ${applications.length} 份审核建议草稿：${highRisk} 份需重点复核，${incomplete} 份存在材料不完整，${overdue} 份已超时。所有建议均需人工确认，AI 不会提交审批决定。`,result:{count:applications.length,highRisk,incomplete,overdue,applications},evidenceSummary:"仅执行授权范围内的确定性完整度、时效和风险标签聚合；未形成自动审批结论。"};break}
  case"create_overdue_reminders":{const reminder=createOverdueReminders(actor,taskId);result={success:true,message:reminder.created?`已创建 ${reminder.created} 条站内催办通知，可在消息中心跟踪回执。`:"当前没有需要催办的超时事项。",result:reminder,evidenceSummary:`经人工确认后，对 ${reminder.created} 个超时任务写入站内催办通知。`};break}
  case"submit_approval":result={success:false,message:"审批属于 L4 关键业务动作。AI 只能生成审核建议，正式决定必须由当前处理人在审批页面完成。",result:{code:"L4_HUMAN_ACTION_REQUIRED"},evidenceSummary:"确定性护栏阻断 AI 直接提交审批。"};break;
  case"export_sensitive_data":result={success:false,message:"敏感数据导出属于 L5 动作，必须通过受控导出、双人审批和用途登记；AI 不能直接执行。",result:{code:"L5_HUMAN_ACTION_REQUIRED"},evidenceSummary:"确定性护栏阻断 AI 直接导出敏感数据。"};break;
 }
 writeAuditSnapshot({taskId,actorId:actor.userId,actorRole:actor.role,actorType:"agent",action:`ai:tool:${toolName}`,category:"AI_OPERATION",outcome:result.success?"success":"blocked",evidenceSummary:result.evidenceSummary,resource:{type:"agent_tool",id:toolName,campusId:actor.campusIds[0],sensitivity:policy.sensitiveLevel},operationDetails:{toolName,riskLevel:definition.riskLevel,confirmed,resultType:result.success?"success":"blocked"},ai:{agentCode:agent.code,agentName:agent.name,modelVersion:typeof result.result==="object"&&result.result&&"model" in result.result?String(result.result.model):"deterministic-tool-runtime-v2",skillVersion:`${toolName}-v1`,workflowVersion:"assistant-orchestration-v2",traceId:taskId,inputSummary:"用户发起Agent工具调用（内容不写入审计）",outputSummary:result.evidenceSummary,advisoryOnly:definition.riskLevel!=="L3"},affectedRows:result.success?1:0});return result
}
export async function executePolicyAnswer(message:string,actor:ActorContext,taskId:string){return executeTool("policy_qa",actor,taskId,message,false)}

