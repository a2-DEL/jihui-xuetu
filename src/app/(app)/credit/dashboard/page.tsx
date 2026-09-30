"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Edit3,
  History,
  AlertCircle,
} from "lucide-react";
import * as echarts from "echarts";

// 信用等级定义
const creditLevels = [
  { level: "A", label: "优秀", range: "90-100", color: "#52C41A", count: 2456 },
  { level: "B", label: "良好", range: "75-89", color: "#165DFF", count: 3892 },
  { level: "C", label: "一般", range: "60-74", color: "#FA8C16", count: 1234 },
  { level: "D", label: "较差", range: "0-59", color: "#F5222D", count: 418 },
];

// 模拟信用分布数据（直方图）
const distributionData = [
  { range: "0-10", count: 23 },
  { range: "10-20", count: 45 },
  { range: "20-30", count: 67 },
  { range: "30-40", count: 89 },
  { range: "40-50", count: 134 },
  { range: "50-60", count: 198 },
  { range: "60-70", count: 356 },
  { range: "70-80", count: 578 },
  { range: "80-90", count: 1234 },
  { range: "90-100", count: 876 },
];

// 院系信用统计
const collegeCreditStats = [
  { name: "计算机学院", avgScore: 82.5, aCount: 456, bCount: 523, cCount: 134, dCount: 23 },
  { name: "信息学院", avgScore: 81.2, aCount: 389, bCount: 478, cCount: 156, dCount: 32 },
  { name: "机械学院", avgScore: 78.8, aCount: 312, bCount: 423, cCount: 189, dCount: 45 },
  { name: "电气学院", avgScore: 79.5, aCount: 334, bCount: 445, cCount: 167, dCount: 38 },
  { name: "经管学院", avgScore: 83.1, aCount: 478, bCount: 512, cCount: 123, dCount: 21 },
  { name: "文学院", avgScore: 76.4, aCount: 267, bCount: 389, cCount: 234, dCount: 67 },
];

// 信用调整记录
const adjustmentHistory = [
  { id: 1, student: "张**", college: "计算机学院", oldScore: 65, newScore: 75, reason: "系统错误修正", operator: "校级管理员", time: "2024-05-20 10:30", status: "已审批" },
  { id: 2, student: "李**", college: "信息学院", oldScore: 72, newScore: 82, reason: "补交材料证明", operator: "校级管理员", time: "2024-05-19 14:20", status: "已审批" },
  { id: 3, student: "王**", college: "机械学院", oldScore: 58, newScore: 68, reason: "特殊困难认定", operator: "校级管理员", time: "2024-05-18 09:15", status: "待审批" },
];

export default function CreditDashboardPage() {
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化图表
  const initChart = useCallback(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = echarts.init(chartRef.current);
    
    const filteredDistribution = collegeFilter === "all" 
      ? distributionData 
      : distributionData.map(d => ({ ...d, count: Math.round(d.count * (0.7 + Math.random() * 0.6)) }));

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
        data: filteredDistribution.map(d => d.range),
        axisLine: { lineStyle: { color: "#E5E7EB" } },
        axisLabel: { color: "#666" },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#F3F4F6" } },
        axisLabel: { color: "#666" },
      },
      series: [
        {
          name: "学生人数",
          type: "bar",
          data: filteredDistribution.map(d => d.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#165DFF" },
              { offset: 1, color: "#722ED1" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
    chartInstance.current.setOption(option);
  }, [collegeFilter]);

  useEffect(() => {
    initChart();
    return () => {
      chartInstance.current?.dispose();
    };
  }, [initChart]);

  // 计算统计数据
  const totalStudents = creditLevels.reduce((sum, l) => sum + l.count, 0);
  const avgScore = 78.5; // 模拟平均分

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用评分看板</h1>
          <p className="text-sm text-gray-500 mt-1">全校学生信用分分布与统计</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            调整记录
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-4 py-2 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            手动调整
          </button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">全校学生数</div>
          <div className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">平均信用分</div>
          <div className="text-2xl font-bold text-[#165DFF]">{avgScore}</div>
        </div>
        {creditLevels.map((level) => (
          <div key={level.level} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">{level.level}级 · {level.label}</span>
              <span className="text-xs text-gray-400">{level.range}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: level.color }}>{level.count.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* 信用分分布直方图 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">信用分分布</h2>
          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全校</option>
            <option value="计算机学院">计算机学院</option>
            <option value="信息学院">信息学院</option>
            <option value="机械学院">机械学院</option>
            <option value="电气学院">电气学院</option>
            <option value="经管学院">经管学院</option>
            <option value="文学院">文学院</option>
          </select>
        </div>
        <div ref={chartRef} className="h-80" />
      </div>

      {/* 各院系信用统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">各院系信用统计</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">院系</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均分</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">A级人数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">B级人数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">C级人数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">D级人数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collegeCreditStats.map((college) => (
                <tr key={college.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{college.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#165DFF]">{college.avgScore}</span>
                      {college.avgScore >= 80 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : college.avgScore < 75 ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-green-600 font-medium">{college.aCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-blue-600 font-medium">{college.bCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-orange-600 font-medium">{college.cCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-red-600 font-medium">{college.dCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-[#165DFF] hover:underline">
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 手动调整弹窗 */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">信用分手动调整</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">学生学号</label>
                <input
                  type="text"
                  placeholder="请输入学生学号"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">当前信用分</label>
                <input
                  type="text"
                  disabled
                  placeholder="输入学号后自动显示"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">调整后分数</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">调整原因</label>
                <textarea
                  placeholder="请输入调整原因（必填）"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div className="text-xs text-orange-700">
                    调整操作将记录审计日志并写入区块链存证，需提交超级管理员审批后生效。
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  alert("调整申请已提交，等待超级管理员审批");
                }}
                className="px-4 py-2 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                提交审批
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 调整记录弹窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">信用分调整记录</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">院系</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原分数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">新分数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adjustmentHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.student}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.college}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.oldScore}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-green-600">+{record.newScore - record.oldScore}</span>
                        <span className="text-sm text-gray-600 ml-1">({record.newScore})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.reason}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.operator}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{record.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${record.status === "已审批" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                          {record.status}
                        </span>
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
