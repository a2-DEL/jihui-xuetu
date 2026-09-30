"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  User,
  FileText,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// 模拟待办数据
const mockTasks = [
  {
    id: "1",
    title: "审批张三的国家奖学金申请",
    type: "approval",
    applicationId: "APP-2026-001",
    studentName: "张三",
    deadline: "2026-05-29 18:00",
    priority: "high",
    status: "pending",
    aiScore: 92,
  },
  {
    id: "2",
    title: "复核李四的助学金申请材料",
    type: "review",
    applicationId: "APP-2026-002",
    studentName: "李四",
    deadline: "2026-05-30 12:00",
    priority: "normal",
    status: "pending",
    aiScore: 85,
  },
  {
    id: "3",
    title: "处理王五的材料补交请求",
    type: "material",
    applicationId: "APP-2026-003",
    studentName: "王五",
    deadline: "2026-05-28 17:00",
    priority: "urgent",
    status: "pending",
    aiScore: 78,
  },
  {
    id: "4",
    title: "确认赵六的家庭经济情况",
    type: "verify",
    applicationId: "APP-2026-004",
    studentName: "赵六",
    deadline: "2026-05-31 18:00",
    priority: "normal",
    status: "pending",
    aiScore: 70,
  },
  {
    id: "5",
    title: "审批钱七的临时困难补助",
    type: "approval",
    applicationId: "APP-2026-005",
    studentName: "钱七",
    deadline: "2026-05-29 18:00",
    priority: "normal",
    status: "pending",
    aiScore: 88,
  },
];

const taskTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  approval: { label: "审批", color: "bg-orange-100 text-orange-700", icon: <CheckCircle className="w-4 h-4" /> },
  review: { label: "复核", color: "bg-blue-100 text-blue-700", icon: <FileText className="w-4 h-4" /> },
  material: { label: "材料", color: "bg-purple-100 text-purple-700", icon: <FileText className="w-4 h-4" /> },
  verify: { label: "核验", color: "bg-green-100 text-green-700", icon: <User className="w-4 h-4" /> },
};

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks] = useState(mockTasks);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter === "all") return true;
    return task.priority === priorityFilter;
  });

  const stats = {
    total: tasks.length,
    urgent: tasks.filter((t) => t.priority === "urgent").length,
    high: tasks.filter((t) => t.priority === "high").length,
    normal: tasks.filter((t) => t.priority === "normal").length,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "紧急";
      case "high":
        return "高优";
      default:
        return "普通";
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的待办</h1>
          <p className="text-gray-500 mt-1">需要您处理的审批和复核任务</p>
        </div>
        <Button onClick={() => router.push("/approval/pending")}>
          <CheckCircle className="w-4 h-4 mr-2" />
          开始处理
        </Button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPriorityFilter("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">全部待办</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPriorityFilter("urgent")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                <p className="text-sm text-gray-500">紧急</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPriorityFilter("high")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                <p className="text-sm text-gray-500">高优</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPriorityFilter("normal")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.normal}</p>
                <p className="text-sm text-gray-500">普通</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          <Button
            variant={priorityFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setPriorityFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={priorityFilter === "urgent" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setPriorityFilter("urgent")}
          >
            紧急
          </Button>
          <Button
            variant={priorityFilter === "high" ? "default" : "outline"}
            size="sm"
            onClick={() => setPriorityFilter("high")}
          >
            高优
          </Button>
          <Button
            variant={priorityFilter === "normal" ? "default" : "outline"}
            size="sm"
            onClick={() => setPriorityFilter("normal")}
          >
            普通
          </Button>
        </div>
      </div>

      {/* 待办列表 */}
      <Card>
        <CardHeader>
          <CardTitle>待办任务 ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/approval/pending`)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    task.priority === "urgent" ? "bg-red-100" :
                    task.priority === "high" ? "bg-orange-100" :
                    "bg-blue-100"
                  }`}>
                    {taskTypeConfig[task.type]?.icon || <ListTodo className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.studentName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        截止: {task.deadline}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={taskTypeConfig[task.type]?.color}>
                    {taskTypeConfig[task.type]?.label || task.type}
                  </Badge>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  <span className={`text-sm font-medium ${
                    task.aiScore >= 80 ? "text-green-600" :
                    task.aiScore >= 60 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    AI: {task.aiScore}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
