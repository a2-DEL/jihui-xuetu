"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, BellOff, Mail, MessageSquare, Settings,
  TrendingUp, Clock, CheckCircle2, XCircle,
  ChevronRight, Volume2, VolumeX
} from "lucide-react";
import Link from "next/link";

interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  todayNotifications: number;
  pushEnabled: boolean;
}

const mockStats: NotificationStats = {
  totalNotifications: 247,
  unreadCount: 18,
  todayNotifications: 32,
  pushEnabled: true,
};

const recentNotifications = [
  { id: "1", title: "审批申请待处理", content: "张三的国家助学金申请等待您的审批", time: "5分钟前", type: "approval", read: false },
  { id: "2", title: "系统公告", content: "系统将于今晚22:00进行维护升级", time: "30分钟前", type: "system", read: false },
  { id: "3", title: "申请已通过", content: "李四的奖学金申请已通过最终审批", time: "1小时前", type: "success", read: true },
  { id: "4", title: "材料补交通知", content: "王五需要补交贫困证明材料", time: "2小时前", type: "warning", read: true },
];

const quickActions = [
  { name: "消息中心", path: "/notification/center", icon: Bell, description: "查看所有消息通知" },
  { name: "通知设置", path: "/notification/settings", icon: Settings, description: "配置通知规则和推送" },
];

const typeColors: Record<string, string> = {
  approval: "#FA8C16",
  system: "#165DFF",
  success: "#52C41A",
  warning: "#FADB14",
};

export default function NotificationPage() {
  const [stats] = useState<NotificationStats>(mockStats);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知管理</h1>
          <p className="text-gray-500 mt-1">管理系统消息、通知和推送设置</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notification/center">
            <Button variant="outline" className="border-gray-300">
              <Bell className="w-4 h-4 mr-2" />
              消息中心
            </Button>
          </Link>
          <Link href="/notification/settings">
            <Button className="bg-[#165DFF] hover:bg-[#0E4FD9]">
              <Settings className="w-4 h-4 mr-2" />
              通知设置
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">消息总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotifications}</p>
              </div>
              <Mail className="w-8 h-8 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#F5222D]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未读消息</p>
                <p className="text-2xl font-bold text-[#F5222D]">{stats.unreadCount}</p>
              </div>
              <BellOff className="w-8 h-8 text-[#F5222D]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#722ED1]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日消息</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayNotifications}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#722ED1]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#52C41A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">推送状态</p>
                <p className="text-lg font-bold text-gray-900">{stats.pushEnabled ? "已开启" : "已关闭"}</p>
              </div>
              {stats.pushEnabled ? (
                <Volume2 className="w-8 h-8 text-[#52C41A]" />
              ) : (
                <VolumeX className="w-8 h-8 text-gray-400" />
              )}
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

        {/* 最近通知 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">最近通知</CardTitle>
            <Link href="/notification/center" className="text-sm text-[#165DFF] hover:underline">
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div 
                    className="w-2 h-2 rounded-full mt-2" 
                    style={{ backgroundColor: typeColors[notification.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-gray-900 text-sm truncate ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notification.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{notification.content}</p>
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
