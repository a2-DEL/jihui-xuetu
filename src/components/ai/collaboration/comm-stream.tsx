'use client';

import { useState } from 'react';
import type { CommRecord, Agent } from './types';

interface CommStreamProps {
  communications: CommRecord[];
  agents: Agent[];
  onTraceBack?: (commId: string) => void;
}

const COMM_TYPE_CONFIG = {
  sync: { label: '同步站会', icon: '🎯', color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-500' },
  async: { label: '异步沟通', icon: '💬', color: 'border-gray-300 bg-gray-50', badge: 'bg-gray-500' },
  decision: { label: '决策记录', icon: '⚖️', color: 'border-purple-300 bg-purple-50', badge: 'bg-purple-500' },
  handover: { label: '签署移交', icon: '🤝', color: 'border-green-300 bg-green-50', badge: 'bg-green-500' },
};

export function CommStream({ communications, agents, onTraceBack }: CommStreamProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name || id;
  const getAgentAvatar = (id: string) => agents.find(a => a.id === id)?.avatar || '🤖';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">结构化沟通流</h3>
          <p className="text-xs text-gray-500 mt-0.5">会议纪要 · 决策链 · 签署移交</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(COMM_TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${cfg.badge}`} />
              <span className="text-gray-600">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {communications.map((comm) => {
          const cfg = COMM_TYPE_CONFIG[comm.type];
          const isExpanded = expandedId === comm.id;

          return (
            <div
              key={comm.id}
              className={`border-l-4 ${cfg.color} transition-all`}
            >
              <div
                className="px-4 py-3 cursor-pointer hover:bg-white/50"
                onClick={() => setExpandedId(isExpanded ? null : comm.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-base flex-shrink-0">{cfg.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-900">{comm.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.badge} text-white`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{comm.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex -space-x-1">
                          {comm.participants.slice(0, 3).map((pid) => (
                            <span key={pid} className="text-xs" title={getAgentName(pid)}>
                              {getAgentAvatar(pid)}
                            </span>
                          ))}
                          {comm.participants.length > 3 && (
                            <span className="text-[10px] text-gray-500">+{comm.participants.length - 3}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{formatTime(comm.timestamp)}</span>
                        {comm.duration && (
                          <span className="text-[10px] text-gray-400">· 时长 {comm.duration}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-3 pt-1 bg-white/80 border-t border-gray-100">
                  {/* 决策记录 */}
                  {comm.decision && (
                    <div className="mb-3 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-[10px] font-semibold text-purple-700 mb-1">📌 最终决议</div>
                      <div className="text-xs text-purple-900">{comm.decision}</div>
                    </div>
                  )}

                  {/* 论证链 */}
                  {comm.reasoning && comm.reasoning.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-semibold text-gray-700 mb-1.5">📎 决策依据（论证链）</div>
                      <div className="space-y-1.5">
                        {comm.reasoning.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400 flex-shrink-0 mt-0.5">{i + 1}.</span>
                            <div>
                              <span className="text-gray-500">前提：</span>
                              <span className="text-gray-700">{r.premise}</span>
                              <span className="text-gray-400 mx-1">→</span>
                              <span className="text-gray-500">结论：</span>
                              <span className="text-gray-900 font-medium">{r.conclusion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 待办项 */}
                  {comm.actionItems && comm.actionItems.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-semibold text-gray-700 mb-1.5">✅ Action Items</div>
                      <div className="space-y-1">
                        {comm.actionItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={item.done ? 'text-green-500' : 'text-gray-400'}>
                              {item.done ? '✓' : '○'}
                            </span>
                            <span className="text-gray-500">{getAgentName(item.agentId)}：</span>
                            <span className={`text-gray-700 ${item.done ? 'line-through text-gray-400' : ''}`}>
                              {item.task}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 签署移交 */}
                  {comm.handover && (
                    <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-[10px] font-semibold text-green-700 mb-1.5">🤝 签署移交</div>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="font-medium text-gray-900">
                          {getAgentAvatar(comm.handover.from)} {getAgentName(comm.handover.from)}
                        </span>
                        <span className="text-green-600">→</span>
                        <span className="font-medium text-gray-900">
                          {getAgentAvatar(comm.handover.to)} {getAgentName(comm.handover.to)}
                        </span>
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                          comm.handover.status === 'accepted' ? 'bg-green-500 text-white' :
                          comm.handover.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {comm.handover.status === 'accepted' ? '已验收' :
                           comm.handover.status === 'rejected' ? '已驳回' : '待验收'}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600">
                        <span className="font-medium">交付物：</span>
                        {comm.handover.deliverables.join('、')}
                      </div>
                      {comm.handover.feedback && (
                        <div className="text-[10px] text-gray-600 mt-1">
                          <span className="font-medium">反馈：</span>
                          {comm.handover.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {onTraceBack && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onTraceBack(comm.id); }}
                      className="mt-2 text-[10px] text-blue-600 hover:text-blue-800"
                    >
                      🔍 责任回溯
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
