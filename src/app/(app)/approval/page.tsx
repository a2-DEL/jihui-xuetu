"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  History,
  ListTodo,
  Sparkles,
  UserCheck,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Eye,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// 获取用户角色
const getUserRole = (): string => {
  if (typeof window === "undefined") return "super_admin";
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      const user = JSON.parse(stored);
      return user.role || "super_admin";
    } catch {
      return "super_admin";
    }
  }
  return "super_admin";
};

// 模拟数据
const mockStats = {
  pendingCount: 23,
  urgentCount: 5,
  todayProcessed: 18,
  weekProcessed: 86,
  avgProcessTime: "2.3小时",
  aiAssistRate: 68,
  highScorePending: 12,
};

const mockPendingItems = [
  {
    id: "1",
    studentName: "张三",
    studentNo: "2021001",
    type: "国家奖学金",
    amount: 8000,
    college: "计算机学院",
    aiScore: 92,
    submitTime: "2026-05-28 09:30",
    urgency: "high",
  },
  {
    id: "2",
    studentName: "李四",
    studentNo: "2021002",
    type: "国家助学金",
    amount: 4000,
    college: "信息学院",
    aiScore: 85,
    submitTime: "2026-05-27 14:20",
    urgency: "normal",
  },
  {
    id: "3",
    studentName: "王五",
    studentNo: "2021003",
    type: "临时困难补助",
    amount: 3000,
    college: "机械学院",
    aiScore: 78,
    submitTime: "2026-05-27 10:15",
    urgency: "normal",
  },
];

const aiSuggestions = [
  {
    id: "1",
    applicationNo: "APP-2026-001",
    studentName: "张三",
    type: "国家奖学金",
    aiScore: 92,
    suggestion: "建议通过",
    reason: "GPA排名前5%，家庭经济困难认定等级为A，材料完整度高",
    confidence: 95,
  },
  {
    id: "2",
    applicationNo: "APP-2026-002",
    studentName: "李四",
    type: "国家助学金",
    aiScore: 85,
    suggestion: "建议通过",
    reason: "家庭经济困难认定等级为B，符合申请条件，材料齐全",
    confidence: 88,
  },
  {
    id: "3",
    applicationNo: "APP-2026-003",
    studentName: "赵六",
    type: "国家奖学金",
    aiScore: 65,
    suggestion: "建议人工复核",
    reason: "GPA排名不在前10%，但家庭经济困难情况特殊，建议人工审核",
    confidence: 72,
  },
];

export default function ApprovalCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats] = useState(mockStats);
  const [userRole, setUserRole] = useState("super_admin");

  useEffect(() => {
    setUserRole(getUserRole());
    // 模拟加载
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "pending":
        router.push("/approval/pending");
        break;
      case "history":
        router.push("/approval/history");
        break;
      case "tasks":
        router.push("/approval/tasks");
        break;
      case "ai":
        router.push("/approval/ai-suggestions");
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审批中心</h1>
          <p className="text-gray-500 mt-1">集中处理各类资助申请审批，AI辅助决策</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/approval/history")}>
            <History className="w-4 h-4 mr-2" />
            审批历史
          </Button>
          <Button onClick={() => router.push("/approval/pending")}>
            <CheckCircle className="w-4 h-4 mr-2" />
            开始审批
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction("pending")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">待审批</p>
                <p className="text-3xl font-bold text-orange-700 mt-2">{stats.pendingCount}</p>
                <p className="text-xs text-orange-500 mt-1">
                  {stats.urgentCount} 紧急待处理
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction("history")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">今日已处理</p>
                <p className="text-3xl font-bold text-green-700 mt-2">{stats.todayProcessed}</p>
                <p className="text-xs text-green-500 mt-1">
                  本周共 {stats.weekProcessed} 条
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction("ai")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">AI辅助率</p>
                <p className="text-3xl font-bold text-purple-700 mt-2">{stats.aiAssistRate}%</p>
                <p className="text-xs text-purple-500 mt-1">
                  高分申请 {stats.highScorePending} 条
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">平均处理时效</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">{stats.avgProcessTime}</p>
                <p className="text-xs text-blue-500 mt-1">
                  较上周提升 15%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 超级管理员专属：全校审批监控 */}
      {userRole === "super_admin" && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-yellow-400" />
              超级管理员：全校审批监控
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">全校待审批</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">异常审批</p>
                    <p className="text-2xl font-bold text-orange-400">8</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">干预记录</p>
                    <p className="text-2xl font-bold">23</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">平均时效</p>
                    <p className="text-2xl font-bold">1.8h</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 各院系审批进度 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">各院系审批进度</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: "计算机学院", pending: 12, total: 45, rate: 73 },
                  { name: "信息学院", pending: 8, total: 38, rate: 79 },
                  { name: "机械学院", pending: 15, total: 52, rate: 71 },
                  { name: "经管学院", pending: 6, total: 28, rate: 78 },
                ].map((dept) => (
                  <div key={dept.name} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{dept.name}</span>
                      <span className="text-xs text-gray-400">{dept.pending}待处理</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        style={{ width: `${dept.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">完成率 {dept.rate}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 快速干预操作 */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => router.push("/application/all")}
              >
                <Eye className="w-4 h-4 mr-2" />
                查看全校申请
              </Button>
              <Button 
                variant="outline" 
                className="bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30"
                onClick={() => router.push("/approval/history")}
              >
                <Zap className="w-4 h-4 mr-2" />
                干预记录
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => router.push("/approval/pending")}
              >
                <Shield className="w-4 h-4 mr-2" />
                批量干预
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 待审批列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-orange-500" />
                待审批申请
              </CardTitle>
              <Link href="/approval/pending" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push("/approval/pending")}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        item.urgency === "high" ? "bg-red-500" : "bg-blue-500"
                      }`}>
                        {item.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {item.studentName}
                          {item.urgency === "high" && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">
                              紧急
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.studentNo} · {item.college}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{item.type}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>¥{item.amount.toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.aiScore >= 80 ? "bg-green-100 text-green-600" :
                          item.aiScore >= 60 ? "bg-yellow-100 text-yellow-600" :
                          "bg-red-100 text-red-600"
                        }`}>
                          AI评分 {item.aiScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI建议 */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI建议
              </CardTitle>
              <Link href="/approval/ai-suggestions" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                更多 <ChevronRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer"
                    onClick={() => router.push("/approval/ai-suggestions")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{item.studentName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.suggestion === "建议通过" ? "bg-green-100 text-green-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {item.suggestion}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">{item.type}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.confidence >= 85 ? "bg-green-500" :
                            item.confidence >= 70 ? "bg-yellow-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{item.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 快捷入口 */}
      <Card>
        <CardHeader>
          <CardTitle>快捷入口</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push("/approval/pending")}
            >
              <Clock className="w-5 h-5 text-orange-500" />
              <span>待审批</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push("/approval/history")}
            >
              <History className="w-5 h-5 text-green-500" />
              <span>审批历史</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push("/approval/tasks")}
            >
              <ListTodo className="w-5 h-5 text-blue-500" />
              <span>我的待办</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push("/approval/ai-suggestions")}
            >
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>AI建议</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
