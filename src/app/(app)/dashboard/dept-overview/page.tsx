"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface KPIData {
  assistedCount: number;
  totalStudents: number;
  coverageRate: number;
  totalAmount: number;
  avgApprovalDays: number;
  schoolAvgDays: number;
  ciacValue: number;
  ciacLevel: string;
  pendingCount: number;
}

interface TrendData {
  date: string;
  count: number;
  amount: number;
}

interface MajorDistribution {
  major: string;
  count: number;
  percentage: number;
}

interface PendingItem {
  id: string;
  studentName: string;
  applicationType: string;
  submitTime: string;
  aiScore: number;
  status: string;
}

interface FocusStudent {
  id: string;
  studentName: string;
  reason: string;
  creditScore: number;
  major: string;
}

export default function DeptOverviewPage() {
  const [kpiData, setKpiData] = useState<KPIData>({
    assistedCount: 156,
    totalStudents: 420,
    coverageRate: 37.1,
    totalAmount: 68.5,
    avgApprovalDays: 3.2,
    schoolAvgDays: 2.8,
    ciacValue: 0.12,
    ciacLevel: "良好",
    pendingCount: 12,
  });

  const [trendData] = useState<TrendData[]>([
    { date: "06-01", count: 5, amount: 22000 },
    { date: "06-02", count: 3, amount: 13200 },
    { date: "06-03", count: 7, amount: 30800 },
    { date: "06-04", count: 4, amount: 17600 },
    { date: "06-05", count: 6, amount: 26400 },
    { date: "06-06", count: 8, amount: 35200 },
    { date: "06-07", count: 5, amount: 22000 },
  ]);

  const [majorDistribution] = useState<MajorDistribution[]>([
    { major: "计算机科学与技术", count: 45, percentage: 28.8 },
    { major: "软件工程", count: 38, percentage: 24.4 },
    { major: "网络工程", count: 32, percentage: 20.5 },
    { major: "信息安全", count: 25, percentage: 16.0 },
    { major: "数据科学与大数据技术", count: 16, percentage: 10.3 },
  ]);

  const [pendingList] = useState<PendingItem[]>([
    {
      id: "APP2026001",
      studentName: "张**",
      applicationType: "国家助学金",
      submitTime: "2026-06-08 10:30",
      aiScore: 92,
      status: "待院系复核",
    },
    {
      id: "APP2026002",
      studentName: "李**",
      applicationType: "临时困难补助",
      submitTime: "2026-06-08 09:15",
      aiScore: 88,
      status: "待辅导员初审",
    },
    {
      id: "APP2026003",
      studentName: "王**",
      applicationType: "国家奖学金",
      submitTime: "2026-06-07 16:45",
      aiScore: 95,
      status: "待院系复核",
    },
    {
      id: "APP2026004",
      studentName: "赵**",
      applicationType: "勤工助学",
      submitTime: "2026-06-07 14:20",
      aiScore: 78,
      status: "待辅导员初审",
    },
    {
      id: "APP2026005",
      studentName: "刘**",
      applicationType: "国家助学金",
      submitTime: "2026-06-07 11:00",
      aiScore: 85,
      status: "待院系复核",
    },
  ]);

  const [focusStudents] = useState<FocusStudent[]>([
    {
      id: "S001",
      studentName: "孙**",
      reason: "疑似漏识贫困学生",
      creditScore: 75,
      major: "计算机科学与技术",
    },
    {
      id: "S002",
      studentName: "周**",
      reason: "信用分骤降",
      creditScore: 62,
      major: "软件工程",
    },
    {
      id: "S003",
      studentName: "吴**",
      reason: "多次驳回",
      creditScore: 68,
      major: "网络工程",
    },
  ]);

  const [showFocusDetail, setShowFocusDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FocusStudent | null>(
    null
  );

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    if (status.includes("复核")) return "bg-blue-100 text-blue-700";
    if (status.includes("初审")) return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  };

  const getCiacColor = (value: number) => {
    if (value <= 0.15) return "text-green-600";
    if (value <= 0.3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">本院系驾驶舱</h1>
        <div className="text-sm text-gray-500">
          计算机学院 · 更新时间：2026年06月08日 13:30
        </div>
      </div>

      {/* KPI指标卡片 */}
      <div className="grid grid-cols-5 gap-4">
        {/* 本院系受助人数 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">本院系受助人数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpiData.assistedCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  覆盖率 {kpiData.coverageRate}%
                </p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#165DFF"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${kpiData.coverageRate * 1.256} 125.6`}
                  />
                </svg>
                <Users className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资助总金额 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">资助总金额</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpiData.totalAmount}
                  <span className="text-sm font-normal ml-1">万元</span>
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  环比 +12.3%
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* 平均审批时长 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">平均审批时长</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpiData.avgApprovalDays}
                  <span className="text-sm font-normal ml-1">天</span>
                </p>
                {kpiData.avgApprovalDays > kpiData.schoolAvgDays ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    高于全校均值 ({kpiData.schoolAvgDays}天)
                  </p>
                ) : (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    低于全校均值 ({kpiData.schoolAvgDays}天)
                  </p>
                )}
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* 院系CIAC值 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">院系CIAC值</p>
                <p className={`text-2xl font-bold ${getCiacColor(kpiData.ciacValue)}`}>
                  {kpiData.ciacValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  等级：{kpiData.ciacLevel}
                </p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={kpiData.ciacValue <= 0.15 ? "#52C41A" : kpiData.ciacValue <= 0.3 ? "#FAAD14" : "#F5222D"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(1 - kpiData.ciacValue) * 62.8} 62.8`}
                  />
                </svg>
                <Activity className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 待办数量 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">待办数量</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpiData.pendingCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">待处理申请</p>
              </div>
              <div className="relative">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {kpiData.pendingCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 申请趋势图 */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">申请趋势（近7天）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {trendData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(item.count / 8) * 150}px` }}
                    title={`${item.date}: ${item.count}笔`}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 各专业申请分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">各专业申请分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {majorDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.major}</span>
                    <span className="text-gray-500">{item.count}人</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 待办与重点关注 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 待审批列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">待审批列表</CardTitle>
            <Button variant="link" size="sm">
              查看全部 →
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>申请类型</TableHead>
                  <TableHead>AI评分</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingList.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.studentName}
                    </TableCell>
                    <TableCell>{item.applicationType}</TableCell>
                    <TableCell>
                      <span className={getAIScoreColor(item.aiScore)}>
                        {item.aiScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 重点关注学生 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">重点关注学生</CardTitle>
            <Badge variant="destructive">AI推送</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>信用分</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {focusStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.studentName}
                    </TableCell>
                    <TableCell>
                      <span className="text-orange-600">{student.reason}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          student.creditScore >= 70
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {student.creditScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowFocusDetail(true);
                        }}
                      >
                        建议复核
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 重点关注详情弹窗 */}
      <Dialog open={showFocusDetail} onOpenChange={setShowFocusDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>建议复核</DialogTitle>
            <DialogDescription>
              确认为该学生创建复核任务并推送给对应辅导员？
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">学生姓名</p>
                  <p className="font-medium">{selectedStudent.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">专业</p>
                  <p className="font-medium">{selectedStudent.major}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">关注原因</p>
                  <p className="font-medium text-orange-600">
                    {selectedStudent.reason}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">信用分</p>
                  <p className="font-medium">{selectedStudent.creditScore}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFocusDetail(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={() => {
                    alert("复核任务已创建并推送给辅导员");
                    setShowFocusDetail(false);
                  }}
                >
                  确认创建
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
