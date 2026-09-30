"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  CheckCircle, 
  Copy, 
  Eye, 
  EyeOff, 
  Key, 
  Plus, 
  RefreshCw, 
  Save, 
  Settings, 
  Trash2,
  Zap
} from "lucide-react";

interface ModelProvider {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  baseUrl: string;
  status: "active" | "inactive" | "error";
  lastUsed: string;
  requestCount: number;
}

export default function LLMConfigPage() {
  const [providers, setProviders] = useState<ModelProvider[]>([
    {
      id: "1",
      name: "DeepSeek",
      type: "deepseek",
      apiKey: "REPLACE_WITH_SECRET_MANAGER_VALUE",
      baseUrl: "https://api.deepseek.com/v1",
      status: "active",
      lastUsed: "2024-01-15 14:30",
      requestCount: 1256,
    },
    {
      id: "2",
      name: "豆包大模型",
      type: "doubao",
      apiKey: "REPLACE_WITH_SECRET_MANAGER_VALUE",
      baseUrl: "https://api.doubao.com/v1",
      status: "active",
      lastUsed: "2024-01-15 13:45",
      requestCount: 856,
    },
  ]);

  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ModelProvider>>({});

  const toggleApiKey = (id: string) => {
    setShowApiKey({ ...showApiKey, [id]: !showApiKey[id] });
  };

  const handleEdit = (provider: ModelProvider) => {
    setEditing(provider.id);
    setEditForm(provider);
  };

  const handleSave = () => {
    if (editing && editForm) {
      setProviders(providers.map(p => 
        p.id === editing ? { ...p, ...editForm } as ModelProvider : p
      ));
      setEditing(null);
      setEditForm({});
    }
  };

  const handleTest = (id: string) => {
    alert(`测试连接 ${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">正常</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">未启用</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-700">异常</Badge>;
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
            <Brain className="w-7 h-7 text-purple-500" />
            大模型接入管理
          </h1>
          <p className="text-gray-500 mt-1">配置和管理AI大模型服务接口</p>
        </div>
        <Button className="bg-[#165DFF]">
          <Plus className="w-4 h-4 mr-2" />
          添加模型
        </Button>
      </div>

      {/* 使用统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{providers.length}</p>
                <p className="text-sm text-gray-500">已接入模型</p>
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
                <p className="text-2xl font-bold">{providers.filter(p => p.status === "active").length}</p>
                <p className="text-sm text-gray-500">正常运行</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{providers.reduce((sum, p) => sum + p.requestCount, 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">总调用次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Key className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-gray-500">API Key 数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模型列表 */}
      <Card>
        <CardHeader>
          <CardTitle>已接入模型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="p-4 border rounded-lg">
                {editing === provider.id ? (
                  // 编辑模式
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">模型名称</label>
                        <Input 
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">模型类型</label>
                        <Input 
                          value={editForm.type || ""}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">API Key</label>
                      <Input 
                        value={editForm.apiKey || ""}
                        onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Base URL</label>
                      <Input 
                        value={editForm.baseUrl || ""}
                        onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
                      <Button onClick={handleSave} className="bg-[#165DFF]">
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 查看模式
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Brain className="w-6 h-6 text-purple-500" />
                        <span className="font-medium text-lg">{provider.name}</span>
                        <Badge variant="outline">{provider.type}</Badge>
                      </div>
                      {getStatusBadge(provider.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">API Key: </span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded">
                          {showApiKey[provider.id] ? provider.apiKey : "••••••••••••"}
                        </code>
                        <button 
                          onClick={() => toggleApiKey(provider.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey[provider.id] ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />}
                        </button>
                      </div>
                      <div>
                        <span className="text-gray-500">Base URL: </span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded">{provider.baseUrl}</code>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        最后使用: {provider.lastUsed} | 调用次数: {provider.requestCount.toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleTest(provider.id)}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          测试连接
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(provider)}>
                          <Settings className="w-3 h-3 mr-1" />
                          配置
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 模型选择策略 */}
      <Card>
        <CardHeader>
          <CardTitle>模型选择策略</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">对话模型</span>
                <Badge className="bg-purple-100 text-purple-700">DeepSeek</Badge>
              </div>
              <p className="text-sm text-gray-500">用于智能问答、对话交互场景</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">评估模型</span>
                <Badge className="bg-purple-100 text-purple-700">豆包</Badge>
              </div>
              <p className="text-sm text-gray-500">用于申请材料评估、风险预测</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">向量化模型</span>
                <Badge className="bg-purple-100 text-purple-700">text-embedding-3-small</Badge>
              </div>
              <p className="text-sm text-gray-500">用于知识库向量化存储</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
