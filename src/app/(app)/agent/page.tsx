"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap, GitBranch, Activity, Settings, Play, Pause,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, BarChart3, Users, FileText, Bot
} from "lucide-react";
import Link from "next/link";

interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalWorkflows: number;
  activeWorkflows: number;
  todayExecutions: number;
  successRate: number;
  avgResponseTime: number;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  lastRun: string;
  successRate: number;
  tasks: number;
}

export default function AgentPage() {
  const router = useRouter();
  const [stats] = useState<AgentStats>({
    totalAgents: 12,
    activeAgents: 8,
    totalWorkflows: 6,
    activeWorkflows: 4,
    todayExecutions: 156,
    successRate: 94.5,
    avgResponseTime: 2.3,
  });

  const [agents] = useState<Agent[]>([
    { id: "1", name: "材料审核Agent", type: "审核", status: "active", lastRun: "2分钟前", successRate: 98, tasks: 45 },
    { id: "2", name: "风险评估Agent", type: "分析", status: "active", lastRun: "5分钟前", successRate: 95, tasks: 38 },
    { id: "3", name: "智能推荐Agent", type: "推荐", status: "active", lastRun: "1分钟前", successRate: 92, tasks: 52 },
    { id: "4", name: "通知推送Agent", type: "通知", status: "active", lastRun: "30秒前", successRate: 99, tasks: 28 },
    { id: "5", name: "数据同步Agent", type: "同步", status: "inactive", lastRun: "1小时前", successRate: 88, tasks: 15 },
    { id: "6", name: "报表生成Agent", type: "报表", status: "error", lastRun: "10分钟前", successRate: 75, tasks: 8 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      case "error": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "inactive": return <Pause className="w-4 h-4 text-gray-500" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent管理</h1>
          <p className="text-gray-500 mt-1">管理智能代理和工作流编排</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/agent/monitor">
              <Activity className="w-4 h-4 mr-2" />
              监控中心
            </Link>
          </Button>
          <Button asChild>
            <Link href="/agent/workflow">
              <GitBranch className="w-4 h-4 mr-2" />
              工作流管理
            </Link>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Agent总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.activeAgents} 个运行中
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">工作流数量</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkflows}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.activeWorkflows} 个已启用
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日执行</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayExecutions}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  较昨日 +23%
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">成功率</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  平均响应 {stats.avgResponseTime}s
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/agent/workflow")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <GitBranch className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">工作流管理</h3>
                <p className="text-sm text-gray-500">设计和管理审批工作流</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/agent/monitor")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">监控中心</h3>
                <p className="text-sm text-gray-500">实时监控Agent运行状态</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Agent配置</h3>
                <p className="text-sm text-gray-500">配置Agent参数和规则</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent列表</CardTitle>
            <Button size="sm">
              <Zap className="w-4 h-4 mr-2" />
              新建Agent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    agent.status === "active" ? "bg-green-100" : 
                    agent.status === "error" ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    {getStatusIcon(agent.status)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{agent.type}</Badge>
                      <span className="text-xs text-gray-500">上次运行: {agent.lastRun}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{agent.tasks}</p>
                    <p className="text-xs text-gray-500">今日任务</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm font-medium text-gray-900">{agent.successRate}%</p>
                    <p className="text-xs text-gray-500">成功率</p>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status === "active" ? "运行中" : 
                     agent.status === "error" ? "异常" : "已停止"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      {agent.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

