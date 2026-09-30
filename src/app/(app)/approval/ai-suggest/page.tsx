"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, CheckCircle, XCircle } from "lucide-react";

export default function AISuggestPage() {
  const suggestions = [
    { id: "1", student: "张**", type: "国家助学金", aiScore: 92, suggest: "建议通过", reason: "材料齐全，家庭情况符合条件" },
    { id: "2", student: "李**", type: "临时困难补助", aiScore: 78, suggest: "建议复核", reason: "部分材料需要补充" },
    { id: "3", student: "王**", type: "国家奖学金", aiScore: 45, suggest: "建议驳回", reason: "成绩未达到要求" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          AI建议
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI审批建议列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>申请类型</TableHead>
                <TableHead>AI评分</TableHead>
                <TableHead>建议</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.student}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <span className={item.aiScore >= 80 ? "text-green-600 font-bold" : item.aiScore >= 60 ? "text-yellow-600" : "text-red-600"}>
                      {item.aiScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.suggest === "建议通过" ? "bg-green-100 text-green-700" : item.suggest === "建议复核" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                      {item.suggest}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.reason}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-green-600">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
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
    </div>
  );
}
