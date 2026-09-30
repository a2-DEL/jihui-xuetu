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
import { Star, Eye, Bell } from "lucide-react";

export default function FocusStudentsPage() {
  const focusStudents = [
    { name: "李**", studentId: "2021****002", major: "软件工程", reason: "信用分骤降", creditScore: 65, lastUpdate: "2026-06-08" },
    { name: "王**", studentId: "2022****003", major: "网络工程", reason: "疑似漏识", creditScore: 88, lastUpdate: "2026-06-07" },
    { name: "赵**", studentId: "2023****004", major: "信息安全", reason: "多次驳回", creditScore: 55, lastUpdate: "2026-06-06" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          重点关注学生
        </h1>
        <Badge variant="destructive">{focusStudents.length} 人需关注</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>重点关注列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>关注原因</TableHead>
                <TableHead>信用分</TableHead>
                <TableHead>最后更新</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {focusStudents.map((item, idx) => (
                <TableRow key={idx} className="bg-yellow-50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.studentId}</TableCell>
                  <TableCell>{item.major}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                      {item.reason}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={item.creditScore >= 70 ? "text-yellow-600" : "text-red-600"}>
                      {item.creditScore}
                    </span>
                  </TableCell>
                  <TableCell>{item.lastUpdate}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bell className="w-4 h-4" />
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
