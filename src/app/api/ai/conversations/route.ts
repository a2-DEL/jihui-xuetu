import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestActor } from '@/lib/platform/request-actor';
import { conversationRepository } from '@/lib/ai/conversation-memory-store';
export const runtime = 'nodejs';
function actorFor(request: NextRequest) { return process.env.NODE_ENV === 'production' ? null : resolveRequestActor(request); }
export async function GET(request: NextRequest) {
  const actor = actorFor(request);
  if (!actor) return NextResponse.json({ success: false, message: '未完成身份认证或生产入口尚未开放' }, { status: 401 });
  try { return NextResponse.json({ success: true, conversations: await conversationRepository().list(actor) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ success: false, message: '会话读取暂不可用' }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  const actor = actorFor(request);
  if (!actor) return NextResponse.json({ success: false, message: '未完成身份认证或生产入口尚未开放' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, message: '请求格式不正确' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: '请求格式不正确' }, { status: 400 });
  const tag = (body as { sceneTag?: unknown }).sceneTag;
  if (tag !== undefined && (typeof tag !== 'string' || !/^[a-z0-9_-]{1,60}$/.test(tag))) return NextResponse.json({ success: false, message: '场景标识无效' }, { status: 400 });
  try { return NextResponse.json({ success: true, conversation: await conversationRepository().create(actor, tag as string | undefined) }, { status: 201, headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ success: false, message: '会话创建暂不可用' }, { status: 503 }); }
}
