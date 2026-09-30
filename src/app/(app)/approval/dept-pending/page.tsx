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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Lightbulb } from "lucide-react";

export default function DeptPendingPage() {
  const [pendingList] = useState([
    {
      id: "APP2026001",
      studentName: "张**",
      type: "国家助学金",
      amount: 4400,
      aiScore: 92,
      aiSuggestion: "建议通过：材料齐全，家庭经济情况符合条件",
      submitTime: "2026-06-08 10:30",
      counselor: "李老师",
    },
    {
      id: "APP2026002",
      studentName: "王**",
      type: "国家奖学金",
      amount: 8000,
      aiScore: 95,
      aiSuggestion: "建议通过：成绩优异，综合素质高",
      submitTime: "2026-06-07 16:45",
      counselor: "张老师",
    },
    {
      id: "APP2026003",
      studentName: "赵**",
      type: "临时困难补助",
      amount: 3000,
      aiScore: 88,
      aiSuggestion: "建议通过：突发困难情况属实",
      submitTime: "2026-06-07 14:20",
      counselor: "王老师",
    },
  ]);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    (typeof pendingList)[0] | null
  >(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的待办</h1>
        <Badge variant="destructive">{pendingList.length} 条待处理</Badge>
      </div>

      {/* AI建议概览 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium text-blue-700">AI智能建议</p>
              <p className="text-sm text-blue-600">
                当前{pendingList.length}条待办中，AI建议通过{pendingList.filter(p => p.aiScore >= 85).length}条
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 待办列表 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请编号</TableHead>
                <TableHead>学生</TableHead>
                <TableHead>申请类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>AI评分</TableHead>
                <TableHead>辅导员</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.studentName}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>¥{item.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.aiScore >= 90
                          ? "text-green-600"
                          : item.aiScore >= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    >
                      {item.aiScore}
                    </span>
                  </TableCell>
                  <TableCell>{item.counselor}</TableCell>
                  <TableCell>{item.submitTime}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>申请详情与AI建议</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">学生姓名</p>
                  <p className="font-medium">{selectedItem.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申请类型</p>
                  <p className="font-medium">{selectedItem.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申请金额</p>
                  <p className="font-medium">
                    ¥{selectedItem.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">AI评分</p>
                  <p className="font-medium">{selectedItem.aiScore}</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  AI建议
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedItem.aiSuggestion}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
