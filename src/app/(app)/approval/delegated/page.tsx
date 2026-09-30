"use client";

import { useState } from "react";
import {
  UserCheck,
  User,
  Calendar,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 模拟委托数据
const mockDelegations = [
  {
    id: "1",
    delegator: "当前用户",
    delegateTo: "李明",
    delegateToRole: "资助管理员",
    startTime: "2026-05-28 09:00",
    endTime: "2026-05-30 18:00",
    status: "active",
    reason: "出差期间委托处理",
    applicationTypes: ["国家奖学金", "国家助学金"],
    pendingCount: 5,
  },
  {
    id: "2",
    delegator: "王芳",
    delegateTo: "当前用户",
    delegateToRole: "辅导员",
    startTime: "2026-05-27 14:00",
    endTime: "2026-05-29 18:00",
    status: "active",
    reason: "王芳请假，委托处理",
    applicationTypes: ["临时困难补助"],
    pendingCount: 3,
  },
  {
    id: "3",
    delegator: "当前用户",
    delegateTo: "张华",
    delegateToRole: "资助管理员",
    startTime: "2026-05-20 09:00",
    endTime: "2026-05-22 18:00",
    status: "expired",
    reason: "会议期间委托",
    applicationTypes: ["国家助学金"],
    pendingCount: 0,
  },
];

// 可选的代理人
const availableDelegates = [
  { id: "1", name: "李明", role: "资助管理员" },
  { id: "2", name: "张华", role: "资助管理员" },
  { id: "3", name: "王芳", role: "辅导员" },
  { id: "4", name: "赵强", role: "学院负责人" },
];

export default function DelegatedApprovalPage() {
  const [delegations, setDelegations] = useState(mockDelegations);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDelegate, setNewDelegate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  const myDelegations = delegations.filter((d) => d.delegator === "当前用户");
  const receivedDelegations = delegations.filter((d) => d.delegateTo === "当前用户");

  const activeCount = delegations.filter((d) => d.status === "active").length;
  const totalPending = receivedDelegations.reduce((sum, d) => sum + d.pendingCount, 0);

  const handleAddDelegation = () => {
    const delegate = availableDelegates.find((d) => d.id === newDelegate);
    if (!delegate) return;

    const newDelegation = {
      id: Date.now().toString(),
      delegator: "当前用户",
      delegateTo: delegate.name,
      delegateToRole: delegate.role,
      startTime: newStartTime || new Date().toISOString().slice(0, 16).replace("T", " "),
      endTime: newEndTime,
      status: "active" as const,
      reason: newReason,
      applicationTypes: ["国家奖学金", "国家助学金"],
      pendingCount: 0,
    };

    setDelegations([...delegations, newDelegation]);
    setShowAddDialog(false);
    setNewDelegate("");
    setNewReason("");
    setNewStartTime("");
    setNewEndTime("");
  };

  const handleDeleteDelegation = (id: string) => {
    setDelegations(delegations.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">委托审批</h1>
          <p className="text-gray-500 mt-1">管理审批权限委托，出差或请假时可委托他人代为审批</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建委托
        </Button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-sm text-gray-500">进行中的委托</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
                <p className="text-sm text-gray-500">待处理委托任务</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{receivedDelegations.length}</p>
                <p className="text-sm text-gray-500">收到的委托</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 我发出的委托 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-500" />
            我发出的委托
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myDelegations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无委托记录
            </div>
          ) : (
            <div className="space-y-4">
              {myDelegations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      item.status === "active" ? "bg-green-500" : "bg-gray-400"
                    }`}>
                      {item.delegateTo.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        委托给: {item.delegateTo}
                        <Badge variant="outline" className="text-xs">
                          {item.delegateToRole}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.startTime} ~ {item.endTime}
                      </div>
                      <div className="text-sm text-gray-500">
                        原因: {item.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      item.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }>
                      {item.status === "active" ? "进行中" : "已结束"}
                    </Badge>
                    {item.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200"
                        onClick={() => handleDeleteDelegation(item.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        取消
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 我收到的委托 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            我收到的委托
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receivedDelegations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无收到的委托
            </div>
          ) : (
            <div className="space-y-4">
              {receivedDelegations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      item.status === "active" ? "bg-orange-500" : "bg-gray-400"
                    }`}>
                      {item.delegator.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        来自: {item.delegator}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.startTime} ~ {item.endTime}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">待处理:</span>
                        <Badge className="bg-orange-100 text-orange-700">
                          {item.pendingCount} 条
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      item.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }>
                      {item.status === "active" ? "进行中" : "已结束"}
                    </Badge>
                    {item.status === "active" && (
                      <Button size="sm">
                        去处理
                      </Button>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建委托弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建审批委托</DialogTitle>
            <DialogDescription>
              将您的审批权限临时委托给他人处理
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>委托给</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={newDelegate}
                onChange={(e) => setNewDelegate(e.target.value)}
              >
                <option value="">请选择代理人</option>
                {availableDelegates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>开始时间</Label>
              <Input
                type="datetime-local"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>结束时间</Label>
              <Input
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>委托原因</Label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="请输入委托原因"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddDelegation} disabled={!newDelegate || !newEndTime}>
              确认委托
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
