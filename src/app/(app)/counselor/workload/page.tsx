"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, TrendingUp } from "lucide-react";

export default function WorkloadPage() {
  const workloadData = [
    { counselor: "李老师", approved: 25, rejected: 3, avgTime: "1.2天", efficiency: 95 },
    { counselor: "张老师", approved: 18, rejected: 2, avgTime: "1.5天", efficiency: 92 },
    { counselor: "王老师", approved: 32, rejected: 5, avgTime: "0.8天", efficiency: 98 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          工作量统计
        </h1>
      </div>

      {/* 工作量对比卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {workloadData.map((item) => (
          <Card key={item.counselor}>
            <CardContent className="p-4">
              <p className="font-medium">{item.counselor}</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">已审批</span>
                  <span className="font-medium">{item.approved + item.rejected}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">通过率</span>
                  <span className="font-medium text-green-600">
                    {((item.approved / (item.approved + item.rejected)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">平均耗时</span>
                  <span className="font-medium">{item.avgTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">效率评分</span>
                  <span className="font-medium text-blue-600">{item.efficiency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 详细表格 */}
      <Card>
        <CardHeader>
          <CardTitle>工作量明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>辅导员</TableHead>
                <TableHead>审批通过</TableHead>
                <TableHead>审批驳回</TableHead>
                <TableHead>平均处理时长</TableHead>
                <TableHead>效率评分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workloadData.map((item) => (
                <TableRow key={item.counselor}>
                  <TableCell className="font-medium">{item.counselor}</TableCell>
                  <TableCell className="text-green-600">{item.approved}</TableCell>
                  <TableCell className="text-red-600">{item.rejected}</TableCell>
                  <TableCell>{item.avgTime}</TableCell>
                  <TableCell>
                    <span className={item.efficiency >= 95 ? "text-green-600" : "text-yellow-600"}>
                      {item.efficiency}
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
