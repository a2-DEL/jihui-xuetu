"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  Play,
  Pause,
  Settings,
  History,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Zap,
  BarChart3,
  Mail,
  Bell,
  Search,
  Filter,
  Calendar,
  Download,
} from "lucide-react";
import * as echarts from "echarts";

// Agent定义
interface Agent {
  id: string;
  name: string;
  description: string;
  status: "running" | "stopped" | "error";
  lastRun: string;
  runCount: number;
  successRate: number;
  configParams: Record<string, unknown>;
}

// 模拟Agent列表
const agentList: Agent[] = [
  { id: "batch_export", name: "批量导出Agent", description: "导出申请列表、报表数据", status: "running", lastRun: "2024-05-20 10:30", runCount: 156, successRate: 99.4, configParams: { exportFields: ["id", "name", "amount"], fileNameFormat: "导出_{date}", email: "" } },
  { id: "ai_review", name: "AI终审建议Agent", description: "为待办申请生成AI评分和建议", status: "running", lastRun: "2024-05-20 10:25", runCount: 892, successRate: 96.8, configParams: { confidenceThreshold: 0.75, showRiskWarning: true } },
  { id: "reminder", name: "智能催办Agent", description: "扫描超时待办并发送提醒", status: "running", lastRun: "2024-05-20 09:00", runCount: 45, successRate: 100, configParams: { timeoutThreshold: 48, channels: ["wechat", "sms"], autoReminder: true } },
  { id: "report", name: "报表生成Agent", description: "每月自动生成教育厅报表", status: "stopped", lastRun: "2024-05-01 08:00", runCount: 12, successRate: 100, configParams: { template: "standard", recipients: [], sendDate: 5 } },
  { id: "anomaly", name: "异常检测Agent", description: "检测异常申请、CIAC异常院系", status: "running", lastRun: "2024-05-20 06:00", runCount: 234, successRate: 98.7, configParams: { rules: ["duplicate", "fraud", "ciac_spike"], notifyMethod: "email" } },
  { id: "qa", name: "政策问答Agent", description: "学生端AI助手问答（校级知识库）", status: "running", lastRun: "2024-05-20 10:35", runCount: 5678, successRate: 94.2, configParams: { knowledgeBase: "school", maxResults: 5, showSource: true } },
];

// 执行日志
interface ExecutionLog {
  id: string;
  agentId: string;
  agentName: string;
  status: "success" | "failed" | "running";
  startTime: string;
  endTime: string;
  duration: number;
  input: string;
  output: string;
  error?: string;
}

const executionLogs: ExecutionLog[] = [
  { id: "LOG001", agentId: "batch_export", agentName: "批量导出Agent", status: "success", startTime: "2024-05-20 10:30:00", endTime: "2024-05-20 10:30:15", duration: 15, input: "导出范围：本月助学金申请", output: "生成文件：助学金申请列表_202405.xlsx" },
  { id: "LOG002", agentId: "ai_review", agentName: "AI终审建议Agent", status: "success", startTime: "2024-05-20 10:25:00", endTime: "2024-05-20 10:25:08", duration: 8, input: "申请ID：APP001", output: "AI评分：0.85，建议：通过" },
  { id: "LOG003", agentId: "reminder", agentName: "智能催办Agent", status: "success", startTime: "2024-05-20 09:00:00", endTime: "2024-05-20 09:00:12", duration: 12, input: "扫描超时>48h的待办", output: "发送催办通知5条" },
  { id: "LOG004", agentId: "anomaly", agentName: "异常检测Agent", status: "success", startTime: "2024-05-20 06:00:00", endTime: "2024-05-20 06:05:23", duration: 323, input: "全量异常检测", output: "发现异常申请2条，异常院系0个" },
  { id: "LOG005", agentId: "qa", agentName: "政策问答Agent", status: "failed", startTime: "2024-05-20 10:35:00", endTime: "2024-05-20 10:35:02", duration: 2, input: "问题：助学金什么时候发放？", output: "", error: "知识库连接超时" },
];

export default function AgentManagementPage() {
  const [agents, setAgents] = useState(agentList);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "logs">("list");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化图表
  const initChart = useCallback(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = echarts.init(chartRef.current);
    
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E7EB",
        textStyle: { color: "#333" },
      },
      legend: {
        data: ["执行次数", "成功率"],
        bottom: 0,
      },
      grid: { left: "3%", right: "4%", bottom: "15%", top: "10%", containLabel: true },
      xAxis: {
        type: "category",
        data: agents.map(a => a.name.slice(0, 6)),
        axisLine: { lineStyle: { color: "#E5E7EB" } },
        axisLabel: { color: "#666", fontSize: 10 },
      },
      yAxis: [
        {
          type: "value",
          name: "次数",
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#F3F4F6" } },
          axisLabel: { color: "#666" },
        },
        {
          type: "value",
          name: "成功率%",
          max: 100,
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: "#666" },
        },
      ],
      series: [
        {
          name: "执行次数",
          type: "bar",
          data: agents.map(a => a.runCount),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#165DFF" },
              { offset: 1, color: "#722ED1" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "成功率",
          type: "line",
          yAxisIndex: 1,
          data: agents.map(a => a.successRate),
          itemStyle: { color: "#52C41A" },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    };
    chartInstance.current.setOption(option);
  }, [agents]);

  useEffect(() => {
    initChart();
    return () => {
      chartInstance.current?.dispose();
    };
  }, [initChart]);

  // 启用/停用Agent
  const handleToggleAgent = (id: string) => {
    setAgents(agents.map(agent =>
      agent.id === id
        ? { ...agent, status: agent.status === "running" ? "stopped" : "running" }
        : agent
    ));
  };

  // 筛选日志
  const filteredLogs = executionLogs.filter(log =>
    !searchKeyword || log.agentName.includes(searchKeyword) || log.id.includes(searchKeyword)
  );

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI智能体管理</h1>
          <p className="text-sm text-gray-500 mt-1">配置和管理预置Agent</p>
        </div>
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "list"
                ? "text-[#165DFF] border-b-2 border-[#165DFF] bg-blue-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Bot className="w-4 h-4 inline-block mr-2" />
            Agent列表
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "logs"
                ? "text-[#165DFF] border-b-2 border-[#165DFF] bg-blue-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <History className="w-4 h-4 inline-block mr-2" />
            执行日志
          </button>
        </div>

        <div className="p-6">
          {/* Agent列表 */}
          {activeTab === "list" && (
            <div className="space-y-6">
              {/* 执行统计图表 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Agent执行统计</h3>
                <div ref={chartRef} className="h-64" />
              </div>

              {/* Agent列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`bg-white rounded-xl border p-4 transition-all ${
                      agent.status === "running" ? "border-green-200 shadow-sm" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-[#165DFF]" />
                        <span className="font-medium text-gray-900">{agent.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        agent.status === "running" ? "bg-green-100 text-green-600" :
                        agent.status === "stopped" ? "bg-gray-100 text-gray-500" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {agent.status === "running" ? "运行中" : agent.status === "stopped" ? "已停止" : "异常"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{agent.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {agent.lastRun}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {agent.runCount}次
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {agent.successRate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAgent(agent.id)}
                        className={`flex-1 px-3 py-1.5 text-sm rounded-lg flex items-center justify-center gap-1 ${
                          agent.status === "running"
                            ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {agent.status === "running" ? (
                          <><Pause className="w-4 h-4" /> 停止</>
                        ) : (
                          <><Play className="w-4 h-4" /> 启动</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowConfigModal(true);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-[#165DFF] rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1"
                      >
                        <Settings className="w-4 h-4" />
                        配置
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 执行日志 */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索Agent名称或日志ID"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => {}}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出日志
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日志ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">开始时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">耗时</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">输入</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">输出</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.agentName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                            log.status === "success" ? "bg-green-100 text-green-600" :
                            log.status === "failed" ? "bg-red-100 text-red-600" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {log.status === "success" && <CheckCircle className="w-3 h-3" />}
                            {log.status === "failed" && <XCircle className="w-3 h-3" />}
                            {log.status === "running" && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {log.status === "success" ? "成功" : log.status === "failed" ? "失败" : "运行中"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.startTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.duration}ms</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{log.input}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                          {log.error ? (
                            <span className="text-red-500">{log.error}</span>
                          ) : (
                            log.output
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 配置弹窗 */}
      {showConfigModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              配置 {selectedAgent.name}
            </h2>
            <div className="space-y-4">
              {selectedAgent.id === "batch_export" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">导出字段</label>
                    <div className="flex flex-wrap gap-2">
                      {["申请编号", "学生姓名", "金额", "状态", "院系"].map(field => (
                        <label key={field} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                          <input type="checkbox" defaultChecked className="w-3 h-3" />
                          {field}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">文件名格式</label>
                    <input
                      type="text"
                      defaultValue="导出_{date}"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                </>
              )}
              {selectedAgent.id === "ai_review" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">置信度阈值 (0-1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      defaultValue="0.75"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-gray-600">显示风险提示</span>
                    </label>
                  </div>
                </>
              )}
              {selectedAgent.id === "reminder" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">超时阈值（小时）</label>
                    <input
                      type="number"
                      defaultValue="48"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">发送渠道</label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-1">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-gray-600">微信</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-gray-600">短信</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm text-gray-600">邮件</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-gray-600">启用自动催办</span>
                    </label>
                  </div>
                </>
              )}
              {selectedAgent.id === "anomaly" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">检测规则</label>
                    <div className="space-y-2">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-gray-600">重复申请检测</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-gray-600">材料造假检测</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-gray-600">CIAC突变检测</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  alert("配置已保存");
                }}
                className="px-4 py-2 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
