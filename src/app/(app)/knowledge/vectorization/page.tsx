"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  BarChart3,
  TrendingUp,
  Database,
  HardDrive,
  Activity,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface VectorTask {
  id: string;
  doc_name: string;
  doc_size: string;
  status: "pending" | "parsing" | "chunking" | "vectorizing" | "completed" | "error" | "paused";
  progress: number;
  chunks: number;
  total_chunks: number;
  vectors: number;
  start_time: string;
  elapsed?: string;
  error_msg?: string;
}

const mockTasks: VectorTask[] = [
  { id: "1", doc_name: "国家奖学金评审办法.pdf", doc_size: "2.3 MB", status: "completed", progress: 100, chunks: 45, total_chunks: 45, vectors: 45, start_time: "2026-06-05 10:30", elapsed: "2分15秒" },
  { id: "2", doc_name: "助学金申请指南.docx", doc_size: "1.5 MB", status: "vectorizing", progress: 75, chunks: 28, total_chunks: 32, vectors: 21, start_time: "2026-06-05 11:00", elapsed: "1分30秒" },
  { id: "3", doc_name: "勤工助学管理办法.pdf", doc_size: "3.1 MB", status: "chunking", progress: 40, chunks: 18, total_chunks: 45, vectors: 0, start_time: "2026-06-05 11:05" },
  { id: "4", doc_name: "生源地贷款政策.pdf", doc_size: "1.8 MB", status: "parsing", progress: 15, chunks: 0, total_chunks: 0, vectors: 0, start_time: "2026-06-05 11:10" },
  { id: "5", doc_name: "资助政策汇编.pdf", doc_size: "8.5 MB", status: "error", progress: 30, chunks: 12, total_chunks: 0, vectors: 0, start_time: "2026-06-05 10:45", error_msg: "文档解析失败：PDF格式不兼容" },
  { id: "6", doc_name: "学生手册2025.pdf", doc_size: "5.2 MB", status: "paused", progress: 50, chunks: 35, total_chunks: 70, vectors: 0, start_time: "2026-06-05 10:00" },
  { id: "7", doc_name: "奖学金申请模板.docx", doc_size: "0.8 MB", status: "pending", progress: 0, chunks: 0, total_chunks: 0, vectors: 0, start_time: "2026-06-05 11:15" },
];

const statusConfig = {
  pending: { label: "等待中", color: "bg-gray-100 text-gray-600", icon: Clock, progressLabel: "等待开始" },
  parsing: { label: "解析中", color: "bg-blue-100 text-blue-600", icon: RefreshCw, progressLabel: "正在解析文档" },
  chunking: { label: "分段中", color: "bg-purple-100 text-purple-600", icon: Layers, progressLabel: "正在分段处理" },
  vectorizing: { label: "向量化", color: "bg-orange-100 text-orange-600", icon: Activity, progressLabel: "正在生成向量" },
  completed: { label: "已完成", color: "bg-green-100 text-green-600", icon: CheckCircle, progressLabel: "处理完成" },
  error: { label: "处理失败", color: "bg-red-100 text-red-600", icon: AlertCircle, progressLabel: "处理出错" },
  paused: { label: "已暂停", color: "bg-yellow-100 text-yellow-600", icon: PauseCircle, progressLabel: "已暂停" },
};

export default function VectorizationMonitor() {
  const [tasks, setTasks] = useState<VectorTask[]>(mockTasks);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 计算统计数据
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    processing: tasks.filter(t => ["parsing", "chunking", "vectorizing"].includes(t.status)).length,
    completed: tasks.filter(t => t.status === "completed").length,
    error: tasks.filter(t => t.status === "error").length,
    totalChunks: tasks.reduce((sum, t) => sum + t.chunks, 0),
    totalVectors: tasks.reduce((sum, t) => sum + t.vectors, 0),
  };

  // 模拟进度更新
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === "parsing" && task.progress < 30) {
          return { ...task, progress: task.progress + 2 };
        }
        if (task.status === "chunking" && task.progress < 60) {
          return { ...task, progress: task.progress + 3, chunks: task.chunks + 1 };
        }
        if (task.status === "vectorizing" && task.progress < 100) {
          const newProgress = Math.min(task.progress + 2, 100);
          const newVectors = Math.floor(newProgress / 100 * task.total_chunks);
          return { 
            ...task, 
            progress: newProgress, 
            vectors: newVectors,
            status: newProgress >= 100 ? "completed" : "vectorizing"
          };
        }
        return task;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 暂停任务
  const handlePause = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId && ["parsing", "chunking", "vectorizing"].includes(t.status)
        ? { ...t, status: "paused" as const }
        : t
    ));
  };

  // 恢复任务
  const handleResume = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId && t.status === "paused"
        ? { ...t, status: "vectorizing" as const }
        : t
    ));
  };

  // 重试任务
  const handleRetry = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId && t.status === "error"
        ? { ...t, status: "pending" as const, progress: 0, chunks: 0, vectors: 0 }
        : t
    ));
  };

  // 取消任务
  const handleCancel = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">向量化监控</h1>
          <p className="text-gray-500 mt-1">监控文档解析、分段和向量化的实时进度</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "border-green-500 text-green-600" : ""}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "自动刷新中" : "开启自动刷新"}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">总任务数</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">等待中</p>
            <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">处理中</p>
            <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">已完成</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">失败</p>
            <p className="text-2xl font-bold text-red-600">{stats.error}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">知识片段</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalChunks}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">向量数</p>
            <p className="text-2xl font-bold text-[#165DFF]">{stats.totalVectors}</p>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#165DFF]" />
            向量化任务列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => {
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;
              
              return (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{task.doc_name}</h4>
                          <p className="text-xs text-gray-500">{task.doc_size} · 开始时间: {task.start_time}</p>
                        </div>
                        <Badge className={status.color}>
                          <StatusIcon className={`w-3 h-3 mr-1 ${task.status === "parsing" ? "animate-spin" : ""}`} />
                          {status.label}
                        </Badge>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{status.progressLabel}</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress 
                          value={task.progress} 
                          className={`h-2 ${
                            task.status === "error" ? "bg-red-100" : 
                            task.status === "completed" ? "bg-green-100" : "bg-gray-100"
                          }`}
                        />
                      </div>
                      
                      {/* 详细信息 */}
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Layers className="w-4 h-4" />
                          分段: <span className="font-medium">{task.chunks}</span>
                          {task.total_chunks > 0 && <span className="text-gray-400">/{task.total_chunks}</span>}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Database className="w-4 h-4" />
                          向量: <span className="font-medium">{task.vectors}</span>
                        </span>
                        {task.elapsed && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            耗时: <span className="font-medium">{task.elapsed}</span>
                          </span>
                        )}
                      </div>
                      
                      {/* 错误信息 */}
                      {task.status === "error" && task.error_msg && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-600 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          {task.error_msg}
                        </div>
                      )}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 ml-4">
                      {["parsing", "chunking", "vectorizing"].includes(task.status) && (
                        <Button size="sm" variant="outline" onClick={() => handlePause(task.id)}>
                          <PauseCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {task.status === "paused" && (
                        <Button size="sm" variant="outline" onClick={() => handleResume(task.id)}>
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {task.status === "error" && (
                        <Button size="sm" variant="outline" onClick={() => handleRetry(task.id)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {["pending", "paused", "error"].includes(task.status) && (
                        <Button size="sm" variant="ghost" onClick={() => handleCancel(task.id)}>
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      >
                        {expandedTask === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* 展开详情 */}
                  {expandedTask === task.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-gray-500">解析进度</p>
                          <p className="font-medium mt-1">
                            {task.progress >= 30 ? "100%" : `${Math.round(task.progress / 30 * 100)}%`}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-gray-500">分段进度</p>
                          <p className="font-medium mt-1">
                            {task.progress < 30 ? "等待中" : 
                             task.progress >= 60 ? "100%" : 
                             `${Math.round((task.progress - 30) / 30 * 100)}%`}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-gray-500">向量化进度</p>
                          <p className="font-medium mt-1">
                            {task.progress < 60 ? "等待中" : 
                             `${Math.round((task.progress - 60) / 40 * 100)}%`}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-gray-500">预计剩余时间</p>
                          <p className="font-medium mt-1">
                            {task.status === "completed" ? "已完成" :
                             task.status === "error" ? "-" :
                             task.status === "paused" ? "已暂停" :
                             `${Math.round((100 - task.progress) / 10)}秒`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 性能统计 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              处理性能统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">平均解析速度</span>
                <span className="font-medium">2.5 MB/秒</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">平均分段速度</span>
                <span className="font-medium">15 段/秒</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">平均向量化速度</span>
                <span className="font-medium">20 向量/秒</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">大文档处理时间 (100页)</span>
                <span className="font-medium text-green-600">&lt; 5分钟</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              今日处理统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">今日处理文档</span>
                <span className="font-medium">28 个</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">生成知识片段</span>
                <span className="font-medium">1,256 段</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">生成向量数</span>
                <span className="font-medium">1,256 个</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">成功率</span>
                <span className="font-medium text-green-600">96.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
