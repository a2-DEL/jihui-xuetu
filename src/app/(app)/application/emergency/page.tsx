"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

interface EmergencyApplication {
  id: string;
  studentName: string;
  major: string;
  reason: string;
  amount: number;
  status: string;
  submitTime: string;
  hoursPassed: number;
  aiScore: number;
}

export default function EmergencyPage() {
  const [applications] = useState<EmergencyApplication[]>([
    {
      id: "APP2026001",
      studentName: "张**",
      major: "计算机科学与技术",
      reason: "家庭突发重大疾病，急需医疗费用",
      amount: 5000,
      status: "待院系复核",
      submitTime: "2026-06-08 10:30",
      hoursPassed: 3,
      aiScore: 95,
    },
    {
      id: "APP2026002",
      studentName: "李**",
      major: "软件工程",
      reason: "家中房屋受灾，急需修缮资金",
      amount: 3000,
      status: "待辅导员初审",
      submitTime: "2026-06-08 06:00",
      hoursPassed: 7.5,
      aiScore: 92,
    },
    {
      id: "APP2026003",
      studentName: "王**",
      major: "网络工程",
      reason: "父母双失业，生活困难",
      amount: 4000,
      status: "待院系复核",
      submitTime: "2026-06-07 18:00",
      hoursPassed: 19.5,
      aiScore: 88,
    },
    {
      id: "APP2026004",
      studentName: "赵**",
      major: "信息安全",
      reason: "家庭遭遇自然灾害",
      amount: 4500,
      status: "待辅导员初审",
      submitTime: "2026-06-07 08:00",
      hoursPassed: 29.5,
      aiScore: 90,
    },
  ]);

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedApp, setSelectedApp] =
    useState<EmergencyApplication | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getUrgencyLevel = (hours: number) => {
    if (hours >= 24) return { label: "超时", color: "bg-red-500 text-white" };
    if (hours >= 12) return { label: "紧急", color: "bg-orange-500 text-white" };
    return { label: "待处理", color: "bg-yellow-500 text-white" };
  };

  const handleEmergencyApprove = (app: EmergencyApplication) => {
    setSelectedApp(app);
    setShowApproveDialog(true);
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) {
      alert("请先选择申请");
      return;
    }
    setShowBatchDialog(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          临时困补快速通道
        </h1>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleBatchApprove}
            disabled={selectedIds.length === 0}
          >
            批量紧急通过 ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">紧急申请</p>
            <p className="text-2xl font-bold text-red-700">
              {applications.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <p className="text-sm text-orange-600">超时(&gt;24h)</p>
            <p className="text-2xl font-bold text-orange-700">
              {applications.filter((a) => a.hoursPassed >= 24).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">待院系复核</p>
            <p className="text-2xl font-bold text-blue-700">
              {applications.filter((a) => a.status === "待院系复核").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-600">平均处理时长</p>
            <p className="text-2xl font-bold text-green-700">
              {(applications.reduce((sum, a) => sum + a.hoursPassed, 0) / applications.length).toFixed(1)}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>紧急申请列表（按紧急程度排序）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(applications.map((a) => a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>申请编号</TableHead>
                <TableHead>学生</TableHead>
                <TableHead>困难原因</TableHead>
                <TableHead>申请金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>已等待</TableHead>
                <TableHead>紧急程度</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications
                .sort((a, b) => b.hoursPassed - a.hoursPassed)
                .map((app) => (
                  <TableRow
                    key={app.id}
                    className={app.hoursPassed >= 24 ? "bg-red-50" : ""}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.includes(app.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, app.id]);
                          } else {
                            setSelectedIds(
                              selectedIds.filter((id) => id !== app.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{app.id}</TableCell>
                    <TableCell>{app.studentName}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {app.reason}
                    </TableCell>
                    <TableCell>¥{app.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          app.status === "待院系复核"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {app.hoursPassed.toFixed(1)}h
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUrgencyLevel(app.hoursPassed).color}>
                        {getUrgencyLevel(app.hoursPassed).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEmergencyApprove(app)}
                      >
                        紧急处理
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 紧急处理弹窗 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              紧急处理确认
            </DialogTitle>
            <DialogDescription>
              确认紧急通过该临时困难补助申请？
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">学生姓名</p>
                  <p className="font-medium">{selectedApp.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申请金额</p>
                  <p className="font-medium">
                    ¥{selectedApp.amount.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">困难原因</p>
                  <p className="font-medium">{selectedApp.reason}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveDialog(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={() => {
                    alert("已紧急通过");
                    setShowApproveDialog(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  确认通过
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 批量通过弹窗 */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量紧急通过确认</DialogTitle>
            <DialogDescription>
              确认批量通过 {selectedIds.length} 个紧急申请？
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBatchDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                alert(`已批量通过 ${selectedIds.length} 个申请`);
                setSelectedIds([]);
                setShowBatchDialog(false);
              }}
            >
              确认通过
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
