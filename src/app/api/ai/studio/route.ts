import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { actStudioIntegration, actStudioSkill, actStudioWorkflow, createMemoryNamespace, createStudioIntegration, createStudioSkill, createStudioWorkflow, getStudioSnapshot, searchMemory, writeMemory } from "@/lib/ai/studio-store";
import { resolveRequestActor } from "@/lib/platform/request-actor";

type StudioRequest =
 | { action:"create_skill"; name:string; slug:string; description:string; operation:"application_analysis"|"monthly_report"|"risk_summary"; riskLevel:"L0"|"L1"|"L2"|"L3"|"L4"|"L5" }
 | { action:"skill_action"; id:string; lifecycleAction:"sandbox"|"publish"|"install"|"uninstall"|"run"; expectedVersion:number; humanConfirmed?:boolean }
 | { action:"create_integration"; type:"plugin"|"mcp"; name:string; description:string; endpoint:string; authMode:"none"|"oauth2"|"mTLS"|"api-key-ref"; secretRef?:string; tools:string[] }
 | { action:"integration_action"; id:string; lifecycleAction:"test"|"publish"|"install"|"enable"|"disable"|"call"; expectedVersion:number; tool?:string; arguments?:Record<string,unknown>; humanConfirmed?:boolean }
 | { action:"create_memory"; name:string; description:string; scope:"private"|"role"; retentionDays:number }
 | { action:"memory_write"; namespaceId:string; content:string; tags:string[]; sensitivity:"P0"|"P1"|"P2"; source:string }
 | { action:"memory_search"; namespaceId:string; query:string; topK?:number }
 | { action:"create_workflow"; name:string; description:string; template:"analysis"|"reminder"|"knowledge_feedback"|"temporary_hardship_grant" }
 | { action:"workflow_action"; id:string; lifecycleAction:"validate"|"publish"|"install"|"uninstall"|"run"; expectedVersion:number; humanConfirmed?:boolean };

export async function GET(request:NextRequest){const actor=resolveRequestActor(request);if(!actor)return errorResponse("未完成身份认证",401);const snapshot=getStudioSnapshot(actor);if(!snapshot)return errorResponse("当前岗位无权访问 AI 资产工作室",403);return successResponse(snapshot)}
export async function POST(request:NextRequest){
 const actor=resolveRequestActor(request);if(!actor)return errorResponse("未完成身份认证",401);
 let body:StudioRequest;try{body=await request.json() as StudioRequest}catch{return errorResponse("请求参数格式无效",400)}
 if(!body||typeof body.action!=="string")return errorResponse("缺少操作类型",400);
 const key=request.headers.get("idempotency-key")??`${body.action}-${Date.now()}`;
 let result;
 try{
  switch(body.action){
   case"create_skill":result=createStudioSkill(actor,body,key);break;
   case"skill_action":result=actStudioSkill(actor,{id:body.id,action:body.lifecycleAction,expectedVersion:body.expectedVersion,humanConfirmed:body.humanConfirmed},key);break;
   case"create_integration":result=createStudioIntegration(actor,body,key);break;
   case"integration_action":result=actStudioIntegration(actor,{id:body.id,action:body.lifecycleAction,expectedVersion:body.expectedVersion,tool:body.tool,arguments:body.arguments,humanConfirmed:body.humanConfirmed},key);break;
   case"create_memory":result=createMemoryNamespace(actor,body,key);break;
   case"memory_write":result=writeMemory(actor,body,key);break;
   case"memory_search":result=searchMemory(actor,body);break;
   case"create_workflow":result=createStudioWorkflow(actor,body,key);break;
   case"workflow_action":result=actStudioWorkflow(actor,{id:body.id,action:body.lifecycleAction,expectedVersion:body.expectedVersion,humanConfirmed:body.humanConfirmed},key);break;
  }
 }catch(error){return errorResponse(error instanceof Error?error.message:"AI 资产操作失败",500)}
 if(result.success)return successResponse(result.data??{code:result.code},result.message);
 const status=result.code==="ROLE_DENIED"?403:result.code==="NOT_FOUND"?404:result.code==="VERSION_CONFLICT"?409:result.code==="CONFIRMATION_REQUIRED"?428:400;
 return errorResponse(`${result.code}: ${result.message}`,status)
}
