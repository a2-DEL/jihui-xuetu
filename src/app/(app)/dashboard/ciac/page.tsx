"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Users,
  Building2,
  Clock,
  X,
  Search,
  Filter,
  Download,
} from "lucide-react";
import * as echarts from "echarts";

// CIAC等级颜色映射
const ciacLevelColors = {
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", dot: "bg-green-500" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600", dot: "bg-yellow-500" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", dot: "bg-red-500" },
};

// 模拟CIAC数据
const ciacData = {
  currentValue: 0.23,
  weeklyTrend: [0.21, 0.22, 0.24, 0.23, 0.22, 0.23, 0.23],
  predictedMissed: 127,
  lastUpdateTime: "2024-05-20 06:00:00",
};

// 院系CIAC排名数据
const collegeRanking = [
  { id: 1, name: "文学院", ciac: 0.32, level: "red", trend: "up", change: 0.03 },
  { id: 2, name: "艺术学院", ciac: 0.28, level: "yellow", trend: "up", change: 0.02 },
  { id: 3, name: "外语学院", ciac: 0.26, level: "yellow", trend: "down", change: -0.01 },
  { id: 4, name: "经管学院", ciac: 0.24, level: "yellow", trend: "stable", change: 0 },
  { id: 5, name: "机械学院", ciac: 0.21, level: "green", trend: "down", change: -0.02 },
  { id: 6, name: "电气学院", ciac: 0.19, level: "green", trend: "stable", change: 0 },
  { id: 7, name: "信息学院", ciac: 0.18, level: "green", trend: "down", change: -0.01 },
  { id: 8, name: "计算机学院", ciac: 0.15, level: "green", trend: "down", change: -0.03 },
];

// 高风险漏识学生数据
const missedStudents = [
  { id: "S001", name: "张**", college: "文学院", major: "汉语言文学", score: 0.85, reason: "家庭突发变故未申请" },
  { id: "S002", name: "李**", college: "艺术学院", major: "美术学", score: 0.82, reason: "低保户家庭未认定" },
  { id: "S003", name: "王**", college: "外语学院", major: "英语", score: 0.79, reason: "单亲家庭且收入低" },
  { id: "S004", name: "赵**", college: "文学院", major: "历史学", score: 0.77, reason: "重病家庭未申请" },
  { id: "S005", name: "钱**", college: "艺术学院", major: "音乐学", score: 0.75, reason: "农村低收入家庭" },
];

// 审批效率数据
const approvalEfficiency = {
  counselor: { avgTime: 4.2, timeoutCount: 12, totalProcessed: 156 },
  college: { avgTime: 8.5, timeoutCount: 8, totalProcessed: 142 },
  school: { avgTime: 12.3, timeoutCount: 5, totalProcessed: 134 },
  bank: { avgTime: 24.8, timeoutCount: 3, totalProcessed: 131 },
};

// 超时工单数据
const timeoutOrders = [
  { id: "APP001", student: "周**", type: "国家助学金", node: "辅导员审核", stayTime: 72, counselor: "刘老师" },
  { id: "APP002", student: "吴**", type: "临时困难补助", node: "院系审批", stayTime: 56, counselor: "王老师" },
  { id: "APP003", student: "郑**", type: "勤工助学", node: "辅导员审核", stayTime: 52, counselor: "张老师" },
  { id: "APP004", student: "孙**", type: "国家奖学金", node: "校级审批", stayTime: 50, counselor: "李老师" },
];

export default function CIACDashboardPage() {
  const [activeTab, setActiveTab] = useState<"ciac" | "efficiency">("ciac");
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [showMissedDetail, setShowMissedDetail] = useState(false);
  const [showTimeoutDetail, setShowTimeoutDetail] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  
  const trendChartRef = useRef<HTMLDivElement>(null);
  const efficiencyChartRef = useRef<HTMLDivElement>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const efficiencyChartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化趋势图表
  const initTrendChart = useCallback(() => {
    if (!trendChartRef.current) return;
    
    trendChartInstance.current = echarts.init(trendChartRef.current);
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E7EB",
        textStyle: { color: "#333" },
      },
      grid: { left: "3%", right: "4%", bottom: "10%", top: "10%", containLabel: true },
      xAxis: {
        type: "category",
        data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        axisLine: { lineStyle: { color: "#E5E7EB" } },
        axisLabel: { color: "#666" },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#F3F4F6" } },
        axisLabel: { color: "#666", formatter: "{value}" },
      },
      series: [
        {
          name: "CIAC系数",
          type: "line",
          smooth: true,
          data: ciacData.weeklyTrend,
          itemStyle: { color: "#165DFF" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(22,93,255,0.3)" },
              { offset: 1, color: "rgba(22,93,255,0.05)" },
            ]),
          },
          markLine: {
            silent: true,
            data: [
              { yAxis: 0.3, lineStyle: { color: "#F5222D", type: "dashed" }, label: { formatter: "警戒线" } },
            ],
          },
        },
      ],
    };
    trendChartInstance.current.setOption(option);
  }, []);

  // 初始化效率图表
  const initEfficiencyChart = useCallback(() => {
    if (!efficiencyChartRef.current) return;
    
    efficiencyChartInstance.current = echarts.init(efficiencyChartRef.current);
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E7EB",
        textStyle: { color: "#333" },
      },
      legend: {
        data: ["平均处理时长", "超时工单数"],
        bottom: 0,
      },
      grid: { left: "3%", right: "4%", bottom: "15%", top: "10%", containLabel: true },
      xAxis: {
        type: "category",
        data: ["辅导员审核", "院系审批", "校级审批", "银行处理"],
        axisLine: { lineStyle: { color: "#E5E7EB" } },
        axisLabel: { color: "#666" },
      },
      yAxis: [
        {
          type: "value",
          name: "时长(小时)",
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#F3F4F6" } },
          axisLabel: { color: "#666" },
        },
        {
          type: "value",
          name: "超时数",
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: "#666" },
        },
      ],
      series: [
        {
          name: "平均处理时长",
          type: "bar",
          data: [approvalEfficiency.counselor.avgTime, approvalEfficiency.college.avgTime, approvalEfficiency.school.avgTime, approvalEfficiency.bank.avgTime],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#165DFF" },
              { offset: 1, color: "#722ED1" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "超时工单数",
          type: "line",
          yAxisIndex: 1,
          data: [approvalEfficiency.counselor.timeoutCount, approvalEfficiency.college.timeoutCount, approvalEfficiency.school.timeoutCount, approvalEfficiency.bank.timeoutCount],
          itemStyle: { color: "#F5222D" },
          symbol: "circle",
          symbolSize: 8,
        },
      ],
    };
    efficiencyChartInstance.current.setOption(option);
  }, []);

  useEffect(() => {
    if (activeTab === "ciac") {
      initTrendChart();
    } else {
      initEfficiencyChart();
    }
    return () => {
      trendChartInstance.current?.dispose();
      efficiencyChartInstance.current?.dispose();
    };
  }, [activeTab, initTrendChart, initEfficiencyChart]);

  // 获取CIAC等级
  const getCiacLevel = (value: number) => {
    if (value >= 0.3) return "red";
    if (value >= 0.2) return "yellow";
    return "green";
  };

  // 催办处理
  const handleReminder = (orderId: string) => {
    alert(`已发送催办通知，工单号：${orderId}`);
  };

  // 批量催办
  const handleBatchReminder = () => {
    alert(`已批量发送催办通知，共${timeoutOrders.length}条`);
  };

  // 筛选漏识学生
  const filteredMissedStudents = missedStudents.filter(s => 
    !selectedCollege || s.college === selectedCollege
  ).filter(s =>
    !searchKeyword || s.name.includes(searchKeyword) || s.college.includes(searchKeyword)
  );

  return (
    <div className="p-6 space-y-6">
      {/* 标签页切换 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("ciac")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "ciac"
                ? "text-[#165DFF] border-b-2 border-[#165DFF] bg-blue-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-2" />
            CIAC专项看板
          </button>
          <button
            onClick={() => setActiveTab("efficiency")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "efficiency"
                ? "text-[#165DFF] border-b-2 border-[#165DFF] bg-blue-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Clock className="w-4 h-4 inline-block mr-2" />
            审批效率监控
          </button>
        </div>

        <div className="p-6">
          {/* CIAC专项看板 */}
          {activeTab === "ciac" && (
            <div className="space-y-6">
              {/* CIAC实时值卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">全校CIAC实时值</span>
                    <span className="text-xs text-gray-400">{ciacData.lastUpdateTime}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#165DFF]">{ciacData.currentValue.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 mb-2">/ 0.3警戒线</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {ciacData.currentValue < 0.3 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">正常范围</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">超出警戒线</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">AI预测漏识学生</span>
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-orange-500">{ciacData.predictedMissed}</div>
                  <div className="text-sm text-gray-500 mt-1">人</div>
                  <button
                    onClick={() => setShowMissedDetail(true)}
                    className="mt-3 text-sm text-[#165DFF] hover:underline flex items-center gap-1"
                  >
                    查看详情 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">高风险院系</span>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-3xl font-bold text-red-500">
                    {collegeRanking.filter(c => c.level === "red").length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">个院系CIAC超标</div>
                </div>
              </div>

              {/* 7日趋势图 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">近7日CIAC趋势</h3>
                <div ref={trendChartRef} className="h-64" />
              </div>

              {/* 院系CIAC排名 */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">各院系CIAC排名（红黄绿标识）</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {collegeRanking.map((college) => {
                    const levelColor = ciacLevelColors[college.level as keyof typeof ciacLevelColors];
                    return (
                      <div
                        key={college.id}
                        className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${levelColor.bg}`}
                        onClick={() => {
                          setSelectedCollege(college.name);
                          setShowMissedDetail(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${levelColor.dot}`} />
                          <span className="font-medium text-gray-900">{college.name}</span>
                          {college.level === "red" && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">高风险</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-700">{college.ciac.toFixed(2)}</span>
                          <div className="flex items-center gap-1">
                            {college.trend === "up" && <TrendingUp className="w-4 h-4 text-red-500" />}
                            {college.trend === "down" && <TrendingDown className="w-4 h-4 text-green-500" />}
                            {college.trend === "stable" && <span className="w-4 h-4 text-gray-300">—</span>}
                            <span className={`text-xs ${college.change > 0 ? "text-red-500" : college.change < 0 ? "text-green-500" : "text-gray-400"}`}>
                              {college.change > 0 ? "+" : ""}{college.change.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 审批效率监控 */}
          {activeTab === "efficiency" && (
            <div className="space-y-6">
              {/* 效率概览卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">辅导员审核</div>
                  <div className="text-2xl font-bold text-[#165DFF]">{approvalEfficiency.counselor.avgTime}h</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-400">已处理 {approvalEfficiency.counselor.totalProcessed}</span>
                    <span className="text-red-500">超时 {approvalEfficiency.counselor.timeoutCount}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">院系审批</div>
                  <div className="text-2xl font-bold text-purple-600">{approvalEfficiency.college.avgTime}h</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-400">已处理 {approvalEfficiency.college.totalProcessed}</span>
                    <span className="text-red-500">超时 {approvalEfficiency.college.timeoutCount}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">校级审批</div>
                  <div className="text-2xl font-bold text-orange-600">{approvalEfficiency.school.avgTime}h</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-400">已处理 {approvalEfficiency.school.totalProcessed}</span>
                    <span className="text-red-500">超时 {approvalEfficiency.school.timeoutCount}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">银行处理</div>
                  <div className="text-2xl font-bold text-cyan-600">{approvalEfficiency.bank.avgTime}h</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-400">已处理 {approvalEfficiency.bank.totalProcessed}</span>
                    <span className="text-red-500">超时 {approvalEfficiency.bank.timeoutCount}</span>
                  </div>
                </div>
              </div>

              {/* 效率图表 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">各节点处理效率对比</h3>
                <div ref={efficiencyChartRef} className="h-64" />
              </div>

              {/* 超时工单列表 */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    超时工单（&gt;48小时未处理）
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">{timeoutOrders.length}</span>
                  </h3>
                  <button
                    onClick={handleBatchReminder}
                    className="px-3 py-1.5 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    批量催办
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请编号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前节点</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">停留时长</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">负责人</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {timeoutOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.student}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.node}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${order.stayTime > 72 ? "text-red-600" : "text-orange-600"}`}>
                              {order.stayTime}h
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.counselor}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleReminder(order.id)}
                              className="text-sm text-[#165DFF] hover:underline"
                            >
                              催办
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 漏识学生详情弹窗 */}
      {showMissedDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                AI预测漏识学生列表
                {selectedCollege && <span className="text-gray-500 font-normal ml-2">- {selectedCollege}</span>}
              </h2>
              <button
                onClick={() => {
                  setShowMissedDetail(false);
                  setSelectedCollege(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索学生姓名或院系"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {selectedCollege && (
                  <button
                    onClick={() => setSelectedCollege(null)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">院系</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">专业</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">风险分数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">可能原因</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMissedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.college}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.major}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${student.score * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-orange-600">{(student.score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.reason}</td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-[#165DFF] hover:underline mr-3">查看详情</button>
                        <button className="text-sm text-green-600 hover:underline">发起认定</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
