"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Search,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  User,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";

interface AuditRecord {
  id: string;
  studentId: string;
  studentName: string;
  college: string;
  oldScore: number;
  newScore: number;
  change: number;
  reason: string;
  source: string;
  operator: string;
  time: string;
  details?: string;
}

const auditRecords: AuditRecord[] = [
  {
    id: "1",
    studentId: "2021001001",
    studentName: "张三",
    college: "计算机学院",
    oldScore: 85,
    newScore: 78,
    change: -7,
    reason: "助学贷款逾期还款",
    source: "系统自动扣分",
    operator: "系统",
    time: "2024-01-15 10:30:00",
    details: "逾期天数：15天，扣分规则：每逾期1天扣0.5分",
  },
  {
    id: "2",
    studentId: "2021001002",
    studentName: "李四",
    college: "信息学院",
    oldScore: 72,
    newScore: 85,
    change: 13,
    reason: "勤工助学表现优秀",
    source: "辅导员评定",
    operator: "王老师",
    time: "2024-01-14 16:20:00",
    details: "岗位评价：优秀，出勤率：98%，任务完成度：100%",
  },
  {
    id: "3",
    studentId: "2021001003",
    studentName: "王五",
    college: "经管学院",
    oldScore: 90,
    newScore: 65,
    change: -25,
    reason: "申请材料造假",
    source: "审批中心审核",
    operator: "审批员A",
    time: "2024-01-13 09:15:00",
    details: "发现家庭收入证明造假，严重违规扣25分",
  },
  {
    id: "4",
    studentId: "2021001004",
    studentName: "赵六",
    college: "法学院",
    oldScore: 68,
    newScore: 75,
    change: 7,
    reason: "金融素养课程通过",
    source: "课程系统同步",
    operator: "系统",
    time: "2024-01-12 14:00:00",
    details: "课程：金融知识入门，成绩：85分",
  },
  {
    id: "5",
    studentId: "2021001005",
    studentName: "孙七",
    college: "外语学院",
    oldScore: 80,
    newScore: 92,
    change: 12,
    reason: "综合表现提升",
    source: "管理员调整",
    operator: "管理员",
    time: "2024-01-11 11:30:00",
    details: "多次按时还款，勤工表现良好，综合评定提升",
  },
];

export default function CreditAuditPage() {
  const [search, setSearch] = useState("");
  const [filterChange, setFilterChange] = useState<"all" | "up" | "down">("all");
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredRecords = auditRecords.filter((record) => {
    const matchSearch =
      record.studentName.includes(search) ||
      record.studentId.includes(search) ||
      record.college.includes(search);
    const matchFilter =
      filterChange === "all" ||
      (filterChange === "up" && record.change > 0) ||
      (filterChange === "down" && record.change < 0);
    return matchSearch && matchFilter;
  });

  const handleExport = () => {
    alert("正在导出审计记录...");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用分变更审计</h1>
          <p className="text-gray-500 mt-1">
            记录所有信用分变更历史，支持追溯和审计
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          导出记录
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{auditRecords.length}</div>
                <div className="text-sm text-gray-500">总变更记录</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {auditRecords.filter((r) => r.change > 0).length}
                </div>
                <div className="text-sm text-gray-500">信用提升</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {auditRecords.filter((r) => r.change < 0).length}
                </div>
                <div className="text-sm text-gray-500">信用下降</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(auditRecords.map((r) => r.studentId)).size}
                </div>
                <div className="text-sm text-gray-500">涉及学生</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名、学号、学院..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterChange === "all" ? "default" : "outline"}
                onClick={() => setFilterChange("all")}
                className={filterChange === "all" ? "bg-[#165DFF]" : ""}
              >
                全部
              </Button>
              <Button
                variant={filterChange === "up" ? "default" : "outline"}
                onClick={() => setFilterChange("up")}
                className={filterChange === "up" ? "bg-green-500" : ""}
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                提升
              </Button>
              <Button
                variant={filterChange === "down" ? "default" : "outline"}
                onClick={() => setFilterChange("down")}
                className={filterChange === "down" ? "bg-red-500" : ""}
              >
                <ArrowDown className="w-4 h-4 mr-1" />
                下降
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 变更记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>变更记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedRecord(record);
                  setShowDetailDialog(true);
                }}
              >
                {/* 变更方向 */}
                <div
                  className={`p-2 rounded-lg ${
                    record.change > 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {record.change > 0 ? (
                    <ArrowUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-600" />
                  )}
                </div>

                {/* 学生信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{record.studentName}</span>
                    <span className="text-gray-500">{record.studentId}</span>
                    <Badge variant="outline">{record.college}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {record.reason}
                  </div>
                </div>

                {/* 分数变化 */}
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{record.oldScore}</span>
                    <span className="text-gray-300">→</span>
                    <span
                      className={`font-bold ${
                        record.change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {record.newScore}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      record.change > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {record.change > 0 ? "+" : ""}
                    {record.change} 分
                  </div>
                </div>

                {/* 来源和时间 */}
                <div className="text-right text-sm text-gray-500">
                  <div>{record.source}</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    {record.time.split(" ")[0]}
                  </div>
                </div>

                {/* 查看详情 */}
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>变更详情</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">学生姓名</label>
                  <div className="font-medium">{selectedRecord.studentName}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">学号</label>
                  <div className="font-medium">{selectedRecord.studentId}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">学院</label>
                  <div className="font-medium">{selectedRecord.college}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">操作时间</label>
                  <div className="font-medium">{selectedRecord.time}</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">变更前</span>
                  <span className="font-bold text-lg">
                    {selectedRecord.oldScore} 分
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <div
                    className={`flex items-center gap-1 ${
                      selectedRecord.change > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedRecord.change > 0 ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span className="font-bold">
                      {selectedRecord.change > 0 ? "+" : ""}
                      {selectedRecord.change} 分
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500">变更后</span>
                  <span
                    className={`font-bold text-lg ${
                      selectedRecord.change > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedRecord.newScore} 分
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">变更原因</label>
                <div className="font-medium">{selectedRecord.reason}</div>
              </div>

              <div>
                <label className="text-sm text-gray-500">数据来源</label>
                <div className="font-medium">{selectedRecord.source}</div>
              </div>

              <div>
                <label className="text-sm text-gray-500">操作人</label>
                <div className="font-medium">{selectedRecord.operator}</div>
              </div>

              {selectedRecord.details && (
                <div>
                  <label className="text-sm text-gray-500">详细说明</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedRecord.details}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
