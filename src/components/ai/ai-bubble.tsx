"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Minimize2, Send, ShieldCheck, Sparkles, X, Maximize2 } from "lucide-react";

interface StepData {
  id: string;
  agent: string;
  agentAvatar: string;
  action: "thinking" | "executing" | "communicating" | "complete";
  title: string;
  detail: string;
  result?: string;
}

interface ConfirmationData {
  taskId: string;
  text: string;
  riskLevel: string;
  status: "pending" | "confirmed";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  steps?: StepData[];
  currentStepId?: string;
  status?: "running" | "complete";
  confirmation?: ConfirmationData;
  evidenceSummary?: string;
}

interface AvatarConfig {
  name: string;
  gradient: string;
}

const roleAvatars: Record<string, AvatarConfig> = {
  SYS_ADMIN: { name: "小海豚·智枢", gradient: "from-slate-700 to-blue-800" },
  AI_OPS: { name: "小海豚·灵枢", gradient: "from-violet-600 to-indigo-700" },
  SCHOOL_LEADER: { name: "小海豚·决策参谋", gradient: "from-blue-700 to-cyan-700" },
  FUND_LEADER: { name: "小海豚·资助参谋", gradient: "from-indigo-600 to-blue-700" },
  STU_AFFAIRS: { name: "小海豚·育人伙伴", gradient: "from-emerald-600 to-teal-700" },
  FUND_ADMIN: { name: "小海豚·业务管家", gradient: "from-blue-600 to-cyan-600" },
  FINANCE: { name: "小海豚·资金助手", gradient: "from-teal-600 to-cyan-700" },
  DEPT_ADMIN: { name: "小海豚·院系助手", gradient: "from-emerald-600 to-green-700" },
  COUNSELOR: { name: "小海豚·班级助手", gradient: "from-green-600 to-emerald-600" },
  STUDENT: { name: "小海豚·助学伙伴", gradient: "from-orange-500 to-rose-600" },
  BANK: { name: "小海豚·银校助手", gradient: "from-cyan-600 to-blue-700" },
  AUDIT_EXTERNAL: { name: "小海豚·审计协作员", gradient: "from-amber-600 to-orange-700" },
  EDU_BUREAU: { name: "小海豚·监管助手", gradient: "from-sky-700 to-indigo-700" },
  AUDITOR: { name: "小海豚·鉴真助手", gradient: "from-rose-600 to-orange-700" },
  DISCIPLINE: { name: "小海豚·廉洁助手", gradient: "from-red-700 to-rose-800" },
  PUBLIC_OPINION: { name: "小海豚·舆情助手", gradient: "from-fuchsia-600 to-violet-700" },
};

const defaultAvatar: AvatarConfig = roleAvatars.FUND_ADMIN;

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function getAuthorizationHeaders(): HeadersInit {
  const token = window.localStorage.getItem("token");
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

function getQuickCommands(role: string): string[] {
  if (role === "STUDENT") return ["查询我的资助申请进度", "资助申请需要准备哪些材料？"];
  if (role === "COUNSELOR" || role === "DEPT_ADMIN") return ["查询待审批申请", "生成审核建议草稿", "催办超时待办"];
  if (role === "FUND_ADMIN" || role === "FUND_LEADER") return ["查询待审批申请", "生成资助统计报表", "催办超时待办"];
  return ["生成资助统计报表", "查询待审批申请", "资助政策咨询"];
}

export function AIBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userRole, setUserRole] = useState("FUND_ADMIN");

  useEffect(() => {
    const userText = window.localStorage.getItem("user");
    if (!userText) return;
    try {
      const user = JSON.parse(userText) as { roles?: Array<{ code?: string }>; role?: string };
      const role = user.roles?.[0]?.code ?? user.role;
      if (role) setUserRole(role);
    } catch {
      setUserRole("FUND_ADMIN");
    }
  }, []);

  const avatar = roleAvatars[userRole] ?? defaultAvatar;

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 group" aria-label="打开小海豚智能助手">
          <span className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${avatar.gradient} text-3xl shadow-2xl transition-transform duration-300 group-hover:scale-110`}>
            🐬
            <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${avatar.gradient} animate-ping opacity-25`} />
            <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">AI</span>
          </span>
          <span className="pointer-events-none absolute right-20 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg group-hover:block">{avatar.name}</span>
        </button>
      )}
      {isOpen && (
        <section className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? "w-80" : "h-[680px] w-[450px] max-w-[calc(100vw-2rem)]"}`}>
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className={`flex items-center justify-between bg-gradient-to-r ${avatar.gradient} px-4 py-3 text-white`}>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">🐬</span><div><p className="font-semibold">{avatar.name}</p><p className="text-xs text-white/80">受控智能助手 · 在线</p></div></div>
              <div className="flex items-center gap-1"><button onClick={() => setIsMinimized((value) => !value)} className="rounded-lg p-1.5 hover:bg-white/20" aria-label="切换窗口大小">{isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}</button><button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 hover:bg-white/20" aria-label="关闭"><X size={16} /></button></div>
            </header>
            {!isMinimized && <ChatPanel userRole={userRole} avatar={avatar} />}
          </div>
        </section>
      )}
    </>
  );
}

function ChatPanel({ userRole, avatar }: { userRole: string; avatar: AvatarConfig }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", content: `您好，我是${avatar.name}。我会在您的授权范围内协助查询、生成草稿和处理重复性工作；涉及写入、审批、导出或资金操作时，会先经过护栏校验和人工确认。`, time: "现在", status: "complete" }]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSequenceRef = useRef(0);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const applyEvent = (messageId: string, raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const event = raw as { type?: unknown; data?: unknown };
    const type = typeof event.type === "string" ? event.type : "";
    const data = event.data && typeof event.data === "object" ? event.data as Record<string, unknown> : {};
    setMessages((current) => current.map((message) => {
      if (message.id !== messageId) return message;
      if (type === "step_start") {
        const step = data as unknown as StepData;
        return { ...message, steps: [...(message.steps ?? []), step], currentStepId: step.id };
      }
      if (type === "step_complete" && typeof data.id === "string") {
        return { ...message, steps: (message.steps ?? []).map((step) => step.id === data.id ? { ...step, result: typeof data.result === "string" ? data.result : "完成" } : step) };
      }
      if (type === "answer_chunk" && typeof data.accumulated === "string") return { ...message, content: data.accumulated };
      if (type === "confirmation_required" && typeof data.taskId === "string" && typeof data.text === "string") return { ...message, status: "complete", confirmation: { taskId: data.taskId, text: data.text, riskLevel: typeof data.riskLevel === "string" ? data.riskLevel : "L3", status: "pending" } };
      if (type === "execution_result" && typeof data.evidenceSummary === "string") return { ...message, evidenceSummary: data.evidenceSummary };
      if (type === "error") return { ...message, content: typeof data.message === "string" ? data.message : "任务执行失败。", status: "complete" };
      if (type === "done") return { ...message, status: "complete", currentStepId: undefined };
      return message;
    }));
  };

  const consumeStream = async (response: Response, messageId: string) => {
    if (!response.ok || !response.body) throw new Error("AI_REQUEST_FAILED");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        if (!block.startsWith("data: ")) continue;
        try { applyEvent(messageId, JSON.parse(block.slice(6)) as unknown); } catch { /* 忽略非法事件 */ }
      }
    }
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isRunning) return;
    messageSequenceRef.current += 1;
    const sequence = messageSequenceRef.current;
    const assistantId = `a-${sequence}`;
    setMessages((current) => [...current, { id: `u-${sequence}`, role: "user", content: trimmed, time: getCurrentTime() }, { id: assistantId, role: "assistant", content: "", time: getCurrentTime(), steps: [], status: "running" }]);
    setInput("");
    setIsRunning(true);
    try {
      const response = await fetch("/api/ai/command", { method: "POST", headers: getAuthorizationHeaders(), body: JSON.stringify({ message: trimmed }) });
      await consumeStream(response, assistantId);
    } catch {
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: "连接智能服务失败。请确认演示登录状态和模型配置后重试。", status: "complete" } : message));
    } finally { setIsRunning(false); }
  };

  const confirmTask = async (messageId: string, taskId: string) => {
    if (isRunning) return;
    setIsRunning(true);
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, content: "", steps: [], status: "running", confirmation: message.confirmation ? { ...message.confirmation, status: "confirmed" } : undefined } : message));
    try {
      const response = await fetch(`/api/ai/command/${taskId}/confirm`, { method: "POST", headers: getAuthorizationHeaders(), body: JSON.stringify({ confirmed: true }) });
      await consumeStream(response, messageId);
    } catch {
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, content: "确认执行失败，系统未写入业务数据。", status: "complete" } : message));
    } finally { setIsRunning(false); }
  };

  return <>
    <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-4">
      {messages.map((message) => <MessageBubble key={message.id} message={message} avatar={avatar} onConfirm={confirmTask} />)}
      <div ref={messagesEndRef} />
    </div>
    {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-2">{getQuickCommands(userRole).map((command) => <button key={command} onClick={() => sendMessage(command)} disabled={isRunning} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">{command}</button>)}</div>}
    <div className="border-t border-slate-100 bg-white p-3"><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-400 focus-within:bg-white"><Sparkles size={16} className="shrink-0 text-blue-500" /><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void sendMessage(input); } }} disabled={isRunning} placeholder={isRunning ? "小海豚正在执行受控任务…" : "输入问题或操作指令…"} className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" /><button onClick={() => void sendMessage(input)} disabled={isRunning || !input.trim()} className={`rounded-lg p-1.5 ${input.trim() && !isRunning ? `bg-gradient-to-r ${avatar.gradient} text-white shadow` : "bg-slate-200 text-slate-400"}`} aria-label="发送"><Send size={15} /></button></div></div>
  </>;
}

function MessageBubble({ message, avatar, onConfirm }: { message: ChatMessage; avatar: AvatarConfig; onConfirm: (messageId: string, taskId: string) => Promise<void> }) {
  if (message.role === "user") return <div className="flex justify-end"><div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow"><p className="whitespace-pre-wrap">{message.content}</p><p className="mt-1 text-right text-[10px] text-white/65">{message.time}</p></div></div>;
  return <div className="flex gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatar.gradient} text-lg shadow`}>{message.status === "running" ? <LoaderCircle className="h-4 w-4 animate-spin text-white" /> : "🐬"}</span><div className="max-w-[86%] flex-1 space-y-2">
    {message.steps && message.steps.length > 0 && <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="flex items-center gap-1 text-xs font-medium text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />受控任务轨迹</p>{message.steps.map((step) => <div key={step.id} className="rounded-lg bg-slate-50 p-2"><p className="text-xs font-medium text-slate-700">{step.agentAvatar} {step.agent} · {step.title}</p><p className="mt-0.5 text-[11px] text-slate-500">{step.detail}</p>{step.result && <p className="mt-1 text-[11px] text-emerald-700">✓ {step.result}</p>}</div>)}</div>}
    {message.content && <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{message.content}</p><p className="mt-1 text-[10px] text-slate-400">{message.time}</p></div>}
    {message.confirmation && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-800">{message.confirmation.riskLevel} 人工确认节点</p><p className="mt-1 text-xs leading-relaxed text-amber-700">{message.confirmation.text}</p><button onClick={() => void onConfirm(message.id, message.confirmation!.taskId)} disabled={message.confirmation.status === "confirmed"} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"><CheckCircle2 className="h-3.5 w-3.5" />{message.confirmation.status === "confirmed" ? "已确认" : "确认并执行"}</button></div>}
    {message.evidenceSummary && <p className="rounded-lg bg-slate-100 px-2 py-1.5 text-[11px] text-slate-500">审计依据：{message.evidenceSummary}</p>}
  </div></div>;
}
