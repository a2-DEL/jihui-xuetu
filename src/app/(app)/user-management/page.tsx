"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Shield, UserCheck, UserX, Plus,
  TrendingUp, Clock, CheckCircle2, XCircle,
  ChevronRight, BarChart3, Settings, UserCog
} from "lucide-react";
import Link from "next/link";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRoles: number;
}

const mockStats: UserStats = {
  totalUsers: 1247,
  activeUsers: 1156,
  newUsersToday: 12,
  totalRoles: 5,
};

const recentUsers = [
  { id: "1", name: "张三", role: "资助管理员", department: "学生资助中心", status: "active", lastActive: "刚刚" },
  { id: "2", name: "李四", role: "辅导员", department: "计算机学院", status: "active", lastActive: "5分钟前" },
  { id: "3", name: "王五", role: "学生", department: "信息学院", status: "active", lastActive: "10分钟前" },
  { id: "4", name: "赵六", role: "审批人员", department: "财务处", status: "inactive", lastActive: "1小时前" },
];

const quickActions = [
  { name: "用户列表", path: "/user-management/users", icon: Users, description: "管理系统用户账户" },
  { name: "角色权限", path: "/user-management/roles", icon: Shield, description: "配置角色与权限" },
];

export default function UserManagementPage() {
  const [stats] = useState<UserStats>(mockStats);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户、角色和权限</p>
        </div>
        <Link href="/user-management/users">
          <Button className="bg-[#165DFF] hover:bg-[#0E4FD9]">
            <Plus className="w-4 h-4 mr-2" />
            新建用户
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#52C41A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活跃用户</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              </div>
              <UserCheck className="w-8 h-8 text-[#52C41A]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#722ED1]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日新增</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newUsersToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#722ED1]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#FA8C16]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">角色数量</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
              </div>
              <Shield className="w-8 h-8 text-[#FA8C16]" />
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

        {/* 最近活跃用户 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">最近活跃用户</CardTitle>
            <Link href="/user-management/users" className="text-sm text-[#165DFF] hover:underline">
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#165DFF]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#165DFF]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    <Badge 
                      variant={user.status === "active" ? "default" : "secondary"}
                      className={`text-xs ${user.status === "active" ? "bg-[#52C41A]/10 text-[#52C41A]" : "bg-gray-100 text-gray-500"}`}
                    >
                      {user.status === "active" ? "在线" : "离线"}
                    </Badge>
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
