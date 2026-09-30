"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Shield,
  User,
  Zap
} from "lucide-react";

interface EmergencyApproval {
  id: string;
  applicantName: string;
  applicationType: string;
  submitTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewTime?: string;
}

export default function EmergencyChannelPage() {
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEmergency, setNewEmergency] = useState({
    applicantName: "",
    applicationType: "",
    reason: "",
  });

  const [emergencies, setEmergencies] = useState<EmergencyApproval[]>([
    {
      id: "EMG-001",
      applicantName: "张三",
      applicationType: "临时困难补助",
      submitTime: "2024-01-15 14:30",
      reason: "家庭突发重大变故，需紧急处理",
      status: "approved",
      reviewedBy: "李校长",
      reviewTime: "2024-01-15 14:45",
    },
    {
      id: "EMG-002",
      applicantName: "李四",
      applicationType: "助学金申请",
      submitTime: "2024-01-15 16:20",
      reason: "申请截止日期临近，材料补交",
      status: "pending",
    },
  ]);

  const handleSubmit = () => {
    if (!newEmergency.applicantName || !newEmergency.applicationType || !newEmergency.reason) {
      return;
    }

    const newEntry: EmergencyApproval = {
      id: `EMG-${String(emergencies.length + 1).padStart(3, "0")}`,
      applicantName: newEmergency.applicantName,
      applicationType: newEmergency.applicationType,
      submitTime: new Date().toLocaleString("zh-CN"),
      reason: newEmergency.reason,
      status: "pending",
    };

    setEmergencies([newEntry, ...emergencies]);
    setNewEmergency({ applicantName: "", applicationType: "", reason: "" });
    setShowNewForm(false);
  };

  const handleApprove = (id: string) => {
    setEmergencies(emergencies.map(e => 
      e.id === id 
        ? { ...e, status: "approved" as const, reviewedBy: "当前用户", reviewTime: new Date().toLocaleString("zh-CN") }
        : e
    ));
  };

  const handleReject = (id: string) => {
    setEmergencies(emergencies.map(e => 
      e.id === id 
        ? { ...e, status: "rejected" as const, reviewedBy: "当前用户", reviewTime: new Date().toLocaleString("zh-CN") }
        : e
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">待处理</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700">已通过</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">已驳回</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-red-500" />
            应急通道配置
          </h1>
          <p className="text-gray-500 mt-1">紧急情况下的快速审批通道，用于处理特殊情况</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} className="bg-[#165DFF]">
          <Zap className="w-4 h-4 mr-2" />
          新增应急申请
        </Button>
      </div>

      {/* 使用说明 */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">使用须知</p>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                <li>• 应急通道仅用于紧急情况，如自然灾害、重大疾病等特殊情况</li>
                <li>• 使用应急通道必须有充分的理由说明</li>
                <li>• 所有应急审批将被记录在案，接受审计检查</li>
                <li>• 滥用应急通道将被追究责任</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 新增表单 */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>新增应急申请</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">申请人姓名</label>
                <Input 
                  value={newEmergency.applicantName}
                  onChange={(e) => setNewEmergency({ ...newEmergency, applicantName: e.target.value })}
                  placeholder="请输入申请人姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">申请类型</label>
                <Input 
                  value={newEmergency.applicationType}
                  onChange={(e) => setNewEmergency({ ...newEmergency, applicationType: e.target.value })}
                  placeholder="请输入申请类型"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">紧急原因</label>
              <Textarea 
                value={newEmergency.reason}
                onChange={(e) => setNewEmergency({ ...newEmergency, reason: e.target.value })}
                placeholder="请详细说明需要使用应急通道的原因"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>取消</Button>
              <Button onClick={handleSubmit} className="bg-[#165DFF]">提交</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emergencies.length}</p>
                <p className="text-sm text-gray-500">应急申请总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emergencies.filter(e => e.status === "pending").length}</p>
                <p className="text-sm text-gray-500">待处理</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emergencies.filter(e => e.status === "approved").length}</p>
                <p className="text-sm text-gray-500">已通过</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-gray-500">审计覆盖率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 应急申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>应急申请记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emergencies.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">{item.id}</Badge>
                    <span className="font-medium">{item.applicantName}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">{item.applicationType}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                <div className="flex items-start gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{item.reason}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>提交时间: {item.submitTime}</span>
                    {item.reviewedBy && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        审批人: {item.reviewedBy}
                      </span>
                    )}
                  </div>
                  {item.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(item.id)}>
                        驳回
                      </Button>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleApprove(item.id)}>
                        通过
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
