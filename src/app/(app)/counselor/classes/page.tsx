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
import { Users, Building } from "lucide-react";

export default function ClassAssignmentPage() {
  const classData = [
    { id: "1", name: "计科2101", major: "计算机科学与技术", grade: "2021", counselor: "李老师", studentCount: 42 },
    { id: "2", name: "计科2102", major: "计算机科学与技术", grade: "2021", counselor: "李老师", studentCount: 40 },
    { id: "3", name: "软工2101", major: "软件工程", grade: "2021", counselor: "张老师", studentCount: 45 },
    { id: "4", name: "软工2102", major: "软件工程", grade: "2021", counselor: "张老师", studentCount: 43 },
    { id: "5", name: "网工2201", major: "网络工程", grade: "2022", counselor: "王老师", studentCount: 38 },
    { id: "6", name: "信安2201", major: "信息安全", grade: "2022", counselor: "王老师", studentCount: 35 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">班级分配</h1>
      </div>

      {/* 按辅导员分组 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">李老师</span>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              管理 {classData.filter(c => c.counselor === "李老师").length} 个班级，
              共 {classData.filter(c => c.counselor === "李老师").reduce((sum, c) => sum + c.studentCount, 0)} 名学生
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-medium">张老师</span>
            </div>
            <p className="text-sm text-green-600 mt-2">
              管理 {classData.filter(c => c.counselor === "张老师").length} 个班级，
              共 {classData.filter(c => c.counselor === "张老师").reduce((sum, c) => sum + c.studentCount, 0)} 名学生
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium">王老师</span>
            </div>
            <p className="text-sm text-purple-600 mt-2">
              管理 {classData.filter(c => c.counselor === "王老师").length} 个班级，
              共 {classData.filter(c => c.counselor === "王老师").reduce((sum, c) => sum + c.studentCount, 0)} 名学生
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 班级列表 */}
      <Card>
        <CardHeader>
          <CardTitle>班级列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>班级名称</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>辅导员</TableHead>
                <TableHead>学生人数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.major}</TableCell>
                  <TableCell>{item.grade}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.counselor}</Badge>
                  </TableCell>
                  <TableCell>{item.studentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
