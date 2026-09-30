"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Play, Pause, Settings, Plus, Trash2, Copy, ChevronRight,
  Circle, Square, Diamond, ArrowRight, Clock, CheckCircle2,
  XCircle, AlertCircle, GitBranch, Zap, MoreHorizontal,
  MousePointer, Move, Save, X, Workflow
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowNode {
  id: string;
  type: "start" | "end" | "approval" | "condition" | "ai" | "notify" | "action" | "trigger";
  name: string;
  config?: Record<string, unknown>;
  x: number;
  y: number;
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggers: string[];
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowPage() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 编辑器状态
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);

  useEffect(() => {
    // 模拟数据
    setWorkflows([
      {
        id: "1",
        name: "国家奖学金审批流程",
        description: "国家奖学金申请的标准审批流程",
        status: "active",
        nodes: [
          { id: "n1", type: "start", name: "开始", x: 50, y: 100 },
          { id: "n2", type: "ai", name: "AI初审", x: 200, y: 100 },
          { id: "n3", type: "approval", name: "辅导员审核", x: 350, y: 100 },
          { id: "n4", type: "condition", name: "金额判断", x: 500, y: 100 },
          { id: "n5", type: "approval", name: "学院审批", x: 650, y: 50 },
          { id: "n6", type: "approval", name: "学校审批", x: 650, y: 150 },
          { id: "n7", type: "notify", name: "通知学生", x: 800, y: 100 },
          { id: "n8", type: "end", name: "结束", x: 950, y: 100 },
        ],
        connections: [
          { id: "c1", from: "n1", to: "n2" },
          { id: "c2", from: "n2", to: "n3" },
          { id: "c3", from: "n3", to: "n4" },
          { id: "c4", from: "n4", to: "n5", label: "≥5000" },
          { id: "c5", from: "n4", to: "n6", label: "<5000" },
          { id: "c6", from: "n5", to: "n7" },
          { id: "c7", from: "n6", to: "n7" },
          { id: "c8", from: "n7", to: "n8" },
        ],
        triggers: ["申请提交"],
        createdAt: "2026-01-15",
        updatedAt: "2026-05-20",
      },
      {
        id: "2",
        name: "国家助学金审批流程",
        description: "国家助学金申请的审批流程",
        status: "active",
        nodes: [
          { id: "n1", type: "start", name: "开始", x: 50, y: 100 },
          { id: "n2", type: "approval", name: "辅导员审核", x: 200, y: 100 },
          { id: "n3", type: "approval", name: "学院审批", x: 350, y: 100 },
          { id: "n4", type: "ai", name: "AI复核", x: 500, y: 100 },
          { id: "n5", type: "notify", name: "结果通知", x: 650, y: 100 },
          { id: "n6", type: "end", name: "结束", x: 800, y: 100 },
        ],
        connections: [
          { id: "c1", from: "n1", to: "n2" },
          { id: "c2", from: "n2", to: "n3" },
          { id: "c3", from: "n3", to: "n4" },
          { id: "c4", from: "n4", to: "n5" },
          { id: "c5", from: "n5", to: "n6" },
        ],
        triggers: ["申请提交"],
        createdAt: "2026-02-10",
        updatedAt: "2026-04-15",
      },
      {
        id: "3",
        name: "临时困难补助流程",
        description: "临时困难补助快速审批流程",
        status: "draft",
        nodes: [
          { id: "n1", type: "start", name: "开始", x: 50, y: 100 },
          { id: "n2", type: "ai", name: "材料审核", x: 200, y: 100 },
          { id: "n3", type: "approval", name: "快速审批", x: 350, y: 100 },
          { id: "n4", type: "notify", name: "发放通知", x: 500, y: 100 },
          { id: "n5", type: "end", name: "结束", x: 650, y: 100 },
        ],
        connections: [
          { id: "c1", from: "n1", to: "n2" },
          { id: "c2", from: "n2", to: "n3" },
          { id: "c3", from: "n3", to: "n4" },
          { id: "c4", from: "n4", to: "n5" },
        ],
        triggers: ["紧急申请"],
        createdAt: "2026-05-01",
        updatedAt: "2026-05-25",
      },
    ]);
  }, []);

  const getNodeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      start: <Circle className="w-4 h-4 text-green-500" />,
      end: <Square className="w-4 h-4 text-gray-500" />,
      approval: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
      condition: <Diamond className="w-4 h-4 text-amber-500" />,
      ai: <Zap className="w-4 h-4 text-purple-500" />,
      notify: <AlertCircle className="w-4 h-4 text-cyan-500" />,
      action: <Play className="w-4 h-4 text-blue-500" />,
      trigger: <Zap className="w-4 h-4 text-orange-500" />,
    };
    return icons[type] || <Circle className="w-4 h-4" />;
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      start: "border-green-300 bg-green-50",
      end: "border-gray-300 bg-gray-50",
      approval: "border-blue-300 bg-blue-50",
      condition: "border-amber-300 bg-amber-50",
      ai: "border-purple-300 bg-purple-50",
      notify: "border-cyan-300 bg-cyan-50",
      action: "border-indigo-300 bg-indigo-50",
      trigger: "border-orange-300 bg-orange-50",
    };
    return colors[type] || "border-gray-300 bg-white";
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      active: { label: "已启用", color: "bg-green-100 text-green-700" },
      inactive: { label: "已停用", color: "bg-gray-100 text-gray-700" },
      draft: { label: "草稿", color: "bg-amber-100 text-amber-700" },
    };
    return statuses[status] || statuses.draft;
  };

  const handleEditWorkflow = (workflow: WorkflowData) => {
    setSelectedWorkflow(workflow);
    setViewMode("edit");
    setSelectedNode(null);
  };

  const handleToggleStatus = (workflow: WorkflowData) => {
    const newStatus = workflow.status === "active" ? "inactive" : "active";
    setWorkflows(workflows.map(w => 
      w.id === workflow.id ? { ...w, status: newStatus as "active" | "inactive" } : w
    ));
    toast({ title: "成功", description: `工作流已${newStatus === "active" ? "启用" : "停用"}` });
  };

  // 添加新节点
  const handleAddNode = (type: WorkflowNode["type"]) => {
    if (!selectedWorkflow) return;
    
    const nodeNames: Record<string, string> = {
      start: "开始",
      end: "结束",
      approval: "审批节点",
      condition: "条件判断",
      ai: "AI处理",
      notify: "通知节点",
      action: "动作节点",
      trigger: "触发器",
    };

    // 使用计数器生成稳定的ID
    const nodeCount = selectedWorkflow.nodes.length;
    const newNode: WorkflowNode = {
      id: `n_new_${nodeCount}`,
      type,
      name: nodeNames[type] || "新节点",
      x: 100 + (nodeCount % 5) * 120,
      y: 50 + Math.floor(nodeCount / 5) * 80,
    };

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode],
    });
    toast({ title: "已添加", description: `${nodeNames[type]}已添加到画布` });
  };

  // 删除节点
  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: selectedWorkflow.nodes.filter(n => n.id !== nodeId),
      connections: selectedWorkflow.connections.filter(c => c.from !== nodeId && c.to !== nodeId),
    });
    setSelectedNode(null);
    toast({ title: "已删除", description: "节点已删除" });
  };

  // 保存工作流
  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) return;
    
    setWorkflows(workflows.map(w => 
      w.id === selectedWorkflow.id ? { ...selectedWorkflow, updatedAt: new Date().toISOString().split("T")[0] } : w
    ));
    toast({ title: "保存成功", description: "工作流配置已保存" });
  };

  // 节点拖拽处理
  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.preventDefault();
    setDraggedNode(node);
    setSelectedNode(node);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current || !selectedWorkflow) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 30;
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: selectedWorkflow.nodes.map(n => 
        n.id === draggedNode.id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n
      ),
    });
  };

  const handleCanvasMouseUp = () => {
    setDraggedNode(null);
  };

  // 渲染连接线
  const renderConnections = () => {
    if (!selectedWorkflow) return null;
    
    return selectedWorkflow.connections.map(conn => {
      const fromNode = selectedWorkflow.nodes.find(n => n.id === conn.from);
      const toNode = selectedWorkflow.nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return null;
      
      const x1 = fromNode.x + 60;
      const y1 = fromNode.y + 30;
      const x2 = toNode.x + 60;
      const y2 = toNode.y + 30;
      
      const midX = (x1 + x2) / 2;
      
      return (
        <g key={conn.id}>
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          {conn.label && (
            <text
              x={midX}
              y={(y1 + y2) / 2 - 5}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    });
  };

  if (viewMode === "edit" && selectedWorkflow) {
    return (
      <div className="h-screen flex flex-col">
        {/* 编辑器工具栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setViewMode("list")}>
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              返回列表
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{selectedWorkflow.name}</h1>
              <p className="text-sm text-gray-500">{selectedWorkflow.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveWorkflow}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" />
              测试运行
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* 左侧节点面板 */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <h3 className="font-medium mb-4">节点类型</h3>
            <div className="space-y-2">
              {[
                { type: "trigger" as const, name: "触发器", desc: "流程触发入口" },
                { type: "ai" as const, name: "AI节点", desc: "AI智能处理" },
                { type: "approval" as const, name: "审批节点", desc: "人工审批" },
                { type: "condition" as const, name: "条件分支", desc: "条件判断" },
                { type: "action" as const, name: "动作节点", desc: "执行操作" },
                { type: "notify" as const, name: "通知节点", desc: "发送通知" },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => handleAddNode(item.type)}
                  className="w-full p-3 bg-white rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${getNodeColor(item.type)}`}>
                      {getNodeIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <h3 className="font-medium mt-6 mb-4">快捷操作</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                复制流程
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <GitBranch className="w-4 h-4 mr-2" />
                添加分支
              </Button>
            </div>
          </div>

          {/* 画布区域 */}
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-auto bg-gray-100"
            style={{ backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {/* SVG连接线层 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {renderConnections()}
            </svg>

            {/* 节点 */}
            {selectedWorkflow.nodes.map(node => (
              <div
                key={node.id}
                className={`absolute w-32 cursor-move select-none ${
                  selectedNode?.id === node.id ? "ring-2 ring-blue-500 ring-offset-2" : ""
                }`}
                style={{ left: node.x, top: node.y }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onDoubleClick={() => setShowNodeConfig(true)}
              >
                <div className={`p-3 rounded-lg border-2 ${getNodeColor(node.type)} shadow-sm`}>
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node.type)}
                    <span className="text-sm font-medium truncate">{node.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 右侧属性面板 */}
          <div className="w-72 border-l bg-white p-4">
            {selectedNode ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">节点属性</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>节点名称</Label>
                    <Input 
                      value={selectedNode.name}
                      onChange={(e) => {
                        const updatedNode = { ...selectedNode, name: e.target.value };
                        setSelectedNode(updatedNode);
                        setSelectedWorkflow({
                          ...selectedWorkflow,
                          nodes: selectedWorkflow.nodes.map(n => 
                            n.id === selectedNode.id ? updatedNode : n
                          ),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>节点类型</Label>
                    <Select value={selectedNode.type} onValueChange={(v) => {
                      const updatedNode = { ...selectedNode, type: v as WorkflowNode["type"] };
                      setSelectedNode(updatedNode);
                      setSelectedWorkflow({
                        ...selectedWorkflow,
                        nodes: selectedWorkflow.nodes.map(n => 
                          n.id === selectedNode.id ? updatedNode : n
                        ),
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trigger">触发器</SelectItem>
                        <SelectItem value="ai">AI节点</SelectItem>
                        <SelectItem value="approval">审批节点</SelectItem>
                        <SelectItem value="condition">条件分支</SelectItem>
                        <SelectItem value="action">动作节点</SelectItem>
                        <SelectItem value="notify">通知节点</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedNode.type === "ai" && (
                    <div>
                      <Label>AI模型</Label>
                      <Select defaultValue="deepseek">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deepseek">DeepSeek V3</SelectItem>
                          <SelectItem value="gpt4">GPT-4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedNode.type === "approval" && (
                    <>
                      <div>
                        <Label>审批人</Label>
                        <Select defaultValue="counselor">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="counselor">辅导员</SelectItem>
                            <SelectItem value="college">院系管理员</SelectItem>
                            <SelectItem value="school">校级管理员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>超时设置</Label>
                        <Input defaultValue="48" type="number" />
                      </div>
                    </>
                  )}
                  
                  {selectedNode.type === "condition" && (
                    <div>
                      <Label>条件表达式</Label>
                      <Input placeholder="如: amount >= 5000" />
                    </div>
                  )}
                  
                  {selectedNode.type === "notify" && (
                    <div>
                      <Label>通知方式</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部</SelectItem>
                          <SelectItem value="email">邮件</SelectItem>
                          <SelectItem value="sms">短信</SelectItem>
                          <SelectItem value="wechat">微信</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleDeleteNode(selectedNode.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除节点
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Workflow className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>选择节点查看属性</p>
                <p className="text-sm mt-1">或从左侧拖拽添加新节点</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作流管理</h1>
          <p className="text-gray-500 mt-1">设计和管理审批工作流（可视化编排）</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            导入模板
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建工作流
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">工作流列表</TabsTrigger>
          <TabsTrigger value="templates">流程模板</TabsTrigger>
          <TabsTrigger value="history">执行历史</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {workflows.map((workflow) => {
              const statusInfo = getStatusBadge(workflow.status);
              return (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                      </div>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 流程预览 */}
                      <div className="flex items-center gap-1 p-3 bg-gray-50 rounded-lg overflow-x-auto">
                        {workflow.nodes.slice(0, 5).map((node, i) => (
                          <React.Fragment key={node.id}>
                            <div className="flex flex-col items-center min-w-fit">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${getNodeColor(node.type)}`}>
                                {getNodeIcon(node.type)}
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{node.name}</span>
                            </div>
                            {i < Math.min(workflow.nodes.length - 1, 4) && (
                              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                        {workflow.nodes.length > 5 && (
                          <span className="text-xs text-gray-400">+{workflow.nodes.length - 5}</span>
                        )}
                      </div>

                      {/* 触发条件 */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">触发条件:</span>
                        {workflow.triggers.map((t, i) => (
                          <Badge key={i} variant="outline">{t}</Badge>
                        ))}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditWorkflow(workflow)}>
                          <Settings className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                        <Button 
                          size="sm" 
                          variant={workflow.status === "active" ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(workflow)}
                        >
                          {workflow.status === "active" ? (
                            <><Pause className="w-4 h-4 mr-1" />停用</>
                          ) : (
                            <><Play className="w-4 h-4 mr-1" />启用</>
                          )}
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "标准审批流程", desc: "适用于一般资助申请", nodes: 6 },
              { name: "快速审批流程", desc: "适用于紧急情况", nodes: 4 },
              { name: "多级审批流程", desc: "适用于大额申请", nodes: 8 },
              { name: "AI辅助流程", desc: "AI预审+人工复核", nodes: 5 },
              { name: "并行审批流程", desc: "多部门同时审批", nodes: 7 },
              { name: "条件分支流程", desc: "根据金额分支审批", nodes: 9 },
            ].map((template, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <GitBranch className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{template.nodes} 个节点</span>
                    <Button variant="outline" size="sm">
                      使用模板
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { time: "2026-05-30 14:30", workflow: "国家奖学金审批流程", instance: "APP-2026-156", status: "success", duration: "2天3小时" },
                  { time: "2026-05-30 10:15", workflow: "国家助学金审批流程", instance: "APP-2026-148", status: "running", duration: "进行中" },
                  { time: "2026-05-29 16:45", workflow: "临时困难补助流程", instance: "APP-2026-142", status: "success", duration: "4小时" },
                  { time: "2026-05-29 09:20", workflow: "国家奖学金审批流程", instance: "APP-2026-138", status: "failed", duration: "驳回" },
                ].map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.status === "success" ? "bg-green-100" : 
                        record.status === "running" ? "bg-blue-100" : "bg-red-100"
                      }`}>
                        {record.status === "success" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                         record.status === "running" ? <Clock className="w-5 h-5 text-blue-600" /> :
                         <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{record.workflow}</p>
                        <p className="text-sm text-gray-500">{record.instance}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{record.time}</p>
                      <p className="text-sm">{record.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
