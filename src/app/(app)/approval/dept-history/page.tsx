"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, CheckCircle, XCircle } from "lucide-react";

export default function DeptApprovalHistoryPage() {
  const historyList = [
    {
      id: "APP2026001",
      studentName: "张**",
      type: "国家助学金",
      amount: 4400,
      result: "通过",
      approveTime: "2026-06-08 11:30",
      comment: "材料齐全，符合条件",
    },
    {
      id: "APP2026002",
      studentName: "李**",
      type: "临时困难补助",
      amount: 3000,
      result: "驳回",
      approveTime: "2026-06-07 15:20",
      comment: "材料不完整，需补充家庭收入证明",
    },
    {
      id: "APP2026003",
      studentName: "王**",
      type: "国家奖学金",
      amount: 8000,
      result: "通过",
      approveTime: "2026-06-07 10:15",
      comment: "成绩优异，符合条件",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6" />
          审批历史
        </h1>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请编号</TableHead>
                <TableHead>学生</TableHead>
                <TableHead>申请类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>审批结果</TableHead>
                <TableHead>审批时间</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.studentName}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>¥{item.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.result === "通过"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {item.result === "通过" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {item.result}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.approveTime}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.comment}
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
