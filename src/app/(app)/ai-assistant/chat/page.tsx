"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  RefreshCw,
  BookOpen,
  HelpCircle,
  FileText,
  Settings,
} from "lucide-react";

interface ConversationItem { id: string; title: string; updatedAt: string; messageCount: number }
interface StoredMessage { id: string; role: string; content: string; createdAt: string; toolName?: string }
interface ReadCard { name: string; result: Record<string, unknown>; success: boolean }
function visibleMessages(items: StoredMessage[]): Message[] {
  let lastTool: ReadCard | undefined;
  const output: Message[] = [];
  for (const item of items) {
    if (item.role === "tool") {
      try { lastTool = { name:item.toolName ?? "已授权查询", result:JSON.parse(item.content) as Record<string,unknown>, success:(JSON.parse(item.content) as {__toolSuccess?:boolean}).__toolSuccess !== false }; } catch { lastTool=undefined; }
      continue;
    }
    if (item.role !== "user" && item.role !== "assistant") continue;
    output.push({id:item.id,role:item.role,content:item.content,time:new Date(item.createdAt).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}),
      ...(item.role === "assistant" && lastTool ? {tool:lastTool} : {})});
    if (item.role === "assistant") lastTool=undefined;
  }
  return output;
}
function ReadResultCard({ card }: {card:ReadCard}) {
  const rows = Array.isArray(card.result.applications) ? card.result.applications : Array.isArray(card.result.projects) ? card.result.projects : card.result.application ? [card.result.application] : [];
  return <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-gray-700" aria-label="受控工具查询结果">
    <p className="font-semibold">{card.success ? "已授权查询结果" : "查询未通过权限或业务校验"}</p>
    {rows.slice(0,8).map((row,index) => {
      if (!row || typeof row !== "object") return null;
      const item=row as Record<string,unknown>;
      return <p key={String(item.id ?? item.code ?? index)} className="mt-1 border-t border-blue-100 pt-1">
        {String(item.projectName ?? item.name ?? "资助记录")} · {String(item.status ?? item.applicationStart ?? "")}
        {typeof item.materialCompleteness === "number" ? ` · 材料 ${item.materialCompleteness}%` : ""}
      </p>;
    })}
  </div>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  tool?: ReadCard;
  error?: boolean;
}

const quickQuestions = [
  { icon: HelpCircle, text: "如何申请国家奖学金？", color: "from-blue-500 to-blue-600" },
  { icon: FileText, text: "资助申请需要哪些材料？", color: "from-emerald-500 to-emerald-600" },
  { icon: BookOpen, text: "你是谁？能帮我做什么？", color: "from-violet-500 to-violet-600" },
  { icon: Settings, text: "审批流程是怎样的？", color: "from-orange-500 to-orange-600" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSequenceRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const refreshConversations = async () => {
    const response = await fetch('/api/ai/conversations', { headers: authHeaders(), cache: 'no-store' });
    if (!response.ok) throw new Error('CONVERSATION_LIST_FAILED');
    const data = await response.json() as { conversations: ConversationItem[] };
    setConversations(data.conversations);
    return data.conversations;
  };
  const switchConversation = async (id: string) => {
    if (loading) return;
    const response = await fetch(`/api/ai/conversations/${id}`, { headers: authHeaders(), cache: 'no-store' });
    if (!response.ok) throw new Error('CONVERSATION_ACCESS_DENIED');
    const data = await response.json() as { messages: StoredMessage[] };
    setActiveConversationId(id);
    setMessages(visibleMessages(data.messages));
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const list = await fetch('/api/ai/conversations', { headers, cache: 'no-store' });
        if (!list.ok) return;
        const data = await list.json() as { conversations: ConversationItem[] };
        if (!mounted) return;
        setConversations(data.conversations);
        if (!data.conversations.length) return;
        const chosen = data.conversations[0];
        const result = await fetch(`/api/ai/conversations/${chosen.id}`, { headers, cache: 'no-store' });
        if (!result.ok || !mounted) return;
        const snapshot = await result.json() as { messages: StoredMessage[] };
        if (!mounted) return;
        setActiveConversationId(chosen.id);
        setMessages(visibleMessages(snapshot.messages));
      } catch { /* Unauthenticated sessions are handled by the API. */ }
    })();
    return () => { mounted = false; };
  }, []);
  const newConversation = async () => {
    if (loading) return;
    try {
      const response = await fetch('/api/ai/conversations', { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ sceneTag: 'general' }) });
      if (!response.ok) throw new Error('CREATE_FAILED');
      const data = await response.json() as { conversation: ConversationItem };
      setActiveConversationId(data.conversation.id); setMessages([]);
      await refreshConversations();
    } catch { alert('新建会话失败，请稍后重试。'); }
  };
  const renameConversation = async (id: string, current: string) => {
    const title = prompt('修改会话标题', current)?.trim();
    if (!title) return;
    const response = await fetch(`/api/ai/conversations/${id}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    if (response.ok) await refreshConversations(); else alert('重命名失败。');
  };
  const deleteConversation = async (id: string) => {
    if (!confirm('确定删除此会话吗？删除后将不再显示。')) return;
    const response = await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!response.ok) { alert('删除失败。'); return; }
    const list = await refreshConversations();
    if (activeConversationId === id) {
      setActiveConversationId(null); setMessages([]);
      if (list.length) await switchConversation(list[0].id);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    messageSequenceRef.current += 1;
    const requestSequence = messageSequenceRef.current;
    const userMessage: Message = {
      id: `user-${requestSequence}`,
      role: "user",
      content: content.trim(),
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStatusText("正在理解您的问题…");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim(), ...(activeConversationId ? { conversationId: activeConversationId } : {}) }),
      });

      if (!response.ok) throw new Error("请求失败");

      setStatusText("正在验证权限并查询可用资料…");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const assistantMessage: Message = {
        id: `assistant-${requestSequence}`,
        role: "assistant",
        content: "",
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (typeof json.conversationId === 'string') setActiveConversationId(json.conversationId);
              if (json.tool && json.toolResult && typeof json.toolResult === 'object') {
                setMessages(prev=>prev.map(msg=>msg.id === assistantMessage.id ? {...msg,tool:{name:String(json.tool),result:json.toolResult as Record<string,unknown>,success:json.toolSuccess === true}}:msg));
              }
              if (json.content || json.error) {
                const visibleText = typeof json.error === "string" ? json.error : json.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + visibleText }
                      : msg
                  )
                );
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
      await refreshConversations();
    } catch (error) {
      console.error("发送消息失败:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${requestSequence}`,
          role: "assistant",
          content: "抱歉，查询暂不可用。未执行任何业务操作，请稍后重试或到业务页面核对。",
          error:true,
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearMessages = () => { void newConversation(); };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">小海豚智能助手</h1>
          <p className="text-gray-500 mt-1">资助政策问答、申请指导、智能推荐</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            清空对话
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* 对话区域 */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
          {messages.length === 0 ? (
            /* 欢迎界面 */
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">您好，我是小海豚</h2>
              <p className="text-gray-500 text-center max-w-md mb-8">
                我可以帮您解答资助政策、指导申请流程、推荐合适的资助项目。请问有什么可以帮您的？
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {quickQuestions.map((q, index) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(q.text)}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-left"
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${q.color} rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-700 line-clamp-2">{q.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 消息列表 */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-violet-500 to-violet-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        message.role === "user"
                          ? "bg-blue-500 text-white rounded-tr-sm"
                          : message.error ? "bg-red-50 text-red-700 rounded-tl-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.tool && <ReadResultCard card={message.tool} />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{message.time}</span>
                      {message.role === "assistant" && (
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="p-0.5 hover:bg-gray-100 rounded"
                        >
                          {copiedId === message.id ? (
                            <CheckIcon className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3" role="status" aria-live="polite">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm">
                    <p className="text-xs text-gray-500 mb-1">{statusText}</p>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="输入您的问题..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
          </div>
        </div>

        {/* 右侧信息面板 */}
        <div className="w-64 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">我的会话</h3>
              <button onClick={() => void newConversation()} className="text-sm text-blue-600" title="新建会话">新建</button>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-2">
              {conversations.map((item) => (
                <div key={item.id} className={`flex items-center rounded-lg px-2 py-1 ${activeConversationId === item.id ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <button className="flex-1 min-w-0 truncate text-left text-sm" title={item.title} onClick={() => void switchConversation(item.id)}>{item.title}</button>
                  <button className="ml-1 text-xs text-gray-500" title="重命名" onClick={() => void renameConversation(item.id, item.title)}>改</button>
                  <button className="ml-1 text-xs text-red-500" title="删除" onClick={() => void deleteConversation(item.id)}>删</button>
                </div>
              ))}
              {!conversations.length && <p className="text-xs text-gray-500">尚无历史会话</p>}
            </div>
          </div>
          {/* 功能说明 */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI能力
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                资助政策问答
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                申请流程指导
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                材料清单查询
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                智能资助推荐
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                审批进度查询
              </li>
            </ul>
          </div>

          {/* 对话统计 */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">对话统计</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">提问次数</span>
                <span className="font-medium text-gray-800">{messages.filter(m => m.role === "user").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">回复次数</span>
                <span className="font-medium text-gray-800">{messages.filter(m => m.role === "assistant").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
