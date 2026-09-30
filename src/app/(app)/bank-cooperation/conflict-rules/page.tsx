"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  FileText,
  Settings,
  X,
} from "lucide-react";

const conflictRules = [
  {
    id: 1,
    name: "金额冲突处理",
    description: "当本地金额与银行金额不一致时的处理规则",
    priority: 1,
    rule: "以银行数据为准",
    autoResolve: true,
    notifyAdmin: true,
    enabled: true,
    triggerCount: 156,
    successRate: 98.7,
  },
  {
    id: 2,
    name: "状态冲突处理",
    description: "当贷款状态与银行状态不一致时的处理规则",
    priority: 2,
    rule: "人工审核",
    autoResolve: false,
    notifyAdmin: true,
    enabled: true,
    triggerCount: 23,
    successRate: 100,
  },
  {
    id: 3,
    name: "日期冲突处理",
    description: "当还款日期与银行记录不一致时的处理规则",
    priority: 3,
    rule: "以较早日期为准",
    autoResolve: true,
    notifyAdmin: false,
    enabled: true,
    triggerCount: 45,
    successRate: 95.6,
  },
  {
    id: 4,
    name: "账户冲突处理",
    description: "当账户信息与银行记录不一致时的处理规则",
    priority: 4,
    rule: "标记异常，等待人工处理",
    autoResolve: false,
    notifyAdmin: true,
    enabled: false,
    triggerCount: 0,
    successRate: 0,
  },
];

const recentConflicts = [
  {
    id: 1,
    type: "金额冲突",
    student: "张三",
    studentId: "2021001",
    local: "¥5,000",
    remote: "¥4,800",
    bank: "中国银行",
    status: "resolved",
    time: "10分钟前",
    resolvedBy: "自动规则#1",
    details: "金额差异 ¥200，已按银行数据更新",
  },
  {
    id: 2,
    type: "状态冲突",
    student: "李四",
    studentId: "2021002",
    local: "还款中",
    remote: "已结清",
    bank: "工商银行",
    status: "pending",
    time: "30分钟前",
    resolvedBy: null,
    details: "状态严重不一致，需要人工审核",
  },
  {
    id: 3,
    type: "日期冲突",
    student: "王五",
    studentId: "2021003",
    local: "2024-06-15",
    remote: "2024-06-10",
    bank: "建设银行",
    status: "resolved",
    time: "1小时前",
    resolvedBy: "自动规则#3",
    details: "还款日期取较早值 2024-06-10",
  },
  {
    id: 4,
    type: "金额冲突",
    student: "赵六",
    studentId: "2021004",
    local: "¥3,000",
    remote: "¥3,000",
    bank: "农业银行",
    status: "resolved",
    time: "2小时前",
    resolvedBy: "自动规则#1",
    details: "金额一致，无需处理",
  },
];

export default function ConflictRulesPage() {
  const [rules, setRules] = useState(conflictRules);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<typeof recentConflicts[0] | null>(null);
  const [testData, setTestData] = useState({
    localAmount: "5000",
    remoteAmount: "4800",
    localStatus: "还款中",
    remoteStatus: "已结清",
  });

  const handleTestRule = () => {
    // 模拟规则测试
    const local = Number(testData.localAmount);
    const remote = Number(testData.remoteAmount);
    if (local !== remote) {
      alert(`检测到金额冲突！\n本地: ¥${local}\n银行: ¥${remote}\n\n根据规则#1，将以银行数据 ¥${remote} 为准进行更新。`);
    } else {
      alert("未检测到冲突，数据一致。");
    }
  };

  const handleAutoResolve = (conflictId: number) => {
    // 模拟自动解决冲突
    alert(`冲突 #${conflictId} 已自动解决！系统已按规则更新数据。`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">冲突规则引擎</h1>
          <p className="text-gray-500 mt-1">配置数据冲突的自动处理规则</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          新增规则
        </Button>
      </div>

      {/* 规则统计 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">总规则数</p>
            <p className="text-2xl font-bold">{rules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">启用规则</p>
            <p className="text-2xl font-bold text-green-600">
              {rules.filter((r) => r.enabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">自动处理</p>
            <p className="text-2xl font-bold text-blue-600">
              {rules.filter((r) => r.autoResolve).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">今日冲突</p>
            <p className="text-2xl font-bold text-orange-600">
              {recentConflicts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">自动解决率</p>
            <p className="text-2xl font-bold text-purple-600">92.5%</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="font-medium">冲突规则引擎已启用，正在实时监控数据同步</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTestModal(true)}>
                <Play className="w-4 h-4 mr-1" />
                测试规则
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                执行日志
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 规则列表 */}
      <Card>
        <CardHeader>
          <CardTitle>冲突处理规则</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="outline">优先级 {rule.priority}</Badge>
                      {rule.enabled ? (
                        <Badge className="bg-green-100 text-green-700">启用</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">禁用</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {rule.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">处理方式: {rule.rule}</span>
                      {rule.autoResolve && (
                        <Badge variant="secondary" className="text-xs">
                          自动处理
                        </Badge>
                      )}
                      {rule.notifyAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          通知管理员
                        </Badge>
                      )}
                    </div>
                    {/* 规则统计 */}
                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">触发次数:</span>
                        <span className="font-medium text-blue-600">{rule.triggerCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">成功率:</span>
                        <span className={`font-medium ${rule.successRate >= 95 ? "text-green-600" : rule.successRate >= 80 ? "text-orange-600" : "text-red-600"}`}>
                          {rule.successRate > 0 ? `${rule.successRate}%` : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最近冲突记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            最近冲突记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => { setSelectedConflict(conflict); setShowDetailModal(true); }}
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{conflict.type}</span>
                      <span className="text-gray-500">- {conflict.student}</span>
                      <span className="text-xs text-gray-400">({conflict.studentId})</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      本地: {conflict.local} → 银行: {conflict.remote} ({conflict.bank})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{conflict.time}</span>
                  <Badge
                    className={
                      conflict.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }
                  >
                    {conflict.status === "resolved" ? "已解决" : "待处理"}
                  </Badge>
                  {conflict.status === "pending" && (
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={(e) => { e.stopPropagation(); handleAutoResolve(conflict.id); }}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      自动解决
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 规则测试弹窗 */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-orange-600">
                <Play className="w-5 h-5 inline mr-2" />
                规则测试
              </h2>
              <button onClick={() => setShowTestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700">
                  模拟数据冲突场景，测试规则处理逻辑
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本地金额</label>
                  <input
                    type="text"
                    value={testData.localAmount}
                    onChange={(e) => setTestData({ ...testData, localAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">银行金额</label>
                  <input
                    type="text"
                    value={testData.remoteAmount}
                    onChange={(e) => setTestData({ ...testData, remoteAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowTestModal(false)}>取消</Button>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleTestRule}>
                  <Play className="w-4 h-4 mr-2" />
                  执行测试
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 冲突详情弹窗 */}
      {showDetailModal && selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                <AlertTriangle className="w-5 h-5 inline mr-2 text-orange-500" />
                冲突详情
              </h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">学生姓名</p>
                  <p className="font-medium">{selectedConflict.student}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">学号</p>
                  <p className="font-medium">{selectedConflict.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">冲突类型</p>
                  <p className="font-medium text-orange-600">{selectedConflict.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">数据来源</p>
                  <p className="font-medium">{selectedConflict.bank}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">本地数据</p>
                    <p className="text-lg font-bold text-blue-600">{selectedConflict.local}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">银行数据</p>
                    <p className="text-lg font-bold text-green-600">{selectedConflict.remote}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">处理结果</p>
                <p className="mt-1">{selectedConflict.details}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">处理时间: {selectedConflict.time}</span>
                <span className="text-gray-500">
                  {selectedConflict.resolvedBy ? `处理方式: ${selectedConflict.resolvedBy}` : "待处理"}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>关闭</Button>
                {selectedConflict.status === "pending" && (
                  <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => handleAutoResolve(selectedConflict.id)}>
                    <Zap className="w-4 h-4 mr-2" />
                    自动解决
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
