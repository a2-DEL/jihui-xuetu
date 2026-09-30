import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestActor } from '@/lib/platform/request-actor';
import { conversationRepository } from '@/lib/ai/conversation-memory-store';
export const runtime = 'nodejs';
type Params = { params: Promise<{ id: string }> };
async function identify(request: NextRequest, context: Params) {
  const actor = process.env.NODE_ENV === 'production' ? null : resolveRequestActor(request);
  const { id } = await context.params;
  return { actor, id: /^[0-9a-f-]{36}$/i.test(id) ? id : null };
}
const notFound = () => NextResponse.json({ success: false, message: '会话不存在或无权访问' }, { status: 404 });
export async function GET(request: NextRequest, context: Params) {
  const { actor, id } = await identify(request, context);
  if (!actor) return NextResponse.json({ success: false, message: '未完成身份认证' }, { status: 401 });
  if (!id) return notFound();
  try { const snapshot = await conversationRepository().get(actor, id);
    return snapshot ? NextResponse.json({ success: true, ...snapshot }, { headers: { 'Cache-Control': 'no-store' } }) : notFound(); }
  catch { return NextResponse.json({ success: false, message: '会话读取暂不可用' }, { status: 503 }); }
}
export async function PATCH(request: NextRequest, context: Params) {
  const { actor, id } = await identify(request, context);
  if (!actor) return NextResponse.json({ success: false, message: '未完成身份认证' }, { status: 401 });
  if (!id) return notFound();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: '请求格式不正确' }, { status: 400 }); }
  const title = body && typeof body === 'object' && !Array.isArray(body) ? (body as { title?: unknown }).title : undefined;
  if (typeof title !== 'string' || !title.trim() || title.length > 80) return NextResponse.json({ success: false, message: '标题长度须为1至80字' }, { status: 400 });
  try { const conversation = await conversationRepository().rename(actor, id, title);
    return conversation ? NextResponse.json({ success: true, conversation }, { headers: { 'Cache-Control': 'no-store' } }) : notFound(); }
  catch { return NextResponse.json({ success: false, message: '标题更新暂不可用' }, { status: 503 }); }
}
export async function DELETE(request: NextRequest, context: Params) {
  const { actor, id } = await identify(request, context);
  if (!actor) return NextResponse.json({ success: false, message: '未完成身份认证' }, { status: 401 });
  if (!id) return notFound();
  try { return await conversationRepository().softDelete(actor, id)
    ? NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } }) : notFound(); }
  catch { return NextResponse.json({ success: false, message: '会话删除暂不可用' }, { status: 503 }); }
}
