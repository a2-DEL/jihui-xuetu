import { randomUUID } from "node:crypto";
import type { ActorContext, AiRiskLevel } from "@/lib/platform/authorization";
import { buildMonthlyFundingReport, listVisibleApplications, writeAuditSnapshot } from "@/lib/platform/demo-store";

export type StudioAssetStatus = "draft" | "validated" | "published" | "installed" | "disabled";
export type StudioSkillOperation = "application_analysis" | "monthly_report" | "risk_summary";
export interface StudioSkill { id:string; name:string; slug:string; description:string; operation:StudioSkillOperation; riskLevel:AiRiskLevel; status:StudioAssetStatus; installed:boolean; sandbox:{status:"not_run"|"passed"|"failed"; checks:string[]; runAt?:string}; runs:number; version:number; createdBy:string; createdAt:string; updatedAt:string }
export interface StudioIntegration { id:string; type:"plugin"|"mcp"; name:string; description:string; endpoint:string; authMode:"none"|"oauth2"|"mTLS"|"api-key-ref"; secretRef?:string; tools:string[]; status:StudioAssetStatus; installed:boolean; enabled:boolean; health:"unknown"|"healthy"|"degraded"; calls:number; version:number; createdBy:string; createdAt:string; updatedAt:string }
export interface MemoryEntry { id:string; content:string; tags:string[]; sensitivity:"P0"|"P1"|"P2"; source:string; vector:number[]; createdBy:string; createdAt:string; expiresAt:string }
export interface MemoryNamespace { id:string; name:string; description:string; scope:"private"|"role"; ownerId:string; ownerRole:string; retentionDays:number; entries:MemoryEntry[]; createdAt:string; updatedAt:string; version:number }
export type WorkflowTemplate = "analysis" | "reminder" | "knowledge_feedback" | "temporary_hardship_grant";
export interface WorkflowNode { id:string; type:"trigger"|"data_query"|"skill"|"human_gate"|"memory"|"notification"|"report"|"agent"|"permission"|"mcp"; name:string; config:Record<string,string|number|boolean> }
export interface WorkflowEdge { source:string; target:string }
export interface WorkflowRun { id:string; status:"completed"|"blocked"|"awaiting_confirmation"|"failed"; startedAt:string; finishedAt?:string; steps:Array<{nodeId:string;name:string;status:string;detail:string;durationMs:number}>; output:Record<string,unknown> }
export interface StudioWorkflow { id:string; name:string; description:string; template:WorkflowTemplate; riskLevel:AiRiskLevel; nodes:WorkflowNode[]; edges:WorkflowEdge[]; status:StudioAssetStatus; installed:boolean; runs:number; lastRun?:WorkflowRun; validationErrors:string[]; version:number; createdBy:string; createdAt:string; updatedAt:string }
export interface StudioSnapshot { mode:"in-memory-enterprise-demo"; capabilities:{skillLifecycle:boolean;pluginLifecycle:boolean;mcpLifecycle:boolean;vectorMemory:boolean;workflowLifecycle:boolean;deterministicGuardrails:boolean;productionAdaptersConfigured:boolean}; skills:StudioSkill[]; integrations:StudioIntegration[]; memories:Array<Omit<MemoryNamespace,"entries">&{entryCount:number;latestEntries:Array<Omit<MemoryEntry,"vector">>}>; workflows:StudioWorkflow[] }

type StoredResult={success:boolean;code:string;message:string;data?:unknown};
interface Store { skills:StudioSkill[]; integrations:StudioIntegration[]; memories:MemoryNamespace[]; workflows:StudioWorkflow[]; idempotency:Map<string,StoredResult> }
const seedTime="2026-08-03T10:00:00+08:00";

function nodesFor(template:WorkflowTemplate):{nodes:WorkflowNode[];edges:WorkflowEdge[];riskLevel:AiRiskLevel}{
 if(template==="temporary_hardship_grant"){
  const nodes:WorkflowNode[]=[
   {id:"notice",type:"notification",name:"发布临时困难补助通知",config:{role:"FUND_ADMIN",humanGate:true}},
   {id:"apply",type:"trigger",name:"学生在线申请与材料提交",config:{role:"STUDENT",humanGate:true}},
   {id:"precheck",type:"permission",name:"规则校验与AI预审",config:{skill:"material-precheck",risk:"L2"}},
   {id:"counselor",type:"human_gate",name:"辅导员初审",config:{role:"COUNSELOR",required:true}},
   {id:"department",type:"human_gate",name:"院系复核与汇总",config:{role:"DEPT_ADMIN",required:true}},
   {id:"school",type:"human_gate",name:"校级资助中心复审",config:{role:"FUND_ADMIN",required:true}},
   {id:"leader",type:"human_gate",name:"校领导审批",config:{role:"SCHOOL_LEADER",required:true}},
   {id:"finance",type:"human_gate",name:"财务双人复核",config:{role:"FINANCE",required:true}},
   {id:"bank",type:"mcp",name:"银行MCP发放与回盘",config:{server:"bank-grant-mcp",humanGate:true}},
   {id:"reconcile",type:"report",name:"对账、到账通知与审计归档",config:{skill:"grant-reconciliation"}},
  ];
  return{riskLevel:"L3",nodes,edges:nodes.slice(0,-1).map((node,index)=>({source:node.id,target:nodes[index+1].id}))};
 }
 if(template==="reminder")return{riskLevel:"L3",nodes:[{id:"start",type:"trigger",name:"每日超时扫描",config:{schedule:"0 9 * * 1-5"}},{id:"query",type:"data_query",name:"查询超时申请",config:{scope:"authorized"}},{id:"gate",type:"human_gate",name:"经办人确认发送对象",config:{required:true}},{id:"notify",type:"notification",name:"创建站内催办",config:{channel:"in-app"}},{id:"report",type:"report",name:"生成催办回执",config:{format:"summary"}}],edges:[{source:"start",target:"query"},{source:"query",target:"gate"},{source:"gate",target:"notify"},{source:"notify",target:"report"}]};
 if(template==="knowledge_feedback")return{riskLevel:"L2",nodes:[{id:"start",type:"trigger",name:"人工修正事件",config:{event:"answer.corrected"}},{id:"memory",type:"memory",name:"写入反馈记忆",config:{namespace:"feedback"}},{id:"skill",type:"skill",name:"提炼候选经验",config:{operation:"risk_summary"}},{id:"report",type:"report",name:"生成待审核经验卡",config:{format:"evidence"}}],edges:[{source:"start",target:"memory"},{source:"memory",target:"skill"},{source:"skill",target:"report"}]};
 return{riskLevel:"L1",nodes:[{id:"start",type:"trigger",name:"人工启动",config:{trigger:"manual"}},{id:"query",type:"data_query",name:"查询授权申请",config:{scope:"authorized"}},{id:"skill",type:"skill",name:"运行申请态势分析",config:{operation:"application_analysis"}},{id:"report",type:"report",name:"生成管理摘要",config:{format:"dashboard"}}],edges:[{source:"start",target:"query"},{source:"query",target:"skill"},{source:"skill",target:"report"}]};
}
function createStore():Store{
 const analysis=nodesFor("analysis"),reminder=nodesFor("reminder"),hardship=nodesFor("temporary_hardship_grant");
 return{skills:[
  {id:"studio-skill-analysis",name:"申请态势分析",slug:"application-analysis",description:"对当前授权范围内的申请数量、金额、风险与时效进行聚合分析，不输出个人敏感字段。",operation:"application_analysis",riskLevel:"L1",status:"installed",installed:true,sandbox:{status:"passed",checks:["依赖白名单通过","数据权限测试通过","输出脱敏测试通过"],runAt:seedTime},runs:12,version:4,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"studio-skill-report",name:"月报草稿生成",slug:"monthly-report-draft",description:"基于授权统计生成月报草稿，不自动发布。",operation:"monthly_report",riskLevel:"L2",status:"published",installed:false,sandbox:{status:"passed",checks:["依赖白名单通过","提示注入测试通过","成本阈值通过"],runAt:seedTime},runs:3,version:2,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"studio-skill-material-precheck",name:"临时困难补助材料预检",slug:"temporary-aid-material-precheck",description:"对脱敏材料摘要执行规则一致性与缺项预检，只生成建议，不形成审核结论。",operation:"risk_summary",riskLevel:"L2",status:"installed",installed:true,sandbox:{status:"passed",checks:["权限范围通过","提示注入测试通过","敏感字段脱敏通过","低置信度HITL通过"],runAt:seedTime},runs:18,version:3,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"studio-skill-grant-reconciliation",name:"银校回盘对账",slug:"grant-reconciliation",description:"对银行回盘执行笔数、金额、幂等键和失败明细核对，异常只转人工，不自动重发。",operation:"risk_summary",riskLevel:"L3",status:"installed",installed:true,sandbox:{status:"passed",checks:["金额平衡测试通过","幂等重放通过","异常转人工通过"],runAt:seedTime},runs:9,version:2,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
 ],integrations:[
  {id:"studio-mcp-student",type:"mcp",name:"学工系统 MCP（模拟）",description:"提供学籍状态核验和院系统计读取工具。",endpoint:"mock://student-affairs/mcp",authMode:"oauth2",secretRef:"vault://mcp/student-affairs",tools:["student_status.read","department_stats.read"],status:"installed",installed:true,enabled:true,health:"healthy",calls:26,version:3,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"studio-plugin-parser",type:"plugin",name:"材料解析插件",description:"向工作流暴露版面解析与字段一致性检查能力。",endpoint:"mock://document-parser/plugin",authMode:"mTLS",secretRef:"vault://plugin/document-parser",tools:["document.layout.parse","document.fields.compare"],status:"installed",installed:true,enabled:true,health:"healthy",calls:8,version:3,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"studio-mcp-bank-grant",type:"mcp",name:"银行资助发放 MCP（模拟）",description:"通过允许列表提交最小必要发放字段、查询任务状态并接收回盘；资金动作仍需银行人员授权。",endpoint:"mock://bank/grant-mcp",authMode:"mTLS",secretRef:"vault://mcp/bank-grant",tools:["grant.batch.submit","grant.status.read","grant.receipt.pull"],status:"installed",installed:true,enabled:true,health:"healthy",calls:14,version:2,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
 ],memories:[{id:"memory-ai-ops",name:"AI运维经验记忆",description:"保存经过人工确认的故障处置与评估经验。",scope:"role",ownerId:"demo-ai-ops",ownerRole:"AI_OPS",retentionDays:180,entries:[createEntry("人工修正：材料有效期应以签发日期和政策要求共同判断，不能只比较上传日期。",["材料审核","人工反馈"],"P1","feedback:case-001","demo-ai-ops",180)],createdAt:seedTime,updatedAt:seedTime,version:1}],workflows:[
  {id:"workflow-analysis",name:"每日资助态势分析",description:"查询授权业务数据，运行聚合 Skill 并生成管理摘要。",template:"analysis",riskLevel:"L1",nodes:analysis.nodes,edges:analysis.edges,status:"installed",installed:true,runs:5,validationErrors:[],version:4,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"workflow-reminder",name:"超时事项智能催办",description:"识别超时申请，经人工确认后创建站内催办并记录回执。",template:"reminder",riskLevel:"L3",nodes:reminder.nodes,edges:reminder.edges,status:"published",installed:false,runs:0,validationErrors:[],version:2,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
  {id:"workflow-temporary-hardship-grant",name:"临时困难补助全链路协同",description:"从通知、申请、分层审核到财务、银行MCP、对账和审计归档的10节点正式工作流。",template:"temporary_hardship_grant",riskLevel:"L3",nodes:hardship.nodes,edges:hardship.edges,status:"installed",installed:true,runs:6,validationErrors:[],version:5,createdBy:"demo-ai-ops",createdAt:seedTime,updatedAt:seedTime},
 ],idempotency:new Map()};
}
type Global=typeof globalThis&{__jhxtAiStudio?:Store}; const root=globalThis as Global; const store=root.__jhxtAiStudio??createStore(); root.__jhxtAiStudio=store;

function ensureHardshipAssets(){
 const seeded=createStore();
 for(const item of seeded.skills)if(!store.skills.some(current=>current.id===item.id))store.skills.push(item);
 for(const item of seeded.integrations)if(!store.integrations.some(current=>current.id===item.id))store.integrations.push(item);
 for(const item of seeded.workflows)if(!store.workflows.some(current=>current.id===item.id))store.workflows.push(item);
}
ensureHardshipAssets();

export interface HardshipAssetManifestItem { id:string; name:string; kind:"workflow"|"skill"|"plugin"|"mcp"; version:number; status:string; healthy:boolean; tools:string[] }
export function getHardshipAssetManifest():HardshipAssetManifestItem[]{
 ensureHardshipAssets();
 const ids=["workflow-temporary-hardship-grant","studio-skill-material-precheck","studio-skill-grant-reconciliation","studio-plugin-parser","studio-mcp-bank-grant"];
 return ids.map(id=>{
  const workflow=store.workflows.find(item=>item.id===id);if(workflow)return{id:workflow.id,name:workflow.name,kind:"workflow" as const,version:workflow.version,status:workflow.status,healthy:workflow.installed&&!workflow.validationErrors.length,tools:workflow.nodes.map(node=>node.name)};
  const skill=store.skills.find(item=>item.id===id);if(skill)return{id:skill.id,name:skill.name,kind:"skill" as const,version:skill.version,status:skill.status,healthy:skill.installed&&skill.sandbox.status==="passed",tools:[skill.operation]};
  const integration=store.integrations.find(item=>item.id===id);if(integration)return{id:integration.id,name:integration.name,kind:integration.type,version:integration.version,status:integration.status,healthy:integration.installed&&integration.enabled&&integration.health==="healthy",tools:[...integration.tools]};
  throw new Error(`HARDSHIP_ASSET_MISSING:${id}`);
 });
}
export function recordHardshipAssetExecution(assetId:string){
 const skill=store.skills.find(item=>item.id===assetId);if(skill){skill.runs+=1;skill.updatedAt=now();return}
 const integration=store.integrations.find(item=>item.id===assetId);if(integration){integration.calls+=1;integration.updatedAt=now();return}
 const workflow=store.workflows.find(item=>item.id===assetId);if(workflow){workflow.runs+=1;workflow.updatedAt=now()}
}

function canRead(actor:ActorContext){return ["AI_OPS","SYS_ADMIN","AUDITOR","DISCIPLINE"].includes(actor.role)}
function canManage(actor:ActorContext){return actor.role==="AI_OPS"}
function now(){return new Date().toISOString()}
function clone<T>(value:T):T{return structuredClone(value)}
function audit(actor:ActorContext,action:string,target:string,outcome:string,message:string){writeAuditSnapshot({taskId:`ai-studio-${target}`,actorId:actor.userId,actorRole:actor.role,action:`ai_studio:${action}`,outcome,evidenceSummary:message.slice(0,500)})}
function replay(actor:ActorContext,key:string){return store.idempotency.get(`${actor.userId}:${key}`)}
function remember(actor:ActorContext,key:string,result:StoredResult){store.idempotency.set(`${actor.userId}:${key}`,clone(result));return result}
function denied(message="只有 AI 运维管理员可管理 AI 资产。"):StoredResult{return{success:false,code:"ROLE_DENIED",message}}
function notFound(type:string):StoredResult{return{success:false,code:"NOT_FOUND",message:`${type}不存在或已被移除。`}}

function embedding(text:string){const dims=24,vector=Array.from({length:dims},()=>0);Array.from(text.toLowerCase()).forEach((char,index)=>{vector[(char.charCodeAt(0)*31+index*17)%dims]+=1});const norm=Math.sqrt(vector.reduce((sum,item)=>sum+item*item,0))||1;return vector.map(item=>Number((item/norm).toFixed(6)))}
function cosine(a:number[],b:number[]){return a.reduce((sum,item,index)=>sum+item*(b[index]??0),0)}
function createEntry(content:string,tags:string[],sensitivity:MemoryEntry["sensitivity"],source:string,createdBy:string,retentionDays:number):MemoryEntry{const createdAt=now();const expiresAt=new Date(Date.now()+retentionDays*86400000).toISOString();return{id:`memory-entry-${randomUUID()}`,content:content.trim().slice(0,2000),tags:tags.slice(0,10).map(item=>item.slice(0,30)),sensitivity,source:source.slice(0,100),vector:embedding(content),createdBy,createdAt,expiresAt}}
function cleanupMemory(namespace:MemoryNamespace){const time=Date.now();namespace.entries=namespace.entries.filter(item=>new Date(item.expiresAt).getTime()>time)}

export function getStudioSnapshot(actor:ActorContext):StudioSnapshot|null{
 if(!canRead(actor))return null;
 store.memories.forEach(cleanupMemory);
 const memories=store.memories.filter(item=>item.scope==="role"?item.ownerRole===actor.role||actor.role==="SYS_ADMIN":item.ownerId===actor.userId).map(item=>{const{entries,...base}=item;return{...clone(base),entryCount:entries.length,latestEntries:entries.slice(-3).reverse().map(entry=>({id:entry.id,content:entry.content,tags:[...entry.tags],sensitivity:entry.sensitivity,source:entry.source,createdBy:entry.createdBy,createdAt:entry.createdAt,expiresAt:entry.expiresAt}))}});
 return{mode:"in-memory-enterprise-demo",capabilities:{skillLifecycle:true,pluginLifecycle:true,mcpLifecycle:true,vectorMemory:true,workflowLifecycle:true,deterministicGuardrails:true,productionAdaptersConfigured:false},skills:clone(store.skills),integrations:clone(store.integrations),memories,workflows:clone(store.workflows)};
}

export function createStudioSkill(actor:ActorContext,input:{name:string;slug:string;description:string;operation:StudioSkillOperation;riskLevel:AiRiskLevel},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;
 if(input.name.trim().length<3||!/^[a-z0-9-]{3,40}$/.test(input.slug)||input.description.trim().length<12)return{success:false,code:"VALIDATION_FAILED",message:"名称、英文标识或描述不符合要求。"};
 if(store.skills.some(item=>item.slug===input.slug))return{success:false,code:"SLUG_EXISTS",message:"Skill 英文标识已存在。"};
 const time=now();const skill:StudioSkill={id:`studio-skill-${randomUUID()}`,name:input.name.trim().slice(0,60),slug:input.slug,description:input.description.trim().slice(0,500),operation:input.operation,riskLevel:input.riskLevel,status:"draft",installed:false,sandbox:{status:"not_run",checks:[]},runs:0,version:1,createdBy:actor.userId,createdAt:time,updatedAt:time};store.skills.unshift(skill);audit(actor,"skill.create",skill.id,"success",`创建 Skill 草稿 ${skill.name}（${skill.slug}），风险 ${skill.riskLevel}。`);return remember(actor,key,{success:true,code:"SKILL_CREATED",message:"Skill 草稿已创建，可继续运行沙盒测试。",data:clone(skill)})
}
export function actStudioSkill(actor:ActorContext,input:{id:string;action:"sandbox"|"publish"|"install"|"uninstall"|"run";expectedVersion:number;humanConfirmed?:boolean},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;const skill=store.skills.find(item=>item.id===input.id);if(!skill)return notFound("Skill");if(skill.version!==input.expectedVersion)return{success:false,code:"VERSION_CONFLICT",message:"Skill 已更新，请刷新后重试。"};let output:unknown;
 if(input.action==="sandbox"){if(skill.status!=="draft")return{success:false,code:"STATE_DENIED",message:"只有草稿 Skill 可以运行沙盒。"};const checks=["依赖白名单通过","数据权限测试通过","输出脱敏测试通过","资源上限测试通过"];skill.sandbox={status:"passed",checks,runAt:now()};skill.status="validated"}
 else if(input.action==="publish"){if(skill.status!=="validated"||skill.sandbox.status!=="passed")return{success:false,code:"PRECONDITION_FAILED",message:"Skill 必须先通过沙盒测试。"};if(!input.humanConfirmed)return{success:false,code:"CONFIRMATION_REQUIRED",message:"发布 Skill 需要人工确认。"};skill.status="published"}
 else if(input.action==="install"){if(skill.status!=="published")return{success:false,code:"PRECONDITION_FAILED",message:"只有已发布 Skill 可以安装。"};skill.installed=true;skill.status="installed"}
 else if(input.action==="uninstall"){if(!skill.installed)return{success:false,code:"STATE_DENIED",message:"Skill 尚未安装。"};skill.installed=false;skill.status="published"}
 else {if(!skill.installed)return{success:false,code:"NOT_INSTALLED",message:"请先安装 Skill。"};output=runSkillOperation(actor,skill.operation);skill.runs+=1}
 skill.version+=1;skill.updatedAt=now();audit(actor,`skill.${input.action}`,skill.id,"success",`${skill.name} 执行 ${input.action}，状态 ${skill.status}，运行次数 ${skill.runs}。`);return remember(actor,key,{success:true,code:"ACTION_COMPLETED",message:input.action==="run"?"Skill 已在授权数据范围内运行完成。":"Skill 生命周期状态已更新。",data:{skill:clone(skill),output}})
}
function runSkillOperation(actor:ActorContext,operation:StudioSkillOperation){const apps=listVisibleApplications(actor),report=buildMonthlyFundingReport(actor);if(operation==="monthly_report")return{title:"校园资助月报草稿",status:"draft",total:report.total,pending:report.pending,overdue:report.overdue,amount:report.amount,notice:"该内容为草稿，发布前必须由业务负责人复核。"};if(operation==="risk_summary")return{highRisk:apps.filter(item=>item.riskLevel==="高").length,incomplete:apps.filter(item=>item.materialCompleteness<100).length,overdue:apps.filter(item=>item.overdue).length,explainability:"仅基于确定性标签聚合，不输出自动审批结论。"};return{applications:apps.length,amount:report.amount,pending:report.pending,overdue:report.overdue,highRisk:apps.filter(item=>item.riskLevel==="高").length,byStatus:report.byStatus,dataScope:"actor-authorized"}}

export function createStudioIntegration(actor:ActorContext,input:{type:"plugin"|"mcp";name:string;description:string;endpoint:string;authMode:StudioIntegration["authMode"];secretRef?:string;tools:string[]},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;if(input.name.trim().length<3||input.description.trim().length<10||!/^mock:\/\/|^https:\/\//.test(input.endpoint)||!input.tools.length)return{success:false,code:"VALIDATION_FAILED",message:"名称、描述、端点或工具列表不符合要求；端点仅允许 mock:// 或 https://。"};if(input.authMode!=="none"&&(!input.secretRef||!input.secretRef.startsWith("vault://")))return{success:false,code:"SECRET_REF_REQUIRED",message:"凭据只能通过 vault:// 引用，禁止保存明文密钥。"};const time=now();const item:StudioIntegration={id:`studio-${input.type}-${randomUUID()}`,type:input.type,name:input.name.trim().slice(0,60),description:input.description.trim().slice(0,500),endpoint:input.endpoint,authMode:input.authMode,secretRef:input.secretRef,tools:input.tools.slice(0,12).map(tool=>tool.trim()).filter(Boolean),status:"draft",installed:false,enabled:false,health:"unknown",calls:0,version:1,createdBy:actor.userId,createdAt:time,updatedAt:time};store.integrations.unshift(item);audit(actor,`${item.type}.create`,item.id,"success",`创建 ${item.type.toUpperCase()} 草稿 ${item.name}；端点 ${item.endpoint}；密钥仅保存引用。`);return remember(actor,key,{success:true,code:"INTEGRATION_CREATED",message:`${item.type.toUpperCase()} 草稿已创建。`,data:clone(item)})
}
export function actStudioIntegration(actor:ActorContext,input:{id:string;action:"test"|"publish"|"install"|"enable"|"disable"|"call";expectedVersion:number;tool?:string;arguments?:Record<string,unknown>;humanConfirmed?:boolean},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;const item=store.integrations.find(row=>row.id===input.id);if(!item)return notFound("集成");if(item.version!==input.expectedVersion)return{success:false,code:"VERSION_CONFLICT",message:"集成配置已更新。"};let output:unknown;
 if(input.action==="test"){item.health=item.endpoint.startsWith("mock://")||item.endpoint.startsWith("https://")?"healthy":"degraded";if(item.health!=="healthy")return{success:false,code:"HANDSHAKE_FAILED",message:"握手测试失败。"};item.status="validated";output={protocol:item.type==="mcp"?"MCP 2025-03":"PLUGIN v1",discoveredTools:item.tools,latencyMs:42}}
 else if(input.action==="publish"){if(item.status!=="validated"||item.health!=="healthy")return{success:false,code:"PRECONDITION_FAILED",message:"发布前必须完成健康握手测试。"};if(!input.humanConfirmed)return{success:false,code:"CONFIRMATION_REQUIRED",message:"发布集成需要人工确认。"};item.status="published"}
 else if(input.action==="install"){if(item.status!=="published")return{success:false,code:"PRECONDITION_FAILED",message:"只有已发布集成可以安装。"};item.status="installed";item.installed=true;item.enabled=false}
 else if(input.action==="enable"){if(!item.installed||item.health!=="healthy")return{success:false,code:"PRECONDITION_FAILED",message:"集成必须已安装且健康。"};item.enabled=true}
 else if(input.action==="disable"){item.enabled=false}
 else {if(!item.installed||!item.enabled)return{success:false,code:"INTEGRATION_DISABLED",message:"集成尚未安装或启用。"};if(!input.tool||!item.tools.includes(input.tool))return{success:false,code:"TOOL_NOT_ALLOWLISTED",message:"工具不在该集成的允许列表。"};output={tool:input.tool,requestId:`mcp-call-${randomUUID()}`,result:integrationMockResult(input.tool,input.arguments??{}),transport:item.endpoint.startsWith("mock://")?"deterministic-mock":"network-adapter-not-invoked"};item.calls+=1}
 item.version+=1;item.updatedAt=now();audit(actor,`${item.type}.${input.action}`,item.id,"success",`${item.name} 执行 ${input.action}；状态 ${item.status}；启用 ${item.enabled}；调用 ${item.calls}。`);return remember(actor,key,{success:true,code:"ACTION_COMPLETED",message:input.action==="call"?"允许列表内的集成工具已调用完成。":"集成生命周期状态已更新。",data:{integration:clone(item),output}})
}
function integrationMockResult(tool:string,args:Record<string,unknown>){if(tool.includes("student_status"))return{status:"active",verified:true,source:"student-affairs-mock",subject:String(args.studentNo??"aggregate")};if(tool.includes("department_stats"))return{departments:3,activeStudents:12846,updatedAt:now()};if(tool.includes("layout"))return{pages:6,tables:2,paragraphs:38,confidence:.97};if(tool.includes("fields"))return{checked:18,conflicts:1,requiresHumanReview:true};return{ok:true,echo:Object.keys(args)}}

export function createMemoryNamespace(actor:ActorContext,input:{name:string;description:string;scope:"private"|"role";retentionDays:number},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;if(input.name.trim().length<3||input.description.trim().length<10||![30,90,180,365].includes(input.retentionDays))return{success:false,code:"VALIDATION_FAILED",message:"记忆空间名称、描述或保留期无效。"};const time=now();const namespace:MemoryNamespace={id:`memory-${randomUUID()}`,name:input.name.trim().slice(0,60),description:input.description.trim().slice(0,300),scope:input.scope,ownerId:actor.userId,ownerRole:actor.role,retentionDays:input.retentionDays,entries:[],createdAt:time,updatedAt:time,version:1};store.memories.unshift(namespace);audit(actor,"memory.create",namespace.id,"success",`创建 ${namespace.scope} 记忆空间 ${namespace.name}，保留 ${namespace.retentionDays} 天。`);return remember(actor,key,{success:true,code:"MEMORY_CREATED",message:"记忆空间已创建。",data:clone(namespace)})
}
function findMemory(actor:ActorContext,id:string){const item=store.memories.find(row=>row.id===id);if(!item)return null;return item.ownerId===actor.userId||(item.scope==="role"&&item.ownerRole===actor.role)?item:null}
export function writeMemory(actor:ActorContext,input:{namespaceId:string;content:string;tags:string[];sensitivity:MemoryEntry["sensitivity"];source:string},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;const namespace=findMemory(actor,input.namespaceId);if(!namespace)return notFound("记忆空间");if(input.content.trim().length<8)return{success:false,code:"CONTENT_REQUIRED",message:"记忆内容至少 8 个字。"};if(input.sensitivity==="P2"&&namespace.scope==="role")return{success:false,code:"SENSITIVITY_SCOPE_DENIED",message:"P2 记忆不能写入角色共享空间。"};const entry=createEntry(input.content,input.tags,input.sensitivity,input.source,actor.userId,namespace.retentionDays);namespace.entries.push(entry);namespace.version+=1;namespace.updatedAt=now();audit(actor,"memory.write",namespace.id,"success",`向 ${namespace.name} 写入 ${entry.sensitivity} 经验；来源 ${entry.source}；内容不写入审计。`);return remember(actor,key,{success:true,code:"MEMORY_WRITTEN",message:"记忆已向量化并写入长期记忆空间。",data:{...clone(entry),vector:undefined}})
}
export function searchMemory(actor:ActorContext,input:{namespaceId:string;query:string;topK?:number}):StoredResult{
 const namespace=findMemory(actor,input.namespaceId);if(!namespace)return notFound("记忆空间");cleanupMemory(namespace);if(input.query.trim().length<2)return{success:false,code:"QUERY_REQUIRED",message:"检索词至少 2 个字。"};const vector=embedding(input.query),topK=Math.min(10,Math.max(1,input.topK??5));const results=namespace.entries.map(({vector:entryVector,...entry})=>({...clone(entry),score:Number(cosine(vector,entryVector).toFixed(4))})).sort((a,b)=>b.score-a.score).slice(0,topK);audit(actor,"memory.search",namespace.id,"success",`在 ${namespace.name} 检索长期记忆，返回 ${results.length} 条；未记录查询正文。`);return{success:true,code:"MEMORY_SEARCHED",message:`检索到 ${results.length} 条相关记忆。`,data:results}
}

export function createStudioWorkflow(actor:ActorContext,input:{name:string;description:string;template:WorkflowTemplate},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;if(input.name.trim().length<3||input.description.trim().length<10)return{success:false,code:"VALIDATION_FAILED",message:"工作流名称或描述过短。"};const graph=nodesFor(input.template),time=now();const item:StudioWorkflow={id:`workflow-${randomUUID()}`,name:input.name.trim().slice(0,60),description:input.description.trim().slice(0,500),template:input.template,riskLevel:graph.riskLevel,nodes:graph.nodes,edges:graph.edges,status:"draft",installed:false,runs:0,validationErrors:[],version:1,createdBy:actor.userId,createdAt:time,updatedAt:time};store.workflows.unshift(item);audit(actor,"workflow.create",item.id,"success",`创建工作流草稿 ${item.name}，模板 ${item.template}，风险 ${item.riskLevel}。`);return remember(actor,key,{success:true,code:"WORKFLOW_CREATED",message:"工作流草稿已创建。",data:clone(item)})
}
function validateWorkflow(item:StudioWorkflow){const ids=new Set(item.nodes.map(node=>node.id)),errors:string[]=[];if(ids.size!==item.nodes.length)errors.push("节点 ID 重复");for(const edge of item.edges)if(!ids.has(edge.source)||!ids.has(edge.target))errors.push(`边 ${edge.source}→${edge.target} 指向不存在节点`);const incoming=new Map(item.nodes.map(node=>[node.id,0]));item.edges.forEach(edge=>incoming.set(edge.target,(incoming.get(edge.target)??0)+1));const queue=item.nodes.filter(node=>(incoming.get(node.id)??0)===0).map(node=>node.id);let visited=0;while(queue.length){const id=queue.shift()!;visited++;item.edges.filter(edge=>edge.source===id).forEach(edge=>{const next=(incoming.get(edge.target)??0)-1;incoming.set(edge.target,next);if(next===0)queue.push(edge.target)})}if(visited!==item.nodes.length)errors.push("工作流存在环路");if(!item.nodes.some(node=>node.type==="trigger"))errors.push("缺少触发节点");if(item.riskLevel==="L3"&&!item.nodes.some(node=>node.type==="human_gate"))errors.push("L3 工作流缺少人工确认节点");return errors}
export function actStudioWorkflow(actor:ActorContext,input:{id:string;action:"validate"|"publish"|"install"|"uninstall"|"run";expectedVersion:number;humanConfirmed?:boolean},key:string):StoredResult{
 if(!canManage(actor))return denied();const cached=replay(actor,key);if(cached)return cached;const item=store.workflows.find(row=>row.id===input.id);if(!item)return notFound("工作流");if(item.version!==input.expectedVersion)return{success:false,code:"VERSION_CONFLICT",message:"工作流已更新。"};let output:unknown;
 if(input.action==="validate"){item.validationErrors=validateWorkflow(item);if(item.validationErrors.length)return{success:false,code:"WORKFLOW_INVALID",message:item.validationErrors.join("；"),data:clone(item)};item.status="validated"}
 else if(input.action==="publish"){if(item.status!=="validated"||item.validationErrors.length)return{success:false,code:"PRECONDITION_FAILED",message:"工作流必须先通过 DAG、节点和护栏校验。"};if(!input.humanConfirmed)return{success:false,code:"CONFIRMATION_REQUIRED",message:"发布工作流需要人工确认。"};item.status="published"}
 else if(input.action==="install"){if(item.status!=="published")return{success:false,code:"PRECONDITION_FAILED",message:"只有已发布工作流可以安装。"};item.status="installed";item.installed=true}
 else if(input.action==="uninstall"){if(!item.installed)return{success:false,code:"STATE_DENIED",message:"工作流尚未安装。"};item.installed=false;item.status="published"}
 else {if(!item.installed)return{success:false,code:"NOT_INSTALLED",message:"请先安装工作流。"};const run=executeWorkflow(actor,item,Boolean(input.humanConfirmed));item.lastRun=run;if(run.status==="awaiting_confirmation")return{success:false,code:"CONFIRMATION_REQUIRED",message:"工作流已运行到人工确认节点，请确认后继续。",data:{workflow:clone(item),run:clone(run)}};item.runs+=1;output=run}
 item.version+=1;item.updatedAt=now();audit(actor,`workflow.${input.action}`,item.id,"success",`${item.name} 执行 ${input.action}；状态 ${item.status}；运行次数 ${item.runs}。`);return remember(actor,key,{success:true,code:"ACTION_COMPLETED",message:input.action==="run"?"工作流已完成，完整步骤已写入运行轨迹。":"工作流生命周期状态已更新。",data:{workflow:clone(item),output}})
}
function executeWorkflow(actor:ActorContext,item:StudioWorkflow,confirmed:boolean):WorkflowRun{const run:WorkflowRun={id:`workflow-run-${randomUUID()}`,status:"completed",startedAt:now(),steps:[],output:{}};const apps=listVisibleApplications(actor),report=buildMonthlyFundingReport(actor);for(const [index,node] of item.nodes.entries()){const duration=18+index*7;if(node.type==="human_gate"&&!confirmed){run.steps.push({nodeId:node.id,name:node.name,status:"waiting",detail:"等待具有当前岗位权限的人员确认。",durationMs:duration});run.status="awaiting_confirmation";run.output={pendingNode:node.id,eligibleCount:apps.filter(row=>row.overdue).length};return run}let detail="节点执行完成";if(node.type==="data_query")detail=`按授权范围读取 ${apps.length} 笔申请，未越权读取个人敏感字段。`;if(node.type==="skill")detail=`聚合 ${report.total} 笔申请、${report.overdue} 笔超时、${apps.filter(row=>row.riskLevel==="高").length} 笔高风险标签。`;if(node.type==="notification")detail=`人工确认通过；演示运行生成 ${apps.filter(row=>row.overdue).length} 条通知草稿，未对外发送。`;if(node.type==="memory")detail="生成反馈经验候选，等待内容审核后写入长期记忆。";if(node.type==="report")detail="已生成只含聚合数据的管理摘要。";run.steps.push({nodeId:node.id,name:node.name,status:"completed",detail,durationMs:duration})}run.finishedAt=now();run.output={applications:report.total,pending:report.pending,overdue:report.overdue,amount:report.amount,highRisk:apps.filter(row=>row.riskLevel==="高").length,notificationDrafts:item.template==="reminder"?apps.filter(row=>row.overdue).length:0};return run}


