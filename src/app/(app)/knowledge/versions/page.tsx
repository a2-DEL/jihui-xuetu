"use client";

import React, { useState } from "react";
import {
  History,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  Plus,
  Calendar,
  Database,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface KnowledgeVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  create_time: string;
  create_by: string;
  doc_count: number;
  chunk_count: number;
  vector_count: number;
  size: string;
  is_production: boolean;
  status: "active" | "archived" | "restoring";
}

const mockVersions: KnowledgeVersion[] = [
  { id: "v1", version: "v2.3.0", name: "2026年6月正式版", description: "包含最新的资助政策文件，新增助学金申请流程", create_time: "2026-06-05 08:00", create_by: "系统自动备份", doc_count: 156, chunk_count: 2456, vector_count: 2456, size: "2.4 GB", is_production: true, status: "active" },
  { id: "v2", version: "v2.2.0", name: "2026年5月正式版", description: "国家奖学金评审办法更新版本", create_time: "2026-05-20 08:00", create_by: "系统自动备份", doc_count: 148, chunk_count: 2234, vector_count: 2234, size: "2.2 GB", is_production: false, status: "active" },
  { id: "v3", version: "v2.1.0", name: "2026年4月正式版", description: "新增勤工助学管理相关文件", create_time: "2026-04-15 08:00", create_by: "系统自动备份", doc_count: 135, chunk_count: 2012, vector_count: 2012, size: "2.0 GB", is_production: false, status: "active" },
  { id: "v4", version: "v2.0.0", name: "春季学期初始化版本", description: "新学期政策文件初始化", create_time: "2026-03-01 08:00", create_by: "张主任", doc_count: 120, chunk_count: 1856, vector_count: 1856, size: "1.8 GB", is_production: false, status: "active" },
  { id: "v5", version: "v1.5.0", name: "2025年秋季学期版", description: "上学期稳定版本", create_time: "2025-09-01 08:00", create_by: "系统自动备份", doc_count: 98, chunk_count: 1432, vector_count: 1432, size: "1.5 GB", is_production: false, status: "archived" },
];

export default function KnowledgeVersions() {
  const [versions, setVersions] = useState<KnowledgeVersion[]>(mockVersions);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  
  // 新版本表单
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDesc, setNewVersionDesc] = useState("");

  // 统计数据
  const stats = {
    total: versions.length,
    active: versions.filter(v => v.status === "active").length,
    archived: versions.filter(v => v.status === "archived").length,
    production: versions.find(v => v.is_production),
  };

  // 创建新版本快照
  const handleCreateSnapshot = () => {
    if (!newVersionName.trim()) return;
    
    const newVersion: KnowledgeVersion = {
      id: `v${Date.now()}`,
      version: `v2.${versions.length + 1}.0`,
      name: newVersionName,
      description: newVersionDesc,
      create_time: new Date().toLocaleString("zh-CN"),
      create_by: "当前用户",
      doc_count: stats.production?.doc_count || 0,
      chunk_count: stats.production?.chunk_count || 0,
      vector_count: stats.production?.vector_count || 0,
      size: stats.production?.size || "0 GB",
      is_production: false,
      status: "active",
    };
    
    setVersions([newVersion, ...versions]);
    setShowCreateModal(false);
    setNewVersionName("");
    setNewVersionDesc("");
  };

  // 恢复版本
  const handleRestore = async (versionId: string) => {
    setRestoring(true);
    
    // 模拟恢复过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setVersions(versions.map(v => ({
      ...v,
      is_production: v.id === versionId,
      status: v.id === versionId ? "active" : v.status === "restoring" ? "active" : v.status
    })));
    
    setShowRestoreConfirm(null);
    setRestoring(false);
  };

  // 删除版本
  const handleDelete = (versionId: string) => {
    setVersions(versions.filter(v => v.id !== versionId));
    setShowDeleteConfirm(null);
  };

  // 下载版本
  const handleDownload = (version: KnowledgeVersion) => {
    // 模拟下载
    alert(`正在下载知识库快照 ${version.version}...`);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识库版本管理</h1>
          <p className="text-gray-500 mt-1">管理知识库快照，支持一键回滚到历史版本</p>
        </div>
        <Button className="bg-[#165DFF] hover:bg-blue-600" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建快照
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">版本总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <GitBranch className="w-8 h-8 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活跃版本</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已归档</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">当前生产版本</p>
                <p className="text-lg font-bold text-purple-600">{stats.production?.version || "-"}</p>
              </div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 版本列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#165DFF]" />
            版本历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.map((version) => (
              <div 
                key={version.id} 
                className={`border rounded-lg p-4 hover:bg-gray-50 transition ${
                  version.is_production ? "border-green-300 bg-green-50/30" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {version.version.split(".")[1]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{version.name}</h4>
                          <Badge className="bg-gray-100 text-gray-600">{version.version}</Badge>
                          {version.is_production && (
                            <Badge className="bg-green-100 text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              生产环境
                            </Badge>
                          )}
                          {version.status === "archived" && (
                            <Badge className="bg-gray-100 text-gray-500">
                              <Archive className="w-3 h-3 mr-1" />
                              已归档
                            </Badge>
                          )}
                          {version.status === "restoring" && (
                            <Badge className="bg-yellow-100 text-yellow-600">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              恢复中
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{version.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {version.create_time}
                      </span>
                      <span>创建者: {version.create_by}</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {version.doc_count} 个文档
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {version.chunk_count} 个片段
                      </span>
                      <span>大小: {version.size}</span>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDownload(version)}
                      title="下载快照"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {!version.is_production && version.status === "active" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-purple-500 text-purple-600 hover:bg-purple-50"
                        onClick={() => setShowRestoreConfirm(version.id)}
                        title="恢复此版本"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        恢复
                      </Button>
                    )}
                    {!version.is_production && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowDeleteConfirm(version.id)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                    >
                      {expandedVersion === version.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* 展开详情 */}
                {expandedVersion === version.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 bg-white rounded border">
                        <p className="text-xs text-gray-500">文档数量</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{version.doc_count}</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <p className="text-xs text-gray-500">知识片段</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{version.chunk_count}</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <p className="text-xs text-gray-500">向量数量</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{version.vector_count}</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <p className="text-xs text-gray-500">存储大小</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{version.size}</p>
                      </div>
                    </div>
                    
                    {version.is_production && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        当前生产环境正在使用此版本，如需切换版本请选择其他版本点击“恢复”
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 创建快照弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">创建知识库快照</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">快照名称 *</label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="如：2026年7月正式版"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">描述说明</label>
                <textarea
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  placeholder="输入快照描述..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <Database className="w-4 h-4 inline mr-1" />
                将对当前知识库创建完整快照，包含所有文档和向量数据
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                取消
              </Button>
              <Button 
                className="bg-[#165DFF] hover:bg-blue-600"
                onClick={handleCreateSnapshot}
                disabled={!newVersionName.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建快照
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 恢复确认弹窗 */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">确认恢复版本</h3>
                <p className="text-sm text-gray-500">此操作将替换当前生产环境</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              确定要将知识库恢复到版本 <span className="font-medium">{versions.find(v => v.id === showRestoreConfirm)?.version}</span> 吗？
              当前生产版本将被保留为历史版本。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRestoreConfirm(null)}>
                取消
              </Button>
              <Button 
                className="bg-purple-500 hover:bg-purple-600"
                onClick={() => handleRestore(showRestoreConfirm)}
                disabled={restoring}
              >
                {restoring ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                {restoring ? "恢复中..." : "确认恢复"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可恢复</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              确定要删除版本 <span className="font-medium">{versions.find(v => v.id === showDeleteConfirm)?.version}</span> 吗？
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                取消
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

