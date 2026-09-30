"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Zap,
  Activity,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Coins,
  Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as echarts from "echarts";

interface WorkflowStats {
  id: string;
  name: string;
  calls: number;
  avg_duration: number;
  success_rate: number;
  tokens: number;
  cost: number;
  trend: "up" | "down" | "stable";
}

const mockWorkflowStats: WorkflowStats[] = [
  { id: "w1", name: "临时困补自动审批", calls: 1234, avg_duration: 2.3, success_rate: 98.2, tokens: 1200000, cost: 2.40, trend: "up" },
  { id: "w2", name: "材料预审辅助", calls: 8920, avg_duration: 1.8, success_rate: 99.1, tokens: 8900000, cost: 17.80, trend: "up" },
  { id: "w3", name: "政策问答RAG", calls: 12345, avg_duration: 1.2, success_rate: 96.5, tokens: 24600000, cost: 49.20, trend: "stable" },
  { id: "w4", name: "风险评估预警", calls: 567, avg_duration: 3.5, success_rate: 94.8, tokens: 680000, cost: 1.36, trend: "down" },
  { id: "w5", name: "CIAC预测Agent", calls: 156, avg_duration: 5.2, success_rate: 97.4, tokens: 450000, cost: 0.90, trend: "up" },
  { id: "w6", name: "智能推荐Agent", calls: 8923, avg_duration: 0.8, success_rate: 98.9, tokens: 3200000, cost: 6.40, trend: "up" },
  { id: "w7", name: "审批流程Agent", calls: 4567, avg_duration: 2.1, success_rate: 95.6, tokens: 5600000, cost: 11.20, trend: "stable" },
  { id: "w8", name: "通知生成Agent", calls: 23456, avg_duration: 0.5, success_rate: 99.5, tokens: 1800000, cost: 3.60, trend: "up" },
];

// DeepSeek定价: 输入 ¥0.001/1K tokens, 输出 ¥0.002/1K tokens
const TOKEN_PRICE_INPUT = 0.001; // per 1K tokens
const TOKEN_PRICE_OUTPUT = 0.002; // per 1K tokens

export default function AgentStatisticsPage() {
  const [stats, setStats] = useState<WorkflowStats[]>(mockWorkflowStats);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
  const [sortBy, setSortBy] = useState<"calls" | "cost" | "success_rate">("calls");
  const chartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  // 总计统计
  const totals = {
    calls: stats.reduce((sum, s) => sum + s.calls, 0),
    avgDuration: (stats.reduce((sum, s) => sum + s.avg_duration * s.calls, 0) / stats.reduce((sum, s) => sum + s.calls, 0)).toFixed(2),
    avgSuccessRate: (stats.reduce((sum, s) => sum + s.success_rate * s.calls, 0) / stats.reduce((sum, s) => sum + s.calls, 0)).toFixed(1),
    tokens: stats.reduce((sum, s) => sum + s.tokens, 0),
    cost: stats.reduce((sum, s) => sum + s.cost, 0).toFixed(2),
  };

  // 费用告警阈值
  const COST_ALERT_THRESHOLD = 1000; // 月费用超过1000元告警
  const isCostAlert = parseFloat(totals.cost) > COST_ALERT_THRESHOLD;

  // 排序
  const sortedStats = [...stats].sort((a, b) => {
    if (sortBy === "calls") return b.calls - a.calls;
    if (sortBy === "cost") return b.cost - a.cost;
    return b.success_rate - a.success_rate;
  });

  // 格式化Token数量
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  // 导出报表
  const exportReport = () => {
    const csv = [
      ["工作流名称", "调用次数", "平均耗时(s)", "成功率(%)", "Token消耗", "费用(元)"].join(","),
      ...stats.map(s => [s.name, s.calls, s.avg_duration, s.success_rate, s.tokens, s.cost].join(","))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Agent调用统计_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ECharts图表
  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      
      const option = {
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderColor: "#E5E7EB",
          textStyle: { color: "#374151" },
        },
        legend: {
          data: ["调用次数", "成功率(%)"],
          bottom: 0,
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          top: "10%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: sortedStats.map(s => s.name.length > 8 ? s.name.slice(0, 8) + "..." : s.name),
          axisLine: { lineStyle: { color: "#E5E7EB" } },
          axisLabel: { color: "#6B7280", rotate: 30 },
        },
        yAxis: [
          {
            type: "value",
            name: "调用次数",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: "#F3F4F6" } },
            axisLabel: { color: "#6B7280" },
          },
          {
            type: "value",
            name: "成功率%",
            min: 90,
            max: 100,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { color: "#6B7280" },
          },
        ],
        series: [
          {
            name: "调用次数",
            type: "bar",
            data: sortedStats.map(s => s.calls),
            itemStyle: { color: "#165DFF", borderRadius: [4, 4, 0, 0] },
          },
          {
            name: "成功率(%)",
            type: "line",
            yAxisIndex: 1,
            data: sortedStats.map(s => s.success_rate),
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { color: "#52C41A", width: 2 },
            itemStyle: { color: "#52C41A" },
          },
        ],
      };
      
      chart.setOption(option);
      
      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.dispose();
      };
    }
  }, [sortedStats, timeRange]);

  // 饼图 - Token分布
  useEffect(() => {
    if (pieChartRef.current) {
      const chart = echarts.init(pieChartRef.current);
      
      const option = {
        tooltip: {
          trigger: "item",
          formatter: "{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          right: 10,
          top: "center",
        },
        series: [
          {
            name: "Token消耗",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: stats.slice(0, 5).map((s, i) => ({
              value: s.tokens,
              name: s.name.length > 6 ? s.name.slice(0, 6) + "..." : s.name,
              itemStyle: {
                color: ["#165DFF", "#52C41A", "#722ED1", "#FA8C16", "#13C2C2"][i],
              },
            })),
          },
        ],
      };
      
      chart.setOption(option);
      
      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.dispose();
      };
    }
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent调用统计</h1>
          <p className="text-gray-500 mt-1">查看各工作流的调用次数、耗时、成功率、Token消耗和费用预估</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {(["today", "week", "month"] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? "default" : "outline"}
                onClick={() => setTimeRange(range)}
              >
                {range === "today" ? "今日" : range === "week" ? "本周" : "本月"}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 费用告警 */}
      {isCostAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">费用告警</p>
            <p className="text-sm text-red-600">
              本月累计费用 ¥{totals.cost} 已超过阈值 ¥{COST_ALERT_THRESHOLD}，请关注API用量
            </p>
          </div>
        </div>
      )}

      {/* 总计统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">总调用次数</p>
                <p className="text-2xl font-bold text-gray-900">{totals.calls.toLocaleString()}</p>
              </div>
              <Activity className="w-6 h-6 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">平均耗时</p>
                <p className="text-2xl font-bold text-green-600">{totals.avgDuration}s</p>
              </div>
              <Clock className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">平均成功率</p>
                <p className="text-2xl font-bold text-purple-600">{totals.avgSuccessRate}%</p>
              </div>
              <CheckCircle className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Token消耗</p>
                <p className="text-2xl font-bold text-orange-600">{formatTokens(totals.tokens)}</p>
              </div>
              <Brain className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">预估费用</p>
                <p className="text-2xl font-bold text-red-600">¥{totals.cost}</p>
              </div>
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#165DFF]" />
              工作流调用统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} style={{ height: 300 }} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-500" />
              Token消耗分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={pieChartRef} style={{ height: 250 }} />
            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              <p>基于 DeepSeek 定价:</p>
              <p>输入 ¥0.001/1K tokens</p>
              <p>输出 ¥0.002/1K tokens</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细数据表格 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#165DFF]" />
              工作流调用明细
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="calls">调用次数</option>
                <option value="cost">费用</option>
                <option value="success_rate">成功率</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">工作流名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">调用次数</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">平均耗时</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">成功率</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Token消耗</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">费用(元)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">趋势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedStats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{stat.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{stat.calls.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{stat.avg_duration}s</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${stat.success_rate >= 95 ? "bg-green-500" : stat.success_rate >= 90 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${stat.success_rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{stat.success_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{formatTokens(stat.tokens)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">¥{stat.cost.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : stat.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 费用说明 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Coins className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">费用计算说明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>费用基于 DeepSeek API 定价计算: 输入 ¥0.001/1K tokens, 输出 ¥0.002/1K tokens</li>
                <li>月费用超过 ¥{COST_ALERT_THRESHOLD} 将自动触发告警通知</li>
                <li>费用可导出报表用于预算管理和成本核算</li>
                <li>建议定期检查低成功率工作流，优化Prompt以减少Token消耗</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
