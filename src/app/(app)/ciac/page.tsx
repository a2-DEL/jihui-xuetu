"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Trophy, AlertTriangle, ArrowRight } from "lucide-react";

export default function CIACPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CIAC专项看板</h1>
        <p className="text-gray-500 mt-1">Comprehensive Intelligence & Assistance Center - 综合智能辅助中心</p>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/ciac/realtime">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">实时CIAC看板</p>
                  <p className="text-sm text-gray-500">实时监控AI识别效率与告警</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ciac/ranking">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">院系排名榜</p>
                  <p className="text-sm text-gray-500">各院系CIAC综合评分排名</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ciac/missed-students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">漏识学生预警</p>
                  <p className="text-sm text-gray-500">AI识别可能遗漏的贫困生</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 核心指标 */}
      <Card>
        <CardHeader>
          <CardTitle>CIAC核心指标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">识别学生总数</p>
              <p className="text-2xl font-bold text-blue-600">15,823</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">已识别贫困生</p>
              <p className="text-2xl font-bold text-green-600">12,658</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-500">识别准确率</p>
              <p className="text-2xl font-bold text-purple-600">94.5%</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-500">待处理预警</p>
              <p className="text-2xl font-bold text-orange-600">856</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <p className="text-sm text-gray-500">精准匹配数</p>
              <p className="text-2xl font-bold text-cyan-600">2,310</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
