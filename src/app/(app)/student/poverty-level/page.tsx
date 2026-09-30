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
import { TrendingUp, Edit } from "lucide-react";

export default function PovertyLevelPage() {
  const students = [
    { name: "张**", studentId: "2021****001", currentLevel: "困难", suggestedLevel: "困难", lastUpdate: "2026-05-15", status: "已确认" },
    { name: "李**", studentId: "2021****002", currentLevel: "一般困难", suggestedLevel: "困难", lastUpdate: "2026-05-10", status: "待审核" },
    { name: "王**", studentId: "2022****003", currentLevel: "特殊困难", suggestedLevel: "特殊困难", lastUpdate: "2026-05-20", status: "已确认" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          贫困等级管理
        </h1>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>当前等级</TableHead>
                <TableHead>AI建议等级</TableHead>
                <TableHead>最后更新</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.studentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.currentLevel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.currentLevel !== item.suggestedLevel ? "bg-orange-100 text-orange-700" : ""}>
                      {item.suggestedLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.lastUpdate}</TableCell>
                  <TableCell>
                    <Badge className={item.status === "已确认" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
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
