"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Play,
  Pause,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  MessageSquare,
  Workflow,
  Brain,
  Sparkles,
  Send,
  ChevronRight,
  CircleDot,
  ArrowRight,
  Cpu,
  Database,
  BookOpen,
  Wrench,
} from "lucide-react";

// Agent 团队定义
interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "success" | "error";
  avatar: string;
  skills: string[];
  currentTask?: string;
}

// 执行步骤
interface ExecutionStep {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  status: "pending" | "running" | "success" | "error";
  duration?: number;
  message?: string;
  timestamp: number;
}

// 任务
interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  agents: string[];
  progress: number;
  startTime?: number;
  steps: ExecutionStep[];
}

export default function AICenterPage() {
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState("command");
  const [elapsedTime, setElapsedTime] = useState(0);

  // 实时更新耗时
  useEffect(() => {
    if (!isExecuting || !currentTask?.startTime) return;
    const timer = setInterval(() => {
      setElapsedTime((Date.now() - (currentTask.startTime || Date.now())) / 1000);
    }, 100);
    return () => clearInterval(timer);
  }, [isExecuting, currentTask]);

  // Agent 团队（根据角色动态展示）
  const agents: Agent[] = [
    {
      id: "llm-brain",
      name: "LLM 大脑",
      role: "指挥官",
      status: "idle",
      avatar: "🧠",
      skills: ["意图识别", "任务规划", "推理决策"],
    },
    {
      id: "application-review",
      name: "申请初审 Agent",
      role: "执行者",
      status: "idle",
      avatar: "📋",
      skills: ["材料核验", "资格评估", "风险识别"],
    },
    {
      id: "ciac-calc",
      name: "CIAC 计算 Agent",
      role: "分析师",
      status: "idle",
      avatar: "📊",
      skills: ["CIAC系数计算", "趋势分析", "预测"],
    },
    {
      id: "reminder",
      name: "智能催办 Agent",
      role: "协调者",
      status: "idle",
      avatar: "⏰",
      skills: ["超时检测", "消息推送", "催办提醒"],
    },
    {
      id: "report",
      name: "报表生成 Agent",
      role: "执行者",
      status: "idle",
      avatar: "📈",
      skills: ["数据聚合", "报表生成", "格式导出"],
    },
    {
      id: "policy-qa",
      name: "政策问答 Agent",
      role: "顾问",
      status: "idle",
      avatar: "💬",
      skills: ["知识检索", "政策解读", "问答生成"],
    },
  ];

  // 模拟任务执行
  const executeTask = async () => {
    if (!input.trim()) return;

    setIsExecuting(true);
    setActiveTab("execution");

    // 创建任务
    const task: Task = {
      id: `task-${Date.now()}`,
      title: input,
      description: "AI 指挥中心正在处理您的指令",
      status: "running",
      agents: ["llm-brain", "application-review", "ciac-calc"],
      progress: 0,
      startTime: Date.now(),
      steps: [],
    };

    setCurrentTask(task);

    // 模拟执行步骤
    const steps: ExecutionStep[] = [
      {
        id: "step-1",
        agentId: "llm-brain",
        agentName: "LLM 大脑",
        action: "意图识别",
        status: "running",
        message: "正在分析您的指令...",
        timestamp: Date.now(),
      },
      {
        id: "step-2",
        agentId: "llm-brain",
        agentName: "LLM 大脑",
        action: "任务规划",
        status: "pending",
        message: "正在制定执行计划...",
        timestamp: Date.now() + 1000,
      },
      {
        id: "step-3",
        agentId: "application-review",
        agentName: "申请初审 Agent",
        action: "材料核验",
        status: "pending",
        message: "正在核验申请材料...",
        timestamp: Date.now() + 2000,
      },
      {
        id: "step-4",
        agentId: "ciac-calc",
        agentName: "CIAC 计算 Agent",
        action: "CIAC 计算",
        status: "pending",
        message: "正在计算 CIAC 系数...",
        timestamp: Date.now() + 3000,
      },
      {
        id: "step-5",
        agentId: "llm-brain",
        agentName: "LLM 大脑",
        action: "生成报告",
        status: "pending",
        message: "正在汇总执行结果...",
        timestamp: Date.now() + 4000,
      },
    ];

    // 逐步执行
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      steps[i].status = "success";
      steps[i].duration = Math.floor(Math.random() * 1000) + 500;

      if (i + 1 < steps.length) {
        steps[i + 1].status = "running";
      }

      setCurrentTask({
        ...task,
        progress: ((i + 1) / steps.length) * 100,
        steps: [...steps],
      });
    }

    // 完成
    setCurrentTask({
      ...task,
      status: "completed",
      progress: 100,
      steps: steps.map((s) => ({ ...s, status: "success" as const })),
    });

    setIsExecuting(false);
  };

  // 快捷指令
  const quickCommands = [
    { icon: "📋", text: "处理计算机学院待审批的申请", desc: "批量初审" },
    { icon: "⏰", text: "催办所有超时未处理的申请", desc: "智能催办" },
    { icon: "📊", text: "计算本月全校 CIAC 系数", desc: "CIAC 计算" },
    { icon: "📈", text: "生成本月资助发放报表", desc: "报表生成" },
    { icon: "💬", text: "国家助学金申请条件是什么？", desc: "政策问答" },
    { icon: "🔍", text: "检测最近一周的异常申请", desc: "异常检测" },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#9E5FFF]" />
            AI 指挥中心
          </h1>
          <p className="text-gray-500 mt-1">
            LLM 大脑指挥 Agent 团队协作，自动化处理资助业务
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CircleDot className="w-3 h-3 mr-1" />
            LLM 在线
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Users className="w-3 h-3 mr-1" />
            6 个 Agent 就绪
          </Badge>
        </div>
      </div>

      {/* 架构概览 */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600 font-medium">大脑层</p>
                <p className="text-sm font-bold text-gray-900">LLM 指挥</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">团队层</p>
                <p className="text-sm font-bold text-gray-900">Agent 协作</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">编排层</p>
                <p className="text-sm font-bold text-gray-900">工作流</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-orange-600 font-medium">数据层</p>
                <p className="text-sm font-bold text-gray-900">数据中台</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-xs text-pink-600 font-medium">知识层</p>
                <p className="text-sm font-bold text-gray-900">RAG 知识库</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="command">
            <Sparkles className="w-4 h-4 mr-2" />
            指令中心
          </TabsTrigger>
          <TabsTrigger value="execution">
            <Activity className="w-4 h-4 mr-2" />
            执行过程
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot className="w-4 h-4 mr-2" />
            Agent 团队
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            历史记录
          </TabsTrigger>
        </TabsList>

        {/* 指令中心 */}
        <TabsContent value="command" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#165DFF]" />
                向 AI 助手下达指令
              </CardTitle>
              <CardDescription>
                输入自然语言指令，AI 大脑将理解意图并调度 Agent 团队执行
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="例如：帮我处理计算机学院待审批的申请，并生成审批建议报告..."
                  className="min-h-[100px] pr-12 resize-none"
                  disabled={isExecuting}
                />
                <Button
                  size="icon"
                  className="absolute bottom-3 right-3 bg-[#165DFF] hover:bg-[#165DFF]/90"
                  onClick={executeTask}
                  disabled={isExecuting || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* 快捷指令 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">快捷指令：</p>
                <div className="grid grid-cols-3 gap-2">
                  {quickCommands.map((cmd, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start h-auto py-2 px-3"
                      onClick={() => setInput(cmd.text)}
                      disabled={isExecuting}
                    >
                      <span className="text-lg mr-2">{cmd.icon}</span>
                      <div className="text-left">
                        <p className="text-xs font-medium">{cmd.desc}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">
                          {cmd.text}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 执行流程示意 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI 执行流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs mt-2 font-medium">LLM 理解</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs mt-2 font-medium">任务规划</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs mt-2 font-medium">Agent 调度</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-xs mt-2 font-medium">Skills 执行</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-pink-600" />
                  </div>
                  <p className="text-xs mt-2 font-medium">结果汇总</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 执行过程 */}
        <TabsContent value="execution" className="space-y-4">
          {currentTask ? (
            <>
              {/* 任务概览 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {currentTask.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                      )}
                      {currentTask.title}
                    </CardTitle>
                    <Badge
                      variant={
                        currentTask.status === "completed" ? "default" : "secondary"
                      }
                      className={
                        currentTask.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {currentTask.status === "completed" ? "已完成" : "执行中"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">执行进度</span>
                        <span className="font-medium">
                          {Math.round(currentTask.progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#165DFF] to-[#9E5FFF] transition-all duration-500"
                          style={{ width: `${currentTask.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      耗时：{elapsedTime.toFixed(1)}s
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 执行时间线 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">执行时间线</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentTask.steps.map((step, idx) => (
                      <div key={step.id} className="flex gap-4">
                        {/* 时间线 */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.status === "success"
                                ? "bg-green-100"
                                : step.status === "running"
                                ? "bg-blue-100 animate-pulse"
                                : "bg-gray-100"
                            }`}
                          >
                            {step.status === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : step.status === "running" ? (
                              <Activity className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          {idx < currentTask.steps.length - 1 && (
                            <div
                              className={`w-0.5 h-8 ${
                                step.status === "success" ? "bg-green-200" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {agents.find((a) => a.id === step.agentId)?.avatar}
                            </span>
                            <span className="font-medium text-sm">
                              {step.agentName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {step.action}
                            </Badge>
                            {step.duration && (
                              <span className="text-xs text-gray-500">
                                {step.duration}ms
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 参与 Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">参与 Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {agents
                      .filter((a) => currentTask.agents.includes(a.id))
                      .map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50"
                        >
                          <span className="text-2xl">{agent.avatar}</span>
                          <div>
                            <p className="font-medium text-sm">{agent.name}</p>
                            <p className="text-xs text-gray-500">{agent.role}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无执行任务</p>
                <p className="text-sm text-gray-400 mt-1">
                  请在“指令中心”下达指令
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agent 团队 */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{agent.avatar}</span>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription>{agent.role}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={agent.status === "working" ? "default" : "secondary"}
                      className={
                        agent.status === "working"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {agent.status === "working" ? "工作中" : "待命"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 历史记录 */}
        <TabsContent value="history">
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无历史记录</p>
              <p className="text-sm text-gray-400 mt-1">
                执行任务后将在此显示历史
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

