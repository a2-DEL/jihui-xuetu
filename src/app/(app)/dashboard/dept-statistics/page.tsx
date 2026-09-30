"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Filter } from "lucide-react";

export default function DeptStatisticsPage() {
  const [majorFilter, setMajorFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [povertyFilter, setPovertyFilter] = useState("all");

  const statisticsData = [
    {
      studentName: "张**",
      major: "计算机科学与技术",
      grade: "2022级",
      povertyLevel: "一般困难",
      amount: 4400,
      status: "已通过",
    },
    {
      studentName: "李**",
      major: "软件工程",
      grade: "2021级",
      povertyLevel: "特殊困难",
      amount: 5500,
      status: "待复核",
    },
    {
      studentName: "王**",
      major: "网络工程",
      grade: "2023级",
      povertyLevel: "比较困难",
      amount: 3300,
      status: "已通过",
    },
    {
      studentName: "赵**",
      major: "信息安全",
      grade: "2022级",
      povertyLevel: "一般困难",
      amount: 4400,
      status: "已驳回",
    },
    {
      studentName: "刘**",
      major: "数据科学与大数据技术",
      grade: "2021级",
      povertyLevel: "特殊困难",
      amount: 5500,
      status: "已通过",
    },
  ];

  const majorPassRates = [
    { major: "计算机科学与技术", passRate: 92.5, count: 45 },
    { major: "软件工程", passRate: 88.2, count: 38 },
    { major: "网络工程", passRate: 95.1, count: 32 },
    { major: "信息安全", passRate: 90.3, count: 25 },
    { major: "数据科学与大数据技术", passRate: 87.6, count: 16 },
  ];

  const povertyDistribution = [
    { level: "特殊困难", count: 28, percentage: 17.9 },
    { level: "比较困难", count: 45, percentage: 28.8 },
    { level: "一般困难", count: 68, percentage: 43.6 },
    { level: "不困难", count: 15, percentage: 9.6 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          导出报表
        </Button>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={majorFilter} onValueChange={setMajorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择专业" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部专业</SelectItem>
                <SelectItem value="cs">计算机科学与技术</SelectItem>
                <SelectItem value="se">软件工程</SelectItem>
                <SelectItem value="ne">网络工程</SelectItem>
                <SelectItem value="is">信息安全</SelectItem>
                <SelectItem value="ds">数据科学与大数据技术</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="选择年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                <SelectItem value="2021">2021级</SelectItem>
                <SelectItem value="2022">2022级</SelectItem>
                <SelectItem value="2023">2023级</SelectItem>
                <SelectItem value="2024">2024级</SelectItem>
              </SelectContent>
            </Select>
            <Select value={povertyFilter} onValueChange={setPovertyFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="贫困等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="special">特殊困难</SelectItem>
                <SelectItem value="hard">比较困难</SelectItem>
                <SelectItem value="normal">一般困难</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 各专业通过率对比 */}
        <Card>
          <CardHeader>
            <CardTitle>各专业通过率对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {majorPassRates.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.major}</span>
                    <span className="text-gray-500">
                      {item.passRate}% ({item.count}人)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        item.passRate >= 90
                          ? "bg-green-500"
                          : item.passRate >= 80
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${item.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 贫困等级申请分布 */}
        <Card>
          <CardHeader>
            <CardTitle>贫困等级申请分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {povertyDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.level}</span>
                    <span className="text-gray-500">
                      {item.count}人 ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 明细表格 */}
      <Card>
        <CardHeader>
          <CardTitle>明细数据</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>贫困等级</TableHead>
                <TableHead>申请金额</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statisticsData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.studentName}
                  </TableCell>
                  <TableCell>{item.major}</TableCell>
                  <TableCell>{item.grade}</TableCell>
                  <TableCell>{item.povertyLevel}</TableCell>
                  <TableCell>¥{item.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.status === "已通过"
                          ? "bg-green-100 text-green-700"
                          : item.status === "待复核"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
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
