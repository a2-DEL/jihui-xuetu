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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Ban,
  Search,
  UserX,
  Calendar,
  FileText,
  AlertTriangle,
  Plus,
  RotateCcw,
  Eye,
  Trash2,
  Users,
  Clock,
} from "lucide-react";

interface BlacklistRecord {
  id: string;
  studentId: string;
  studentName: string;
  college: string;
  score: number;
  reason: string;
  type: "permanent" | "temporary";
  startDate: string;
  endDate?: string;
  operator: string;
  status: "active" | "removed";
  removedBy?: string;
  removedAt?: string;
  removeReason?: string;
}

const blacklistRecords: BlacklistRecord[] = [
  {
    id: "1",
    studentId: "2021001001",
    studentName: "张三",
    college: "计算机学院",
    score: 35,
    reason: "多次申请材料造假，严重违规",
    type: "permanent",
    startDate: "2024-01-10",
    operator: "管理员",
    status: "active",
  },
  {
    id: "2",
    studentId: "2021001002",
    studentName: "李四",
    college: "信息学院",
    score: 42,
    reason: "助学贷款连续逾期超过90天",
    type: "temporary",
    startDate: "2024-01-05",
    endDate: "2024-07-05",
    operator: "系统",
    status: "active",
  },
  {
    id: "3",
    studentId: "2021001003",
    studentName: "王五",
    college: "经管学院",
    score: 38,
    reason: "虚构家庭困难情况骗取资助",
    type: "permanent",
    startDate: "2023-12-20",
    operator: "审批中心",
    status: "active",
  },
  {
    id: "4",
    studentId: "2021001004",
    studentName: "赵六",
    college: "法学院",
    score: 48,
    reason: "逾期还款",
    type: "temporary",
    startDate: "2023-06-01",
    endDate: "2023-12-01",
    operator: "系统",
    status: "removed",
    removedBy: "管理员",
    removedAt: "2023-12-02",
    removeReason: "已还清欠款，表现良好",
  },
];

export default function CreditBlacklistPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "removed">(
    "active"
  );
  const [selectedRecord, setSelectedRecord] =
    useState<BlacklistRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const filteredRecords = blacklistRecords.filter((record) => {
    const matchSearch =
      record.studentName.includes(search) ||
      record.studentId.includes(search) ||
      record.college.includes(search);
    const matchStatus =
      filterStatus === "all" || record.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = blacklistRecords.filter(
    (r) => r.status === "active"
  ).length;
  const permanentCount = blacklistRecords.filter(
    (r) => r.status === "active" && r.type === "permanent"
  ).length;
  const temporaryCount = blacklistRecords.filter(
    (r) => r.status === "active" && r.type === "temporary"
  ).length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用黑名单管理</h1>
          <p className="text-gray-500 mt-1">
            管理严重失信学生名单，限制其资助申请资格
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-500 hover:bg-red-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加黑名单
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeCount}</div>
                <div className="text-sm text-gray-500">当前黑名单</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserX className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{permanentCount}</div>
                <div className="text-sm text-gray-500">永久限制</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{temporaryCount}</div>
                <div className="text-sm text-gray-500">临时限制</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {blacklistRecords.filter((r) => r.status === "removed").length}
                </div>
                <div className="text-sm text-gray-500">已移除</div>
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
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className={filterStatus === "all" ? "bg-[#165DFF]" : ""}
              >
                全部
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => setFilterStatus("active")}
                className={filterStatus === "active" ? "bg-red-500" : ""}
              >
                生效中
              </Button>
              <Button
                variant={filterStatus === "removed" ? "default" : "outline"}
                onClick={() => setFilterStatus("removed")}
                className={filterStatus === "removed" ? "bg-green-500" : ""}
              >
                已移除
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 黑名单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>黑名单记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  record.status === "active"
                    ? "bg-red-50 border border-red-100"
                    : "bg-gray-50"
                }`}
              >
                {/* 类型图标 */}
                <div
                  className={`p-2 rounded-lg ${
                    record.type === "permanent"
                      ? "bg-red-100"
                      : "bg-orange-100"
                  }`}
                >
                  {record.type === "permanent" ? (
                    <UserX className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
                </div>

                {/* 学生信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{record.studentName}</span>
                    <span className="text-gray-500">{record.studentId}</span>
                    <Badge variant="outline">{record.college}</Badge>
                    <Badge
                      className={
                        record.type === "permanent"
                          ? "bg-red-500"
                          : "bg-orange-500"
                      }
                    >
                      {record.type === "permanent" ? "永久" : "临时"}
                    </Badge>
                    {record.status === "removed" && (
                      <Badge className="bg-green-500">已移除</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {record.reason}
                  </div>
                </div>

                {/* 信用分 */}
                <div className="text-center">
                  <div className="text-sm text-gray-500">信用分</div>
                  <div className="font-bold text-red-600">{record.score}</div>
                </div>

                {/* 期限 */}
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    {record.startDate}
                  </div>
                  {record.endDate && (
                    <div className="text-gray-500">至 {record.endDate}</div>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowDetailDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {record.status === "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowRemoveDialog(true);
                      }}
                    >
                      <RotateCcw className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>黑名单详情</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">学生姓名</label>
                  <div className="font-medium">
                    {selectedRecord.studentName}
                  </div>
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
                  <label className="text-sm text-gray-500">当前信用分</label>
                  <div className="font-bold text-red-600">
                    {selectedRecord.score}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">加入原因</label>
                <div className="font-medium">{selectedRecord.reason}</div>
              </div>

              <div>
                <label className="text-sm text-gray-500">限制类型</label>
                <Badge
                  className={
                    selectedRecord.type === "permanent"
                      ? "bg-red-500"
                      : "bg-orange-500"
                  }
                >
                  {selectedRecord.type === "permanent" ? "永久限制" : "临时限制"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">开始日期</label>
                  <div className="font-medium">{selectedRecord.startDate}</div>
                </div>
                {selectedRecord.endDate && (
                  <div>
                    <label className="text-sm text-gray-500">结束日期</label>
                    <div className="font-medium">
                      {selectedRecord.endDate}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500">操作人</label>
                <div className="font-medium">{selectedRecord.operator}</div>
              </div>

              {selectedRecord.status === "removed" && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-700 mb-2">
                    已移除
                  </div>
                  <div className="text-sm text-gray-600">
                    移除人：{selectedRecord.removedBy}
                  </div>
                  <div className="text-sm text-gray-600">
                    移除时间：{selectedRecord.removedAt}
                  </div>
                  <div className="text-sm text-gray-600">
                    移除原因：{selectedRecord.removeReason}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 添加黑名单弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加黑名单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                添加黑名单将限制该学生的所有资助申请资格，请谨慎操作！
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">学生学号</label>
              <Input placeholder="输入学生学号" />
            </div>
            <div>
              <label className="text-sm font-medium">加入原因</label>
              <Input placeholder="输入加入黑名单的原因" />
            </div>
            <div>
              <label className="text-sm font-medium">限制类型</label>
              <select className="w-full border rounded-md p-2">
                <option value="temporary">临时限制</option>
                <option value="permanent">永久限制</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button className="bg-red-500 hover:bg-red-600">确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移除黑名单弹窗 */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移出黑名单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              确定要将 <strong>{selectedRecord?.studentName}</strong>{" "}
              移出黑名单吗？
            </p>
            <div>
              <label className="text-sm font-medium">移出原因</label>
              <Input placeholder="输入移出黑名单的原因" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              取消
            </Button>
            <Button className="bg-green-500 hover:bg-green-600">
              确认移出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
