import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as command } from '../src/app/api/ai/command/route';
import { POST as confirm } from '../src/app/api/ai/command/[taskId]/confirm/route';
import { POST as chat } from '../src/app/api/ai/chat/route';

process.env.MODEL_EXTERNAL_CALLS_ENABLED = 'false';
function request(url: string, message: unknown, token?: string) {
  return new NextRequest(url, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(message) });
}
function events(text: string): Array<{ type: string; data?: Record<string, unknown> }> {
  return text.split('\n\n').filter((part) => part.startsWith('data: ')).map((part) => JSON.parse(part.slice(6)) as { type: string; data?: Record<string, unknown> });
}
async function main() {
  const url = 'http://localhost/api/ai/command';
  const invalid = await command(request(url, null, 'demo-counselor'));
  assert.equal(invalid.status, 400);
  const anon = await command(request(url, { message: '查询申请列表' }));
  assert.equal(anon.status, 401);
  const created = await command(request(url, { message: '查询申请列表' }, 'demo-counselor'));
  assert.equal(created.status, 200);
  const first = events(await created.text());
  const id = first.find((event) => event.type === 'confirmation_required')?.data?.taskId;
  assert.equal(typeof id, 'string');
  assert(first.some((event) => event.type === 'done'));
  const endpoint = `${url}/${id}/confirm`;
  const unauthorized = await confirm(request(endpoint, { confirmed: true }, 'demo-student'), { params: Promise.resolve({ taskId: id as string }) });
  assert(events(await unauthorized.text()).some((event) => event.type === 'error'));
  const badConfirm = await confirm(request(endpoint, null, 'demo-counselor'), { params: Promise.resolve({ taskId: id as string }) });
  assert.equal(badConfirm.status, 400);
  const accepted = await confirm(request(endpoint, { confirmed: true }, 'demo-counselor'), { params: Promise.resolve({ taskId: id as string }) });
  const done = events(await accepted.text());
  assert(done.some((event) => event.type === 'execution_result' && event.data?.success === true));
  const replay = await confirm(request(endpoint, { confirmed: true }, 'demo-counselor'), { params: Promise.resolve({ taskId: id as string }) });
  assert(events(await replay.text()).some((event) => event.type === 'error' && event.data?.code === 'TASK_ALREADY_EXECUTED'));
  const badChat = await chat(request('http://localhost/api/ai/chat', null, 'demo-student'));
  assert.equal(badChat.status, 400);
  const localChat = await chat(request('http://localhost/api/ai/chat', { message: '国家助学金的申请流程是什么？' }, 'demo-student'));
  assert.equal(localChat.status, 200);
  const localEvents = events(await localChat.text()) as Array<{ content?: string; error?: string }>;
  assert(localEvents.some((event) => typeof event.content === 'string' && event.content.includes('演示模式·本地知识摘录')));
  assert(!localEvents.some((event) => event.error));
  const deniedChat = await chat(request('http://localhost/api/ai/chat', { message: '国家助学金政策' }));
  assert.equal(deniedChat.status, 401);
  console.log(JSON.stringify({ commandSse: 'passed', authorization: 'passed', confirmation: 'passed', replay: 'blocked', localChat: 'explicit-demo-rag', externalModel: 'disabled' }));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
