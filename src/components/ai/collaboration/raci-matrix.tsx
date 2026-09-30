'use client';

import { useState } from 'react';
import type { Agent, SubTask, RACIRole } from './types';

interface RACIMatrixProps {
  agents: Agent[];
  subTasks: SubTask[];
  onTaskClick?: (taskId: string) => void;
  traceBackMode?: boolean;
  traceBackTaskId?: string | null;
  highlightedAgent?: string | null;
}

const RACI_CONFIG: Record<NonNullable<RACIRole>, { label: string; color: string; bg: string }> = {
  R: { label: 'R 负责执行', color: 'text-white', bg: 'bg-blue-500' },
  A: { label: 'A 批准决策', color: 'text-white', bg: 'bg-purple-500' },
  C: { label: 'C 提供咨询', color: 'text-blue-900', bg: 'bg-blue-100' },
  I: { label: 'I 被告知', color: 'text-gray-600', bg: 'bg-gray-50' },
};

const TASK_STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  pending: { dot: 'bg-gray-400', label: '待开始' },
  in_progress: { dot: 'bg-blue-500 animate-pulse', label: '进行中' },
  review: { dot: 'bg-yellow-500', label: '待验收' },
  done: { dot: 'bg-green-500', label: '已完成' },
  rejected: { dot: 'bg-red-500', label: '已驳回' },
};

export function RACIMatrix({ agents, subTasks, onTaskClick, traceBackMode, traceBackTaskId, highlightedAgent }: RACIMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ agentId: string; taskId: string } | null>(null);

  const getCellStyle = (role: RACIRole | null, agentId: string, taskId: string, taskStatus: string) => {
    const isHovered = hoveredCell?.agentId === agentId && hoveredCell?.taskId === taskId;
    const isTraceBack = traceBackMode && traceBackTaskId === taskId;
    const isHighlighted = highlightedAgent === agentId;

    if (!role) return 'bg-gray-50/50';

    const base = RACI_CONFIG[role].bg;
    const opacity = taskStatus === 'pending' ? 'opacity-40' : 'opacity-100';
    const hover = isHovered ? 'ring-2 ring-offset-1 ring-blue-400 scale-105' : '';
    const trace = isTraceBack ? 'ring-2 ring-yellow-400 animate-pulse' : '';
    const highlight = isHighlighted ? 'ring-2 ring-offset-1 ring-purple-400' : '';

    return `${base} ${opacity} ${hover} ${trace} ${highlight} transition-all duration-300`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">动态 RACI 责任矩阵</h3>
          <p className="text-xs text-gray-500 mt-0.5">任务-角色热力网格 · 实时责任归属</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(RACI_CONFIG).map(([role, cfg]) => (
            <div key={role} className="flex items-center gap-1 text-xs">
              <div className={`w-3 h-3 rounded ${cfg.bg}`} />
              <span className="text-gray-600">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="sticky left-0 bg-gray-50 px-4 py-2.5 text-left text-xs font-medium text-gray-600 w-44 border-r border-gray-100">
                Agent / 子任务 →
              </th>
              {subTasks.map((task) => {
                const style = TASK_STATUS_STYLE[task.status];
                return (
                  <th
                    key={task.id}
                    className="px-2 py-2.5 text-center text-xs font-medium text-gray-700 min-w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onTaskClick?.(task.id)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span className="truncate max-w-20">{task.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">#{task.order}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="sticky left-0 bg-white px-4 py-2.5 border-r border-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{agent.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{agent.title.split('/')[0].trim()}</div>
                    </div>
                  </div>
                </td>
                {subTasks.map((task) => {
                  const role = task.raci?.[agent.id];
                  const isAssignee = task.assigneeId === agent.id;

                  return (
                    <td key={task.id} className="px-1.5 py-1.5 text-center">
                      <div
                        className={`relative w-full h-10 rounded-md flex items-center justify-center cursor-pointer ${getCellStyle(role || null, agent.id, task.id, task.status)}`}
                        onMouseEnter={() => setHoveredCell({ agentId: agent.id, taskId: task.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {role && (
                          <span className={`text-xs font-bold ${RACI_CONFIG[role].color}`}>
                            {role}
                          </span>
                        )}
                        {isAssignee && task.status === 'in_progress' && (
                          <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                            <div
                              className="absolute inset-y-0 left-0 bg-white/20 animate-sweep"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}
                        {isAssignee && task.status === 'review' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredCell && (() => {
        const task = subTasks.find(t => t.id === hoveredCell.taskId);
        const agent = agents.find(a => a.id === hoveredCell.agentId);
        const role = task?.raci?.[hoveredCell.agentId];
        if (!task || !agent || !role) return null;

        return (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 flex items-center gap-4">
            <span><b className="text-gray-900">{agent.name}</b> 在 <b className="text-gray-900">{task.name}</b> 中担任</span>
            <span className={`px-2 py-0.5 rounded ${RACI_CONFIG[role].bg} ${RACI_CONFIG[role].color} font-medium`}>
              {RACI_CONFIG[role].label}
            </span>
            {task.assigneeId === hoveredCell.agentId && (
              <span className="text-blue-600">· 当前负责人 · 进度 {task.progress || 0}%</span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
