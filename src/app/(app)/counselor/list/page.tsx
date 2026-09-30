"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit, Eye, Users, CheckCircle } from "lucide-react";

export default function CounselorListPage() {
  const [counselors] = useState([
    {
      id: "1",
      name: "李老师",
      phone: "138****1234",
      email: "li@edu.cn",
      manageClasses: 3,
      studentCount: 120,
      pendingCount: 5,
      status: "在职",
    },
    {
      id: "2",
      name: "张老师",
      phone: "139****5678",
      email: "zhang@edu.cn",
      manageClasses: 2,
      studentCount: 85,
      pendingCount: 3,
      status: "在职",
    },
    {
      id: "3",
      name: "王老师",
      phone: "137****9012",
      email: "wang@edu.cn",
      manageClasses: 4,
      studentCount: 160,
      pendingCount: 8,
      status: "休假中",
    },
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">辅导员列表</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加辅导员
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">辅导员总数</p>
            <p className="text-2xl font-bold">{counselors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">在职人数</p>
            <p className="text-2xl font-bold text-green-600">
              {counselors.filter((c) => c.status === "在职").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">管理学生总数</p>
            <p className="text-2xl font-bold">
              {counselors.reduce((sum, c) => sum + c.studentCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">待处理申请</p>
            <p className="text-2xl font-bold text-orange-600">
              {counselors.reduce((sum, c) => sum + c.pendingCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 辅导员列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>辅导员列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input className="pl-10" placeholder="搜索辅导员..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>管理班级</TableHead>
                <TableHead>学生人数</TableHead>
                <TableHead>待处理</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counselors.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.manageClasses}</TableCell>
                  <TableCell>{item.studentCount}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.pendingCount > 5
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {item.pendingCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "在职"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
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
