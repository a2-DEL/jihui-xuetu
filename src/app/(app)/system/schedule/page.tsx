"use client";

import React, { useState } from "react";
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Timer,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
  Bot,
  Database,
  Brain,
  FileText,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  type: "ciac" | "federated" | "model_monitor" | "knowledge" | "backup" | "sync";
  cron: string;
  cron_desc: string;
  status: "running" | "paused" | "success" | "failed";
  last_run: string;
  next_run: string;
  duration: number;
  success_rate: number;
  total_runs: number;
  enabled: boolean;
}

interface TaskExecution {
  id: string;
  task_id: string;
  task_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: "success" | "failed" | "running";
  error_msg?: string;
  logs?: string;
}

const mockTasks: ScheduledTask[] = [
  {
    id: "t1",
    name: "CIAC系数计算",
    description: "每日凌晨计算全校CIAC系数，若CIAC>0.3则推送告警",
    type: "ciac",
    cron: "0 3 * * *",
    cron_desc: "每日 03:00",
    status: "success",
    last_run: "2026-06-05 03:00:00",
    next_run: "2026-06-06 03:00:00",
    duration: 456,
    success_rate: 98.5,
    total_runs: 156,
    enabled: true,
  },
  {
    id: "t2",
    name: "联邦学习协调",
    description: "每月1日发起联邦学习任务，协调各参与方上传梯度",
    type: "federated",
    cron: "0 2 1 * *",
    cron_desc: "每月1日 02:00",
    status: "success",
    last_run: "2026-06-01 02:00:00",
    next_run: "2026-07-01 02:00:00",
    duration: 3600,
    success_rate: 95.0,
    total_runs: 6,
    enabled: true,
  },
  {
    id: "t3",
    name: "模型性能监控",
    description: "每15分钟检查生产模型响应时间、错误率，超过阈值自动切换备用模型",
    type: "model_monitor",
    cron: "*/15 * * * *",
    cron_desc: "每15分钟",
    status: "running",
    last_run: "2026-06-05 11:45:00",
    next_run: "2026-06-05 12:00:00",
    duration: 12,
    success_rate: 99.8,
    total_runs: 8920,
    enabled: true,
  },
  {
    id: "t4",
    name: "知识库自动更新",
    description: "监听新增政策文件，自动解析、分段、向量化",
    type: "knowledge",
    cron: "*/30 * * * *",
    cron_desc: "每30分钟",
    status: "success",
    last_run: "2026-06-05 11:30:00",
    next_run: "2026-06-05 12:00:00",
    duration: 128,
    success_rate: 97.2,
    total_runs: 4460,
    enabled: true,
  },
  {
    id: "t5",
    name: "数据库全量备份",
    description: "每日凌晨进行数据库全量备份",
    type: "backup",
    cron: "0 4 * * *",
    cron_desc: "每日 04:00",
    status: "success",
    last_run: "2026-06-05 04:00:00",
    next_run: "2026-06-06 04:00:00",
    duration: 1800,
    success_rate: 100,
    total_runs: 156,
    enabled: true,
  },
  {
    id: "t6",
    name: "银行数据同步",
    description: "每小时同步银行放款数据",
    type: "sync",
    cron: "0 * * * *",
    cron_desc: "每小时",
    status: "failed",
    last_run: "2026-06-05 11:00:00",
    next_run: "2026-06-05 12:00:00",
    duration: 45,
    success_rate: 92.3,
    total_runs: 2678,
    enabled: true,
  },
];

const mockExecutions: TaskExecution[] = [
  { id: "e1", task_id: "t1", task_name: "CIAC系数计算", start_time: "2026-06-05 03:00:00", end_time: "2026-06-05 03:07:36", duration: 456, status: "success" },
  { id: "e2", task_id: "t3", task_name: "模型性能监控", start_time: "2026-06-05 11:45:00", end_time: "2026-06-05 11:45:12", duration: 12, status: "success" },
  { id: "e3", task_id: "t4", task_name: "知识库自动更新", start_time: "2026-06-05 11:30:00", end_time: "2026-06-05 11:32:08", duration: 128, status: "success" },
  { id: "e4", task_id: "t6", task_name: "银行数据同步", start_time: "2026-06-05 11:00:00", end_time: "2026-06-05 11:00:45", duration: 45, status: "failed", error_msg: "银行接口连接超时" },
  { id: "e5", task_id: "t5", task_name: "数据库全量备份", start_time: "2026-06-05 04:00:00", end_time: "2026-06-05 04:30:00", duration: 1800, status: "success" },
];

export default function TaskScheduleCenter() {
  const [tasks, setTasks] = useState<ScheduledTask[]>(mockTasks);
  const [executions, setExecutions] = useState<TaskExecution[]>(mockExecutions);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 统计
  const stats = {
    total: tasks.length,
    enabled: tasks.filter(t => t.enabled).length,
    running: tasks.filter(t => t.status === "running").length,
    failed: tasks.filter(t => t.status === "failed").length,
  };

  // 获取任务图标
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "ciac": return <Brain className="w-5 h-5 text-purple-500" />;
      case "federated": return <Shield className="w-5 h-5 text-blue-500" />;
      case "model_monitor": return <Zap className="w-5 h-5 text-orange-500" />;
      case "knowledge": return <FileText className="w-5 h-5 text-green-500" />;
      case "backup": return <Database className="w-5 h-5 text-cyan-500" />;
      case "sync": return <RefreshCw className="w-5 h-5 text-indigo-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  // 切换任务启用状态
  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, enabled: !t.enabled, status: !t.enabled ? "success" : "paused" as const } : t
    ));
    showToast("任务状态已更新", "success");
  };

  // 手动触发任务
  const triggerTask = (task: ScheduledTask) => {
    showToast(`任务 "${task.name}" 已触发`, "success");
    // 模拟添加执行记录
    const newExecution: TaskExecution = {
      id: `e${Date.now()}`,
      task_id: task.id,
      task_name: task.name,
      start_time: new Date().toLocaleString("zh-CN"),
      end_time: "-",
      duration: 0,
      status: "running",
    };
    setExecutions([newExecution, ...executions]);
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务调度中心</h1>
          <p className="text-gray-500 mt-1">管理系统定时任务，支持手动触发、暂停、修改Cron表达式</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            执行历史
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">总任务数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Clock className="w-6 h-6 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">已启用</p>
                <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">运行中</p>
                <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              </div>
              <Play className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">失败任务</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#165DFF]" />
            系统级Agent任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg overflow-hidden">
                {/* 任务头部 */}
                <div 
                  className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <div className="flex items-center gap-4">
                    {getTaskIcon(task.type)}
                    <div>
                      <h4 className="font-medium text-gray-800">{task.name}</h4>
                      <p className="text-sm text-gray-500">{task.cron_desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">上次执行</p>
                      <p className="text-sm text-gray-700">{task.last_run}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">下次执行</p>
                      <p className="text-sm text-gray-700">{task.next_run}</p>
                    </div>
                    <Badge className={`${
                      task.status === "running" ? "bg-blue-100 text-blue-600" :
                      task.status === "success" ? "bg-green-100 text-green-600" :
                      task.status === "failed" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {task.status === "running" ? "运行中" :
                       task.status === "success" ? "成功" :
                       task.status === "failed" ? "失败" : "已暂停"}
                    </Badge>
                    <Switch
                      checked={task.enabled}
                      onCheckedChange={() => toggleTask(task.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {expandedTask === task.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {/* 展开详情 */}
                {expandedTask === task.id && (
                  <div className="p-4 border-t bg-white">
                    <div className="grid grid-cols-4 gap-6 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">任务描述</p>
                        <p className="text-sm text-gray-700">{task.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cron表达式</p>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{task.cron}</code>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">执行耗时</p>
                        <p className="text-sm text-gray-700">{formatDuration(task.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">成功率</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${task.success_rate >= 95 ? "bg-green-500" : task.success_rate >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${task.success_rate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700">{task.success_rate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" onClick={() => triggerTask(task)} disabled={!task.enabled}>
                        <Play className="w-4 h-4 mr-2" />
                        立即执行
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        修改Cron
                      </Button>
                      <Button variant="outline" size="sm">
                        <History className="w-4 h-4 mr-2" />
                        查看日志
                      </Button>
                      <span className="text-sm text-gray-500 ml-4">累计执行 {task.total_runs} 次</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最近执行记录 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#165DFF]" />
            最近执行记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">任务名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">开始时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">结束时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">耗时</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {executions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTaskIcon(tasks.find(t => t.id === exec.task_id)?.type || "")}
                        <span className="font-medium text-gray-800">{exec.task_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exec.start_time}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exec.end_time}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exec.status === "running" ? "-" : formatDuration(exec.duration)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${
                        exec.status === "success" ? "bg-green-100 text-green-600" :
                        exec.status === "failed" ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        {exec.status === "success" ? "成功" : exec.status === "failed" ? "失败" : "运行中"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exec.error_msg || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">任务调度说明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>系统级Agent任务后台常驻，按Cron表达式自动执行</li>
                <li>任务执行失败自动重试3次，超过重试次数后标记为失败</li>
                <li>Cron表达式支持标准格式：秒 分 时 日 月 周</li>
                <li>修改Cron后立即生效，无需重启服务</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
