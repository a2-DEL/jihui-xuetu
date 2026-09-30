"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, UserPlus, Eye } from "lucide-react";

const missedStudents = [
  { id: "1", name: "张三", studentId: "2021001", college: "计算机学院", score: 78, reasons: ["消费异常低", "家庭收入下降"], risk: "high" },
  { id: "2", name: "李四", studentId: "2021002", college: "信息工程学院", score: 72, reasons: ["勤工俭学时长多", "无消费记录"], risk: "high" },
  { id: "3", name: "王五", studentId: "2021003", college: "经济管理学院", score: 65, reasons: ["校园卡余额低"], risk: "medium" },
  { id: "4", name: "赵六", studentId: "2021004", college: "外国语学院", score: 58, reasons: ["申请被驳回"], risk: "low" },
  { id: "5", name: "钱七", studentId: "2021005", college: "机械工程学院", score: 55, reasons: ["未提交材料", "成绩优异但经济困难"], risk: "medium" },
];

export default function CIACMissedStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  const filteredStudents = missedStudents.filter(s => {
    const matchSearch = s.name.includes(searchTerm) || s.studentId.includes(searchTerm);
    const matchRisk = !selectedRisk || s.risk === selectedRisk;
    return matchSearch && matchRisk;
  });

  const handleAddToWatch = (studentId: string) => {
    alert(`已将学生 ${studentId} 加入关注名单`);
  };

  const handleViewDetail = (studentId: string) => {
    alert(`查看学生 ${studentId} 的详细信息`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">漏识学生预警</h1>
        <p className="text-gray-500 mt-1">AI识别可能被遗漏的贫困生，供人工复核</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-gray-600">高危漏识</p>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {missedStudents.filter(s => s.risk === "high").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-gray-600">中危漏识</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              {missedStudents.filter(s => s.risk === "medium").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-500" />
              <p className="text-sm text-gray-600">低危漏识</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {missedStudents.filter(s => s.risk === "low").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">漏识原因数</p>
            <p className="text-2xl font-bold mt-2">
              {[...new Set(missedStudents.flatMap(s => s.reasons))].length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索学生姓名或学号"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Badge
                variant={selectedRisk === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedRisk(null)}
              >
                全部
              </Badge>
              <Badge
                variant={selectedRisk === "high" ? "destructive" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedRisk("high")}
              >
                高危
              </Badge>
              <Badge
                variant={selectedRisk === "medium" ? "default" : "outline"}
                className="cursor-pointer bg-yellow-500 hover:bg-yellow-600"
                onClick={() => setSelectedRisk("medium")}
              >
                中危
              </Badge>
              <Badge
                variant={selectedRisk === "low" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedRisk("low")}
              >
                低危
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <CardTitle>漏识学生列表 ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`p-4 rounded-lg border ${
                  student.risk === "high" ? "border-red-200 bg-red-50" :
                  student.risk === "medium" ? "border-yellow-200 bg-yellow-50" :
                  "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                      {student.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{student.name} ({student.studentId})</p>
                      <p className="text-sm text-gray-500">{student.college}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">AI识别置信度</p>
                      <p className="font-bold">{student.score}%</p>
                    </div>
                    <Badge
                      variant={
                        student.risk === "high" ? "destructive" :
                        student.risk === "medium" ? "default" : "secondary"
                      }
                    >
                      {student.risk === "high" ? "高危" :
                       student.risk === "medium" ? "中危" : "低危"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">漏识原因:</span>
                  {student.reasons.map((reason, i) => (
                    <Badge key={i} variant="outline">{reason}</Badge>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetail(student.studentId)}>
                    <Eye className="w-4 h-4 mr-1" />
                    查看详情
                  </Button>
                  <Button size="sm" onClick={() => handleAddToWatch(student.studentId)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    加入关注
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
