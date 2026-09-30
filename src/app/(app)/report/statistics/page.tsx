"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, Printer, FileSpreadsheet, BarChart3, 
  PieChart, TrendingUp, Calendar, RefreshCw
} from "lucide-react";
import * as echarts from "echarts";
import { useToast } from "@/hooks/use-toast";

export default function ReportStatisticsPage() {
  const { toast } = useToast();
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef1.current) {
      const chart = echarts.init(chartRef1.current);
      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["申请数", "通过数"], bottom: 0 },
        grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
        xAxis: { 
          type: "category",
          data: ["9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月"],
        },
        yAxis: { type: "value" },
        series: [
          {
            name: "申请数",
            type: "line",
            data: [245, 312, 289, 198, 156, 89, 278, 189, 145],
            smooth: true,
            itemStyle: { color: "#165DFF" },
            areaStyle: { color: "rgba(22, 93, 255, 0.1)" },
          },
          {
            name: "通过数",
            type: "line",
            data: [198, 267, 245, 167, 134, 76, 245, 156, 123],
            smooth: true,
            itemStyle: { color: "#52C41A" },
            areaStyle: { color: "rgba(82, 196, 26, 0.1)" },
          },
        ],
      });
    }
    if (chartRef2.current) {
      const chart = echarts.init(chartRef2.current);
      chart.setOption({
        tooltip: { trigger: "item" },
        legend: { type: "scroll", orient: "vertical", right: 10 },
        series: [{
          type: "pie",
          radius: ["40%", "70%"],
          center: ["40%", "50%"],
          data: [
            { name: "国家奖学金", value: 156, itemStyle: { color: "#165DFF" } },
            { name: "国家助学金", value: 523, itemStyle: { color: "#52C41A" } },
            { name: "校内奖学金", value: 312, itemStyle: { color: "#FA8C16" } },
            { name: "勤工助学", value: 289, itemStyle: { color: "#722ED1" } },
            { name: "临时困难补助", value: 156, itemStyle: { color: "#F5222D" } },
            { name: "其他", value: 132, itemStyle: { color: "#999999" } },
          ],
          label: { show: false },
        }],
      });
    }
  }, []);

  const handleExport = (format: string) => {
    toast({ title: "导出中", description: `正在生成${format.toUpperCase()}报表...` });
  };

  const reportData = [
    { month: "2025年9月", applications: 245, approved: 198, rejected: 32, pending: 15, amount: 1960000 },
    { month: "2025年10月", applications: 312, approved: 267, rejected: 28, pending: 17, amount: 2500000 },
    { month: "2025年11月", applications: 289, approved: 245, rejected: 25, pending: 19, amount: 2310000 },
    { month: "2025年12月", applications: 198, approved: 167, rejected: 18, pending: 13, amount: 1580000 },
    { month: "2026年1月", applications: 156, approved: 134, rejected: 12, pending: 10, amount: 1250000 },
    { month: "2026年2月", applications: 89, approved: 76, rejected: 8, pending: 5, amount: 710000 },
    { month: "2026年3月", applications: 278, approved: 245, rejected: 20, pending: 13, amount: 2220000 },
    { month: "2026年4月", applications: 189, approved: 156, rejected: 22, pending: 11, amount: 1510000 },
    { month: "2026年5月", applications: 145, approved: 123, rejected: 15, pending: 7, amount: 1160000 },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报表统计</h1>
          <p className="text-gray-500 mt-1">资助申请数据统计与报表导出</p>
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
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 快捷导出 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleExport("pdf")}>
          <CardContent className="pt-6 text-center">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-red-500 mb-3" />
            <p className="font-medium">导出PDF</p>
            <p className="text-sm text-gray-500">打印格式报表</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleExport("excel")}>
          <CardContent className="pt-6 text-center">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-green-500 mb-3" />
            <p className="font-medium">导出Excel</p>
            <p className="text-sm text-gray-500">可编辑数据表</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleExport("csv")}>
          <CardContent className="pt-6 text-center">
            <Download className="w-10 h-10 mx-auto text-blue-500 mb-3" />
            <p className="font-medium">导出CSV</p>
            <p className="text-sm text-gray-500">通用数据格式</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6 text-center">
            <Printer className="w-10 h-10 mx-auto text-purple-500 mb-3" />
            <p className="font-medium">打印报表</p>
            <p className="text-sm text-gray-500">直接打印输出</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">趋势分析</TabsTrigger>
          <TabsTrigger value="distribution">分布统计</TabsTrigger>
          <TabsTrigger value="table">数据明细</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                月度申请趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={chartRef1} style={{ height: 350 }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-500" />
                  类型分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={chartRef2} style={{ height: 300 }} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  学院统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "信息工程学院", count: 286, percent: 18.2 },
                    { name: "经济管理学院", count: 245, percent: 15.6 },
                    { name: "机械工程学院", count: 198, percent: 12.6 },
                    { name: "外国语学院", count: 167, percent: 10.7 },
                    { name: "艺术设计学院", count: 156, percent: 9.9 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600">{item.name}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${item.percent * 5}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>月度数据明细</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                <Download className="w-4 h-4 mr-2" />
                导出Excel
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>月份</TableHead>
                    <TableHead className="text-right">申请数</TableHead>
                    <TableHead className="text-right">通过数</TableHead>
                    <TableHead className="text-right">驳回数</TableHead>
                    <TableHead className="text-right">待审批</TableHead>
                    <TableHead className="text-right">资助金额(元)</TableHead>
                    <TableHead className="text-right">通过率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{row.applications}</TableCell>
                      <TableCell className="text-right text-green-600">{row.approved}</TableCell>
                      <TableCell className="text-right text-red-600">{row.rejected}</TableCell>
                      <TableCell className="text-right text-amber-600">{row.pending}</TableCell>
                      <TableCell className="text-right">{row.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {((row.approved / row.applications) * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
