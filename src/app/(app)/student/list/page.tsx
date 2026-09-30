"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Search, Download, Eye, Star } from "lucide-react";

export default function StudentListPage() {
  const [students] = useState([
    { id: "1", name: "张**", studentId: "2021****001", major: "计算机科学与技术", grade: "2021", povertyLevel: "困难", creditScore: 85, focus: false },
    { id: "2", name: "李**", studentId: "2021****002", major: "软件工程", grade: "2021", povertyLevel: "一般困难", creditScore: 78, focus: true },
    { id: "3", name: "王**", studentId: "2022****003", major: "网络工程", grade: "2022", povertyLevel: "特殊困难", creditScore: 92, focus: true },
    { id: "4", name: "赵**", studentId: "2023****004", major: "信息安全", grade: "2023", povertyLevel: "不困难", creditScore: 70, focus: false },
  ]);

  const getPovertyColor = (level: string) => {
    switch (level) {
      case "特殊困难": return "bg-red-100 text-red-700";
      case "困难": return "bg-orange-100 text-orange-700";
      case "一般困难": return "bg-yellow-100 text-yellow-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">学生列表</h1>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          导出
        </Button>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="贫困等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="special">特殊困难</SelectItem>
                <SelectItem value="hard">困难</SelectItem>
                <SelectItem value="normal">一般困难</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="2021">2021级</SelectItem>
                <SelectItem value="2022">2022级</SelectItem>
                <SelectItem value="2023">2023级</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input className="pl-10" placeholder="搜索学号/姓名..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>贫困等级</TableHead>
                <TableHead>信用分</TableHead>
                <TableHead>重点关注</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.studentId}</TableCell>
                  <TableCell>{item.major}</TableCell>
                  <TableCell>{item.grade}</TableCell>
                  <TableCell>
                    <Badge className={getPovertyColor(item.povertyLevel)}>
                      {item.povertyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={item.creditScore >= 80 ? "text-green-600" : "text-yellow-600"}>
                      {item.creditScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.focus && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
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
    </div>
  );
}
