"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Settings, History, Play, Pause } from "lucide-react";

export default function DeptAgentPage() {
  const [agents, setAgents] = useState([
    { id: "1", name: "临时困补预警Agent", desc: "监测本院系临时困补申请，超过阈值自动预警", enabled: true, lastRun: "2026-06-08 10:00", runCount: 156 },
    { id: "2", name: "AI初审建议Agent", desc: "为待审批申请生成AI评分和建议", enabled: true, lastRun: "2026-06-08 09:30", runCount: 892 },
    { id: "3", name: "催办提醒Agent", desc: "自动检测超时待办并发送催办通知", enabled: false, lastRun: "2026-06-07 18:00", runCount: 45 },
    { id: "4", name: "漏识学生检测Agent", desc: "检测疑似贫困但未被认定的学生", enabled: true, lastRun: "2026-06-08 06:00", runCount: 23 },
  ]);

  const [showConfig, setShowConfig] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[0] | null>(null);

  const handleToggle = (id: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-600" />
          AI智能体管理（院系级）
        </h1>
      </div>

      {/* Agent卡片列表 */}
      <div className="grid grid-cols-2 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className={agent.enabled ? "border-purple-200" : "border-gray-200 opacity-70"}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${agent.enabled ? "bg-purple-100" : "bg-gray-100"}`}>
                    <Bot className={`w-6 h-6 ${agent.enabled ? "text-purple-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{agent.desc}</p>
                  </div>
                </div>
                <Switch checked={agent.enabled} onCheckedChange={() => handleToggle(agent.id)} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>上次运行: {agent.lastRun}</span>
                <span>累计运行: {agent.runCount}次</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedAgent(agent);
                    setShowConfig(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  参数配置
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <History className="w-4 h-4 mr-1" />
                  执行日志
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 参数配置弹窗 */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent参数配置</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <p className="font-medium">{selectedAgent.name}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">预警阈值</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 px-3 py-2 border rounded-lg" 
                    defaultValue="48"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">通知方式</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                    <option>微信通知</option>
                    <option>短信通知</option>
                    <option>邮件通知</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">自动执行</label>
                  <div className="mt-1">
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfig(false)}>取消</Button>
                <Button onClick={() => setShowConfig(false)}>保存配置</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
