'use client';

import type { Agent } from './types';

interface AgentStatusRingProps {
  agent: Agent;
  compact?: boolean;
}

export function AgentStatusRing({ agent, compact }: AgentStatusRingProps) {
  const { progress, quality, workload, maxWorkload, status, color } = agent;
  const size = compact ? 80 : 110;
  const strokeWidth = compact ? 5 : 7;
  const center = size / 2;

  // 三层环的半径
  const outerR = center - strokeWidth; // 负载
  const midR = outerR - strokeWidth - 2; // 质量
  const innerR = midR - strokeWidth - 2; // 进度

  const circumference = (r: number) => 2 * Math.PI * r;
  const arc = (r: number, pct: number) => circumference(r) * (pct / 100);

  const statusColor = {
    idle: '#9CA3AF',
    thinking: '#8B5CF6',
    working: '#3B82F6',
    reviewing: '#F59E0B',
    done: '#10B981',
    blocked: '#EF4444',
  }[status];

  const qualityColor = quality >= 90 ? '#10B981' : quality >= 70 ? '#F59E0B' : '#EF4444';
  const loadPct = (workload / maxWorkload) * 100;
  const loadColor = loadPct >= 90 ? '#EF4444' : loadPct >= 60 ? '#F59E0B' : '#10B981';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* 外圈：负载 */}
          <circle cx={center} cy={center} r={outerR} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={outerR} fill="none"
            stroke={loadColor} strokeWidth={strokeWidth}
            strokeDasharray={`${arc(outerR, loadPct)} ${circumference(outerR)}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />

          {/* 中圈：质量 */}
          <circle cx={center} cy={center} r={midR} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={midR} fill="none"
            stroke={qualityColor} strokeWidth={strokeWidth}
            strokeDasharray={`${arc(midR, quality)} ${circumference(midR)}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />

          {/* 内圈：进度 */}
          <circle cx={center} cy={center} r={innerR} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={innerR} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${arc(innerR, progress)} ${circumference(innerR)}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>

        {/* 中心头像 */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ top: 0, left: 0 }}
        >
          <div className="flex flex-col items-center">
            <span className={compact ? 'text-xl' : 'text-2xl'}>{agent.avatar}</span>
            {status === 'working' && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            )}
            {status === 'done' && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full" />
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs font-medium text-gray-900 truncate max-w-24">{agent.name}</div>
        <div className="text-[10px] text-gray-500 capitalize">{status}</div>
      </div>

      {!compact && (
        <div className="w-full space-y-1 text-[10px]">
          <div className="flex justify-between text-gray-600">
            <span>进度</span>
            <span className="font-medium" style={{ color }}>{progress}%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>质量</span>
            <span className="font-medium" style={{ color: qualityColor }}>{quality}%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>负载</span>
            <span className="font-medium" style={{ color: loadColor }}>{workload}/{maxWorkload}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusLabel = {
    idle: '空闲',
    thinking: '思考中',
    working: '执行中',
    reviewing: '审核中',
    done: '已完成',
    blocked: '阻塞',
  }[agent.status];

  const statusDot = {
    idle: 'bg-gray-400',
    thinking: 'bg-purple-500 animate-pulse',
    working: 'bg-blue-500 animate-pulse',
    reviewing: 'bg-yellow-500',
    done: 'bg-green-500',
    blocked: 'bg-red-500',
  }[agent.status];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${agent.color}15` }}
          >
            {agent.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{agent.name}</div>
            <div className="text-[10px] text-gray-500">{agent.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className="text-[10px] text-gray-500">{statusLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-around mb-3">
        <AgentStatusRing agent={agent} compact />
      </div>

      <div className="flex flex-wrap gap-1">
        {agent.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* 状态条 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>总进度</span>
          <span className="font-medium text-gray-700">{agent.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${agent.progress}%`, backgroundColor: agent.color }}
          />
        </div>
      </div>
    </div>
  );
}
