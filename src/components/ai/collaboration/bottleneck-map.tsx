'use client';

import type { SubTask } from './types';

interface BottleneckMapProps {
  subTasks: SubTask[];
  totalDuration?: number;
}

function getHeatColor(ratio: number): string {
  if (ratio < 0.3) return '#10B981'; // 绿色 - 正常
  if (ratio < 0.6) return '#F59E0B'; // 黄色 - 警告
  if (ratio < 0.85) return '#F97316'; // 橙色 - 危险
  return '#EF4444'; // 红色 - 阻塞
}

function getHeatBg(ratio: number): string {
  if (ratio < 0.3) return 'bg-green-500';
  if (ratio < 0.6) return 'bg-yellow-500';
  if (ratio < 0.85) return 'bg-orange-500';
  return 'bg-red-500';
}

export function BottleneckMap({ subTasks, totalDuration }: BottleneckMapProps) {
  const total = totalDuration || subTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const avgDuration = total / Math.max(subTasks.length, 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">瓶颈流热力图</h3>
          <p className="text-xs text-gray-500 mt-0.5">任务流转泳道 · 滞留时长染色 · 一眼识别协作断点</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">正常</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-gray-600">警告</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-gray-600">危险</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600">阻塞</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 时间轴 */}
        <div className="relative mb-3">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full" style={{ width: '100%' }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
            <span>0s</span>
            <span>平均滞留 {avgDuration.toFixed(1)}s</span>
            <span>{total.toFixed(0)}s</span>
          </div>
        </div>

        {/* 泳道 */}
        <div className="space-y-2">
          {subTasks.map((task, idx) => {
            const duration = task.duration || 0;
            const ratio = duration / Math.max(avgDuration * 2, 1);
            const heatColor = getHeatColor(ratio);
            const isBottleneck = ratio > 0.8;
            const widthPct = Math.max((duration / Math.max(total, 1)) * 100, 5);

            return (
              <div key={task.id} className="flex items-center gap-3 group">
                {/* 序号 */}
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600 flex-shrink-0">
                  {idx + 1}
                </div>

                {/* 任务名 */}
                <div className="w-28 text-xs text-gray-700 truncate flex-shrink-0" title={task.name}>
                  {task.name}
                </div>

                {/* 热力条 */}
                <div className="flex-1 relative h-7 bg-gray-50 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-700 relative overflow-hidden"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: heatColor,
                      opacity: task.status === 'pending' ? 0.3 : 0.85,
                    }}
                  >
                    {/* 流光效果 */}
                    {task.status === 'in_progress' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                    {/* 进度文字 */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] text-white font-medium drop-shadow-sm">
                        {duration.toFixed(1)}s
                      </span>
                    </div>
                  </div>

                  {/* 瓶颈标记 */}
                  {isBottleneck && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className="text-[10px] text-red-600 font-medium animate-pulse">⚠ 瓶颈</span>
                    </div>
                  )}
                </div>

                {/* 状态 */}
                <div className="w-16 text-right flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    task.status === 'done' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status === 'done' ? '完成' :
                     task.status === 'in_progress' ? '执行中' :
                     task.status === 'review' ? '待验收' :
                     task.status === 'rejected' ? '驳回' :
                     '待开始'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部汇总 */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-500">总耗时：</span>
              <span className="font-semibold text-gray-900">{total.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-gray-500">瓶颈数：</span>
              <span className="font-semibold text-red-600">
                {subTasks.filter(t => (t.duration || 0) > avgDuration * 1.5).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">完成率：</span>
              <span className="font-semibold text-green-600">
                {Math.round((subTasks.filter(t => t.status === 'done').length / Math.max(subTasks.length, 1)) * 100)}%
              </span>
            </div>
          </div>
          <div className="text-gray-400">
            按空格 + 点击成果可触发责任回溯
          </div>
        </div>
      </div>
    </div>
  );
}
