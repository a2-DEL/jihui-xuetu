"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
} from "lucide-react";

const syncTasks = [
  {
    id: 1,
    name: "放款数据同步",
    bank: "中国银行",
    status: "running",
    lastSync: "5分钟前",
    nextSync: "25分钟后",
    interval: "30分钟",
    successCount: 1234,
    failCount: 3,
  },
  {
    id: 2,
    name: "还款数据同步",
    bank: "工商银行",
    status: "running",
    lastSync: "10分钟前",
    nextSync: "20分钟后",
    interval: "30分钟",
    successCount: 987,
    failCount: 1,
  },
  {
    id: 3,
    name: "账户状态同步",
    bank: "建设银行",
    status: "paused",
    lastSync: "2小时前",
    nextSync: "已暂停",
    interval: "1小时",
    successCount: 456,
    failCount: 12,
  },
  {
    id: 4,
    name: "余额数据同步",
    bank: "农业银行",
    status: "running",
    lastSync: "15分钟前",
    nextSync: "45分钟后",
    interval: "1小时",
    successCount: 789,
    failCount: 0,
  },
];

const recentLogs = [
  { time: "10:35:22", task: "放款数据同步", status: "success", duration: "2.3s", records: 156 },
  { time: "10:30:15", task: "还款数据同步", status: "success", duration: "1.8s", records: 89 },
  { time: "10:25:08", task: "账户状态同步", status: "failed", duration: "超时", records: 0 },
  { time: "10:20:33", task: "余额数据同步", status: "success", duration: "3.1s", records: 234 },
  { time: "10:15:00", task: "放款数据同步", status: "success", duration: "2.1s", records: 145 },
  { time: "10:10:22", task: "还款数据同步", status: "warning", duration: "5.6s", records: 67 },
];

export default function SyncMonitorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据同步监控</h1>
        <p className="text-gray-500 mt-1">监控银行数据同步任务状态和执行记录</p>
      </div>

      {/* 实时状态 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />
              <span className="text-sm text-gray-500">运行中任务</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {syncTasks.filter((t) => t.status === "running").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-500">暂停任务</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {syncTasks.filter((t) => t.status === "paused").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">今日成功</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {syncTasks.reduce((sum, t) => sum + t.successCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-500">今日失败</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {syncTasks.reduce((sum, t) => sum + t.failCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 同步任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>同步任务管理</CardTitle>
            <Button variant="outline" size="sm">
              刷新状态
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      task.status === "running"
                        ? "bg-green-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${
                        task.status === "running"
                          ? "text-green-600 animate-spin"
                          : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-gray-500">{task.bank}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm text-right">
                    <p className="text-gray-500">同步间隔: {task.interval}</p>
                    <p className="text-gray-400">下次同步: {task.nextSync}</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="text-green-600">成功: {task.successCount}</p>
                    <p className="text-red-600">失败: {task.failCount}</p>
                  </div>
                  <Badge
                    className={
                      task.status === "running"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {task.status === "running" ? "运行中" : "已暂停"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    {task.status === "running" ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最近同步日志 */}
      <Card>
        <CardHeader>
          <CardTitle>最近同步日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : log.status === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">{log.task}</span>
                  <span className="text-sm text-gray-500">{log.time}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">耗时: {log.duration}</span>
                  <Badge variant="secondary">{log.records} 条</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
