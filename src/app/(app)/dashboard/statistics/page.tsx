"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, TrendingUp, PieChart, Download, Filter,
  Calendar, Users, FileText, DollarSign, RefreshCw
} from "lucide-react";
import * as echarts from "echarts";

interface StatisticsData {
  overview: {
    totalApplications: number;
    totalAmount: number;
    approvedRate: number;
    avgProcessingDays: number;
    yearTrend: number;
    monthTrend: number;
  };
  yearData: Array<{ year: string; count: number; amount: number }>;
  monthData: Array<{ month: string; count: number; amount: number }>;
  typeData: Array<{ name: string; value: number; amount: number; color: string }>;
  collegeData: Array<{ name: string; value: number; amount: number }>;
  gradeData: Array<{ name: string; value: number }>;
  statusData: Array<{ name: string; value: number; color: string }>;
  processingTime: Array<{ name: string; value: number }>;
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [semester, setSemester] = useState("all");
  
  const yearChartRef = useRef<HTMLDivElement>(null);
  const monthChartRef = useRef<HTMLDivElement>(null);
  const typeChartRef = useRef<HTMLDivElement>(null);
  const collegeChartRef = useRef<HTMLDivElement>(null);
  const gradeChartRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  const processingChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 模拟数据
    const mockData: StatisticsData = {
      overview: {
        totalApplications: 1568,
        totalAmount: 12560000,
        approvedRate: 78.5,
        avgProcessingDays: 4.2,
        yearTrend: 12.3,
        monthTrend: 5.8,
      },
      yearData: [
        { year: "2021-2022", count: 856, amount: 6850000 },
        { year: "2022-2023", count: 1024, amount: 8190000 },
        { year: "2023-2024", count: 1189, amount: 9520000 },
        { year: "2024-2025", count: 1356, amount: 10850000 },
        { year: "2025-2026", count: 1568, amount: 12560000 },
      ],
      monthData: [
        { month: "9月", count: 245, amount: 1960000 },
        { month: "10月", count: 312, amount: 2500000 },
        { month: "11月", count: 289, amount: 2310000 },
        { month: "12月", count: 198, amount: 1580000 },
        { month: "1月", count: 156, amount: 1250000 },
        { month: "2月", count: 89, amount: 710000 },
        { month: "3月", count: 278, amount: 2220000 },
      ],
      typeData: [
        { name: "国家奖学金", value: 156, amount: 1560000, color: "#165DFF" },
        { name: "国家助学金", value: 523, amount: 4184000, color: "#52C41A" },
        { name: "校内奖学金", value: 312, amount: 2496000, color: "#FA8C16" },
        { name: "勤工助学", value: 289, amount: 1445000, color: "#722ED1" },
        { name: "临时困难补助", value: 156, amount: 468000, color: "#F5222D" },
        { name: "生源地贷款", value: 98, amount: 1960000, color: "#13C2C2" },
        { name: "学费减免", value: 34, amount: 450000, color: "#FAAD14" },
      ],
      collegeData: [
        { name: "信息工程学院", value: 286, amount: 2288000 },
        { name: "经济管理学院", value: 245, amount: 1960000 },
        { name: "机械工程学院", value: 198, amount: 1584000 },
        { name: "外国语学院", value: 167, amount: 1336000 },
        { name: "艺术设计学院", value: 156, amount: 1248000 },
        { name: "理学院", value: 134, amount: 1072000 },
        { name: "人文学院", value: 123, amount: 984000 },
        { name: "其他学院", value: 259, amount: 2072000 },
      ],
      gradeData: [
        { name: "2024级", value: 356 },
        { name: "2023级", value: 423 },
        { name: "2022级", value: 389 },
        { name: "2021级", value: 298 },
        { name: "2020级", value: 102 },
      ],
      statusData: [
        { name: "已通过", value: 1231, color: "#52C41A" },
        { name: "待审核", value: 156, color: "#FA8C16" },
        { name: "审核中", value: 89, color: "#165DFF" },
        { name: "已驳回", value: 92, color: "#F5222D" },
      ],
      processingTime: [
        { name: "1天内", value: 456 },
        { name: "2-3天", value: 523 },
        { name: "4-5天", value: 289 },
        { name: "6-7天", value: 156 },
        { name: "7天以上", value: 144 },
      ],
    };
    setData(mockData);
    setLoading(false);
  }, []);

  // 图表实例引用
  const chartInstances = useRef<echarts.ECharts[]>([]);

  useEffect(() => {
    if (!data) return;

    // 清理旧图表
    chartInstances.current.forEach(chart => chart.dispose());
    chartInstances.current = [];

    // 年度趋势图
    if (yearChartRef.current) {
      const chart = echarts.init(yearChartRef.current);
      chartInstances.current.push(chart);
      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["申请数量", "申请金额(万元)"], bottom: 0 },
        grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
        xAxis: { 
          type: "category", 
          data: data.yearData.map(d => d.year),
          axisLabel: { color: "#666" }
        },
        yAxis: [
          { type: "value", name: "数量", axisLabel: { color: "#666" } },
          { type: "value", name: "金额(万)", axisLabel: { color: "#666" } }
        ],
        series: [
          {
            name: "申请数量",
            type: "bar",
            data: data.yearData.map(d => d.count),
            itemStyle: { color: "#165DFF", borderRadius: [4, 4, 0, 0] }
          },
          {
            name: "申请金额(万元)",
            type: "line",
            yAxisIndex: 1,
            data: data.yearData.map(d => (d.amount / 10000).toFixed(0)),
            itemStyle: { color: "#52C41A" },
            lineStyle: { color: "#52C41A" }
          }
        ]
      });
    }

    // 月度分布图
    if (monthChartRef.current) {
      const chart = echarts.init(monthChartRef.current);
      chart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: { 
          type: "category", 
          data: data.monthData.map(d => d.month),
          axisLabel: { color: "#666" }
        },
        yAxis: { type: "value", axisLabel: { color: "#666" } },
        series: [{
          type: "bar",
          data: data.monthData.map(d => d.count),
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#165DFF" },
              { offset: 1, color: "#69B1FF" }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });
    }

    // 类型分布饼图
    if (typeChartRef.current) {
      const chart = echarts.init(typeChartRef.current);
      chart.setOption({
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { type: "scroll", orient: "vertical", right: 10, top: 20 },
        series: [{
          type: "pie",
          radius: ["40%", "70%"],
          center: ["40%", "50%"],
          data: data.typeData.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
          label: { show: false }
        }]
      });
    }

    // 学院分布图
    if (collegeChartRef.current) {
      const chart = echarts.init(collegeChartRef.current);
      chart.setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: { type: "value", axisLabel: { color: "#666" } },
        yAxis: { 
          type: "category", 
          data: data.collegeData.map(d => d.name).reverse(),
          axisLabel: { color: "#666" }
        },
        series: [{
          type: "bar",
          data: data.collegeData.map(d => d.value).reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#165DFF" },
              { offset: 1, color: "#69B1FF" }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        }]
      });
    }

    // 年级分布
    if (gradeChartRef.current) {
      const chart = echarts.init(gradeChartRef.current);
      chart.setOption({
        tooltip: { trigger: "item" },
        series: [{
          type: "pie",
          radius: "70%",
          data: data.gradeData.map((d, i) => ({ 
            name: d.name, 
            value: d.value,
            itemStyle: { color: ["#165DFF", "#52C41A", "#FA8C16", "#722ED1", "#13C2C2"][i] }
          })),
          label: { formatter: "{b}\n{c}人" }
        }]
      });
    }

    // 状态分布
    if (statusChartRef.current) {
      const chart = echarts.init(statusChartRef.current);
      chart.setOption({
        tooltip: { trigger: "item" },
        series: [{
          type: "pie",
          radius: ["50%", "80%"],
          data: data.statusData.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
          label: { formatter: "{b}: {c}" }
        }]
      });
    }

    // 审批时效
    if (processingChartRef.current) {
      const chart = echarts.init(processingChartRef.current);
      chart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: { 
          type: "category", 
          data: data.processingTime.map(d => d.name),
          axisLabel: { color: "#666" }
        },
        yAxis: { type: "value", axisLabel: { color: "#666" } },
        series: [{
          type: "bar",
          data: data.processingTime.map(d => d.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#52C41A" },
              { offset: 1, color: "#95DE64" }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });
    }

    // 窗口 resize 时重新调整图表大小
    const handleResize = () => {
      chartInstances.current.forEach(chart => chart.resize());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstances.current.forEach(chart => chart.dispose());
    };
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-500 mt-1">资助申请数据多维度统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026">2025-2026学年</SelectItem>
              <SelectItem value="2024-2025">2024-2025学年</SelectItem>
              <SelectItem value="2023-2024">2023-2024学年</SelectItem>
            </SelectContent>
          </Select>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学期</SelectItem>
              <SelectItem value="1">第一学期</SelectItem>
              <SelectItem value="2">第二学期</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总申请数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data?.overview.totalApplications.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">↑ {data?.overview.yearTrend}% 较上年</p>
              </div>
              <FileText className="w-12 h-12 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总资助金额</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{((data?.overview.totalAmount || 0) / 10000).toFixed(0)}万</p>
                <p className="text-sm text-green-600 mt-1">↑ {data?.overview.monthTrend}% 较上月</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">审批通过率</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data?.overview.approvedRate}%</p>
                <p className="text-sm text-green-600 mt-1">保持稳定</p>
              </div>
              <TrendingUp className="w-12 h-12 text-amber-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">平均处理时长</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data?.overview.avgProcessingDays}天</p>
                <p className="text-sm text-blue-600 mt-1">效率提升中</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">趋势分析</TabsTrigger>
          <TabsTrigger value="distribution">分布分析</TabsTrigger>
          <TabsTrigger value="efficiency">效率分析</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  年度申请趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={yearChartRef} style={{ height: 300 }} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  月度申请分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={monthChartRef} style={{ height: 300 }} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-500" />
                  资助类型分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={typeChartRef} style={{ height: 300 }} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  学院分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={collegeChartRef} style={{ height: 300 }} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  年级分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={gradeChartRef} style={{ height: 280 }} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-500" />
                  状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={statusChartRef} style={{ height: 280 }} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                审批时效分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={processingChartRef} style={{ height: 350 }} />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">1天内完成</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{data?.processingTime[0].value}</p>
                <p className="text-sm text-gray-400">占比 {((data?.processingTime[0].value || 0) / 1568 * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">3天内完成</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{((data?.processingTime[0].value || 0) + (data?.processingTime[1].value || 0))}</p>
                <p className="text-sm text-gray-400">占比 {(((data?.processingTime[0].value || 0) + (data?.processingTime[1].value || 0)) / 1568 * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">超7天</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{data?.processingTime[4].value}</p>
                <p className="text-sm text-gray-400">占比 {((data?.processingTime[4].value || 0) / 1568 * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
