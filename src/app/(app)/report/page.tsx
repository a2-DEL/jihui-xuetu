"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, FileText, Download, TrendingUp,
  Clock, CheckCircle2, XCircle, ChevronRight,
  PieChart, LineChart, ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface ReportStats {
  totalReports: number;
  generatedToday: number;
  scheduledReports: number;
  downloadCount: number;
}

const mockStats: ReportStats = {
  totalReports: 89,
  generatedToday: 5,
  scheduledReports: 12,
  downloadCount: 234,
};

const recentReports = [
  { id: "1", name: "月度资助统计报表", type: "月度报表", generateTime: "今天 10:30", size: "2.1MB", status: "completed" },
  { id: "2", name: "学院资助汇总", type: "汇总报表", generateTime: "今天 09:15", size: "1.5MB", status: "completed" },
  { id: "3", name: "审批效率分析报告", type: "分析报告", generateTime: "昨天 16:45", size: "3.2MB", status: "completed" },
  { id: "4", name: "年度资助发放统计", type: "年度报表", generateTime: "昨天 14:20", size: "5.8MB", status: "completed" },
];

const quickActions = [
  { name: "统计分析", path: "/report/statistics", icon: BarChart3, description: "查看数据统计分析" },
  { name: "报表导出", path: "/report/export", icon: Download, description: "导出各类数据报表" },
];

export default function ReportPage() {
  const [stats] = useState<ReportStats>(mockStats);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报表统计</h1>
          <p className="text-gray-500 mt-1">查看统计分析报表，导出数据报告</p>
        </div>
        <Link href="/report/export">
          <Button className="bg-[#165DFF] hover:bg-[#0E4FD9]">
            <Download className="w-4 h-4 mr-2" />
            生成报表
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">报表总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              </div>
              <FileText className="w-8 h-8 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#52C41A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日生成</p>
                <p className="text-2xl font-bold text-gray-900">{stats.generatedToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#52C41A]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#722ED1]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">定时报表</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduledReports}</p>
              </div>
              <Clock className="w-8 h-8 text-[#722ED1]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#FA8C16]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">下载次数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.downloadCount}</p>
              </div>
              <Download className="w-8 h-8 text-[#FA8C16]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 快捷入口 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">快捷入口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                href={action.path}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-[#165DFF] hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#165DFF]/10 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-[#165DFF]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.name}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#165DFF]" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* 最近生成报表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">最近生成报表</CardTitle>
            <Link href="/report/statistics" className="text-sm text-[#165DFF] hover:underline">
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#165DFF]/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#165DFF]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{report.name}</p>
                      <p className="text-xs text-gray-500">{report.size} · {report.generateTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{report.type}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
