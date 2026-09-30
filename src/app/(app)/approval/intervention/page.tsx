"use client";

import { useState, useCallback } from "react";
import {
  GitBranch, SkipForward, Plus, XCircle, Eye, CheckCircle,
  AlertCircle, Clock, User, ArrowRight, ChevronDown, ChevronUp,
  RefreshCw, FileText, Send, Ban, Play
} from "lucide-react";

// 审批流程节点类型
interface FlowNode {
  id: string;
  name: string;
  type: "start" | "approval" | "condition" | "end";
  status: "pending" | "processing" | "completed" | "skipped";
  approver?: string;
  approverRole?: string;
  completedAt?: string;
  comment?: string;
}

// 申请实例
interface ApplicationFlow {
  id: string;
  studentName: string;
  studentId: string;
  type: string;
  amount: number;
  currentStatus: string;
  nodes: FlowNode[];
  isIntervened: boolean;
  interventionHistory: InterventionRecord[];
}

// 干预记录
interface InterventionRecord {
  id: string;
  type: "skip" | "add" | "terminate" | "reassign";
  operator: string;
  operatedAt: string;
  reason: string;
  details: string;
}

// 模拟数据
const mockFlows: ApplicationFlow[] = [
  {
    id: "AF1",
    studentName: "张三",
    studentId: "2021001",
    type: "国家奖学金",
    amount: 8000,
    currentStatus: "pending_college",
    isIntervened: false,
    interventionHistory: [],
    nodes: [
      { id: "n1", name: "提交申请", type: "start", status: "completed", completedAt: "2026-06-01 09:00" },
      { id: "n2", name: "辅导员初审", type: "approval", status: "completed", approver: "李老师", approverRole: "辅导员", completedAt: "2026-06-02 10:30", comment: "材料齐全，同意推荐" },
      { id: "n3", name: "院系复核", type: "approval", status: "processing", approver: "王主任", approverRole: "院系管理员" },
      { id: "n4", name: "校级终审", type: "approval", status: "pending", approver: "张处长", approverRole: "校级管理员" },
      { id: "n5", name: "公示", type: "condition", status: "pending" },
      { id: "n6", name: "发放", type: "end", status: "pending" },
    ],
  },
  {
    id: "AF2",
    studentName: "李四",
    studentId: "2021002",
    type: "国家助学金",
    amount: 3000,
    currentStatus: "pending_school",
    isIntervened: false,
    interventionHistory: [],
    nodes: [
      { id: "n1", name: "提交申请", type: "start", status: "completed", completedAt: "2026-06-01 14:00" },
      { id: "n2", name: "辅导员初审", type: "approval", status: "completed", approver: "赵老师", approverRole: "辅导员", completedAt: "2026-06-02 11:00", comment: "情况属实" },
      { id: "n3", name: "院系复核", type: "approval", status: "completed", approver: "刘主任", approverRole: "院系管理员", completedAt: "2026-06-03 15:00", comment: "同意" },
      { id: "n4", name: "校级终审", type: "approval", status: "processing", approver: "张处长", approverRole: "校级管理员" },
      { id: "n5", name: "公示", type: "condition", status: "pending" },
      { id: "n6", name: "发放", type: "end", status: "pending" },
    ],
  },
];

export default function ApprovalInterventionPage() {
  const [flows, setFlows] = useState<ApplicationFlow[]>(mockFlows);
  const [selectedFlow, setSelectedFlow] = useState<ApplicationFlow | null>(null);
  const [showInterveneModal, setShowInterveneModal] = useState(false);
  const [interveneType, setInterveneType] = useState<"skip" | "add" | "terminate" | "reassign">("skip");
  const [interveneReason, setInterveneReason] = useState("");
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInterveneTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      skip: "跳过节点",
      add: "添加节点",
      terminate: "终止流程",
      reassign: "重新分配",
    };
    return labels[type] || type;
  };

  // 执行流程干预
  const handleIntervene = useCallback(() => {
    if (!selectedFlow || !interveneReason.trim()) {
      showToast("请填写干预原因", "error");
      return;
    }

    const timestamp = Date.now();
    const newRecord: InterventionRecord = {
      id: `IR${timestamp}`,
      type: interveneType,
      operator: "超级管理员",
      operatedAt: new Date().toLocaleString(),
      reason: interveneReason,
      details: "",
    };

    let updatedNodes = [...selectedFlow.nodes];

    switch (interveneType) {
      case "skip":
        // 跳过节点
        if (selectedNode) {
          updatedNodes = updatedNodes.map(n => 
            n.id === selectedNode ? { ...n, status: "skipped" as const } : n
          );
          newRecord.details = `跳过节点: ${selectedNode}`;
        }
        break;
      case "add":
        // 添加新节点
        const newNode: FlowNode = {
          id: `n${timestamp}`,
          name: "补充审核",
          type: "approval",
          status: "pending",
          approver: "指定审批人",
          approverRole: "临时审核",
        };
        const insertIndex = updatedNodes.findIndex(n => n.id === selectedNode);
        if (insertIndex >= 0) {
          updatedNodes.splice(insertIndex + 1, 0, newNode);
        }
        newRecord.details = `在 ${selectedNode} 后添加补充审核节点`;
        break;
      case "terminate":
        // 终止流程
        updatedNodes = updatedNodes.map(n => 
          n.status === "pending" || n.status === "processing" ? { ...n, status: "skipped" as const } : n
        );
        newRecord.details = "流程已终止";
        break;
      case "reassign":
        // 重新分配审批人
        if (selectedNode) {
          updatedNodes = updatedNodes.map(n => 
            n.id === selectedNode ? { ...n, approver: "新审批人" } : n
          );
          newRecord.details = `重新分配节点 ${selectedNode} 的审批人`;
        }
        break;
    }

    setFlows(flows.map(f => 
      f.id === selectedFlow.id 
        ? { 
            ...f, 
            nodes: updatedNodes, 
            isIntervened: true,
            interventionHistory: [...f.interventionHistory, newRecord]
          } 
        : f
    ));

    showToast(`流程干预成功: ${getInterveneTypeLabel(interveneType)}`, "success");
    setShowInterveneModal(false);
    setInterveneReason("");
    setSelectedNode("");
  }, [selectedFlow, interveneReason, interveneType, selectedNode, flows]);

  const getNodeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-700 border-green-300",
      processing: "bg-blue-100 text-blue-700 border-blue-300",
      pending: "bg-gray-100 text-gray-600 border-gray-300",
      skipped: "bg-orange-100 text-orange-600 border-orange-300",
    };
    return colors[status] || colors.pending;
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "start": return <Play className="w-4 h-4" />;
      case "approval": return <User className="w-4 h-4" />;
      case "condition": return <GitBranch className="w-4 h-4" />;
      case "end": return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审批流程干预</h1>
          <p className="text-sm text-gray-500 mt-1">超级管理员可干预审批流程：跳过节点、添加节点、终止流程</p>
        </div>
      </div>

      {/* 流程列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-medium text-gray-700">进行中的审批流程</h2>
        </div>
        <div className="divide-y">
          {flows.map((flow) => (
            <div key={flow.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{flow.studentName}</div>
                    <div className="text-sm text-gray-500">{flow.studentId} · {flow.type}</div>
                  </div>
                  {flow.isIntervened && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                      已干预
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">¥{flow.amount.toLocaleString()}</span>
                  <button
                    onClick={() => setSelectedFlow(flow)}
                    className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-[#165DFF]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFlow(flow);
                      setShowInterveneModal(true);
                    }}
                    className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                  >
                    流程干预
                  </button>
                </div>
              </div>
              
              {/* 流程节点预览 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {flow.nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${getNodeStatusColor(node.status)}`}>
                      {getNodeTypeIcon(node.type)}
                      <span>{node.name}</span>
                    </div>
                    {index < flow.nodes.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 流程详情 */}
      {selectedFlow && !showInterveneModal && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">流程详情 - {selectedFlow.studentName}</h2>
            <button
              onClick={() => setSelectedFlow(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 流程图 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">审批流程图</h3>
            <div className="flex items-start gap-4 overflow-x-auto p-4 bg-gray-50 rounded-lg">
              {selectedFlow.nodes.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center min-w-[120px]">
                  <div className={`w-full p-3 rounded-lg border-2 ${getNodeStatusColor(node.status)} text-center`}>
                    <div className="flex justify-center mb-1">
                      {getNodeTypeIcon(node.type)}
                    </div>
                    <div className="font-medium text-sm">{node.name}</div>
                    {node.approver && (
                      <div className="text-xs mt-1 opacity-75">{node.approver}</div>
                    )}
                    {node.completedAt && (
                      <div className="text-xs mt-1 opacity-60">{node.completedAt}</div>
                    )}
                  </div>
                  {index < selectedFlow.nodes.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-gray-400 my-auto absolute" style={{ left: 'calc(100% - 12px)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 干预历史 */}
          {selectedFlow.interventionHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">干预历史</h3>
              <div className="space-y-2">
                {selectedFlow.interventionHistory.map((record) => (
                  <div key={record.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-orange-700">{getInterveneTypeLabel(record.type)}</span>
                      </div>
                      <span className="text-xs text-orange-600">{record.operatedAt}</span>
                    </div>
                    <div className="text-sm text-orange-600 mt-1">{record.details}</div>
                    <div className="text-xs text-orange-500 mt-1">原因: {record.reason}</div>
                    <div className="text-xs text-orange-500">操作人: {record.operator}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 流程干预弹窗 */}
      {showInterveneModal && selectedFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-orange-600">⚠️ 审批流程干预</h2>
              <button onClick={() => setShowInterveneModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700">
                  申请学生：<strong>{selectedFlow.studentName}</strong> ({selectedFlow.studentId})
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  申请类型：<strong>{selectedFlow.type}</strong> · 金额：<strong>¥{selectedFlow.amount.toLocaleString()}</strong>
                </p>
              </div>

              {/* 干预类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">干预类型</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInterveneType("skip")}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 ${interveneType === "skip" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <SkipForward className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-medium">跳过节点</div>
                      <div className="text-xs text-gray-500">跳过当前审批节点</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInterveneType("add")}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 ${interveneType === "add" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <Plus className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">添加节点</div>
                      <div className="text-xs text-gray-500">插入新的审批节点</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInterveneType("reassign")}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 ${interveneType === "reassign" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <User className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-medium">重新分配</div>
                      <div className="text-xs text-gray-500">更换审批人</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInterveneType("terminate")}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 ${interveneType === "terminate" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <Ban className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium text-red-600">终止流程</div>
                      <div className="text-xs text-gray-500">立即终止审批流程</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 节点选择 */}
              {(interveneType === "skip" || interveneType === "add" || interveneType === "reassign") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择节点 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedNode}
                    onChange={(e) => setSelectedNode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">请选择节点</option>
                    {selectedFlow.nodes.filter(n => n.status === "pending" || n.status === "processing").map(n => (
                      <option key={n.id} value={n.id}>{n.name} {n.approver ? `(${n.approver})` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 新审批人选择（重新分配时） */}
              {interveneType === "reassign" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新审批人 <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">请选择新审批人</option>
                    <option value="李老师">李老师（辅导员）</option>
                    <option value="王主任">王主任（院系管理员）</option>
                    <option value="张处长">张处长（校级管理员）</option>
                  </select>
                </div>
              )}

              {/* 干预原因 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  干预原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={interveneReason}
                  onChange={(e) => setInterveneReason(e.target.value)}
                  placeholder="请详细说明干预原因（必填）"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                />
              </div>

              {/* 警告提示 */}
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  ⚠️ 流程干预将修改审批路径，此操作将被记录到审计日志，请谨慎操作。
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowInterveneModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button
                  onClick={handleIntervene}
                  disabled={!interveneReason.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认干预
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
