"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";

export default function DeptCiacPage() {
  const [ciacData] = useState({
    currentValue: 0.12,
    lastWeekValue: 0.15,
    targetValue: 0.1,
    weeklyTrend: [
      { week: "第22周", value: 0.18 },
      { week: "第23周", value: 0.16 },
      { week: "第24周", value: 0.15 },
      { week: "第25周", value: 0.13 },
      { week: "第26周", value: 0.12 },
    ],
  });

  const [classRanking] = useState([
    { className: "计科2101班", ciac: 0.08, status: "良好", trend: "down" },
    { className: "计科2102班", ciac: 0.11, status: "良好", trend: "down" },
    { className: "软工2101班", ciac: 0.14, status: "良好", trend: "up" },
    { className: "软工2102班", ciac: 0.18, status: "中等", trend: "up" },
    { className: "网络2101班", ciac: 0.12, status: "良好", trend: "stable" },
    { className: "信安2101班", ciac: 0.22, status: "中等", trend: "up" },
  ]);

  const [missedStudents] = useState([
    {
      id: "S001",
      studentName: "张**",
      major: "计算机科学与技术",
      class: "计科2103班",
      reason: "家庭收入低但未申请",
      confidence: 0.85,
    },
    {
      id: "S002",
      studentName: "李**",
      major: "软件工程",
      class: "软工2102班",
      reason: "突发家庭变故",
      confidence: 0.78,
    },
    {
      id: "S003",
      studentName: "王**",
      major: "网络工程",
      class: "网络2101班",
      reason: "单亲家庭经济困难",
      confidence: 0.82,
    },
    {
      id: "S004",
      studentName: "赵**",
      major: "信息安全",
      class: "信安2101班",
      reason: "父母失业",
      confidence: 0.71,
    },
  ]);

  const getCiacStatus = (value: number) => {
    if (value <= 0.15) return { label: "良好", color: "bg-green-100 text-green-700" };
    if (value <= 0.3) return { label: "中等", color: "bg-yellow-100 text-yellow-700" };
    return { label: "异常", color: "bg-red-100 text-red-700" };
  };

  const handleReview = (studentId: string) => {
    alert(`已为 ${studentId} 创建复核任务并推送给辅导员`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CIAC院系看板</h1>
        <Badge variant="outline">计算机学院</Badge>
      </div>

      {/* CIAC概览 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 当前CIAC值 */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">当前CIAC值</p>
              <p
                className={`text-4xl font-bold ${
                  ciacData.currentValue <= 0.15
                    ? "text-green-600"
                    : ciacData.currentValue <= 0.3
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {ciacData.currentValue.toFixed(2)}
              </p>
              <Badge className={getCiacStatus(ciacData.currentValue).color + " mt-2"}>
                {getCiacStatus(ciacData.currentValue).label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 环比变化 */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">环比变化</p>
              <div className="flex items-center justify-center gap-2">
                {ciacData.currentValue < ciacData.lastWeekValue ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">
                      -{((ciacData.lastWeekValue - ciacData.currentValue) * 100).toFixed(0)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-6 h-6 text-red-500" />
                    <span className="text-2xl font-bold text-red-600">
                      +{((ciacData.currentValue - ciacData.lastWeekValue) * 100).toFixed(0)}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                上周: {ciacData.lastWeekValue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 目标差值 */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">目标差值</p>
              <div className="flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                <span
                  className={`text-2xl font-bold ${
                    ciacData.currentValue <= ciacData.targetValue
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {(ciacData.currentValue - ciacData.targetValue).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                目标: {ciacData.targetValue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>CIAC趋势（近5周）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-4">
            {ciacData.weeklyTrend.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all ${
                    item.value <= 0.15
                      ? "bg-green-500"
                      : item.value <= 0.3
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ height: `${(item.value / 0.3) * 150}px` }}
                />
                <span className="text-xs text-gray-500 mt-2">{item.week}</span>
                <span className="text-xs font-medium">{item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 班级CIAC排名 */}
      <Card>
        <CardHeader>
          <CardTitle>班级CIAC排名</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>班级</TableHead>
                <TableHead>CIAC值</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>趋势</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classRanking.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.className}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.ciac <= 0.15
                          ? "text-green-600"
                          : item.ciac <= 0.3
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    >
                      {item.ciac.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCiacStatus(item.ciac).color}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : item.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI预测漏识学生 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            AI预测漏识学生
          </CardTitle>
          <Badge variant="destructive">{missedStudents.length}人</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>疑似原因</TableHead>
                <TableHead>置信度</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.studentName}
                  </TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>
                    <span className="text-orange-600">{student.reason}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-600">
                      {(student.confidence * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(student.id)}
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
  );
}
