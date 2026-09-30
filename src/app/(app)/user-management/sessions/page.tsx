"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  User,
  Clock,
  Monitor,
  Smartphone,
  MapPin,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Activity,
  Wifi,
  WifiOff,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OnlineSession {
  id: string;
  user_id: string;
  username: string;
  real_name: string;
  role: string;
  login_time: string;
  last_active: string;
  ip_address: string;
  location: string;
  device: "pc" | "mobile";
  browser: string;
  status: "active" | "idle" | "expired";
}

const mockSessions: OnlineSession[] = [
  { id: "s1", user_id: "1", username: "super_admin", real_name: "系统管理员", role: "超级管理员", login_time: "2026-06-05 08:30:00", last_active: "2026-06-05 11:45:00", ip_address: "192.168.1.100", location: "北京市海淀区", device: "pc", browser: "Chrome 120", status: "active" },
  { id: "s2", user_id: "2", username: "school_admin", real_name: "校级管理员", role: "校级管理员", login_time: "2026-06-05 09:00:00", last_active: "2026-06-05 11:40:00", ip_address: "192.168.1.101", location: "北京市海淀区", device: "pc", browser: "Firefox 115", status: "active" },
  { id: "s3", user_id: "3", username: "dept_admin", real_name: "院系管理员", role: "院系管理员", login_time: "2026-06-05 08:45:00", last_active: "2026-06-05 10:20:00", ip_address: "192.168.2.50", location: "北京市海淀区", device: "pc", browser: "Edge 120", status: "idle" },
  { id: "s4", user_id: "4", username: "counselor_zhang", real_name: "张老师", role: "辅导员", login_time: "2026-06-05 07:30:00", last_active: "2026-06-05 11:30:00", ip_address: "192.168.3.20", location: "北京市海淀区", device: "pc", browser: "Chrome 119", status: "active" },
  { id: "s5", user_id: "5", username: "counselor_li", real_name: "李老师", role: "辅导员", login_time: "2026-06-05 08:00:00", last_active: "2026-06-05 09:15:00", ip_address: "192.168.3.21", location: "北京市海淀区", device: "mobile", browser: "Safari Mobile", status: "idle" },
  { id: "s6", user_id: "6", username: "student_wang", real_name: "学生王五", role: "学生", login_time: "2026-06-05 10:00:00", last_active: "2026-06-05 11:35:00", ip_address: "10.0.0.156", location: "北京市昌平区", device: "mobile", browser: "Chrome Mobile", status: "active" },
  { id: "s7", user_id: "7", username: "student_zhao", real_name: "学生赵六", role: "学生", login_time: "2026-06-05 09:30:00", last_active: "2026-06-05 11:20:00", ip_address: "10.0.0.178", location: "北京市朝阳区", device: "pc", browser: "Chrome 120", status: "active" },
  { id: "s8", user_id: "8", username: "bank_staff1", real_name: "银行工作人员", role: "银行人员", login_time: "2026-06-05 08:15:00", last_active: "2026-06-05 11:00:00", ip_address: "172.16.0.50", location: "北京市西城区", device: "pc", browser: "IE 11", status: "active" },
];

export default function SessionManagement() {
  const [sessions, setSessions] = useState<OnlineSession[]>(mockSessions);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showKickConfirm, setShowKickConfirm] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("全部");
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 统计数据
  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === "active").length,
    idle: sessions.filter(s => s.status === "idle").length,
    pc: sessions.filter(s => s.device === "pc").length,
    mobile: sessions.filter(s => s.device === "mobile").length,
    byRole: sessions.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // 模拟更新最后活跃时间
      setSessions(prev => prev.map(s => ({
        ...s,
        last_active: s.status === "active" 
          ? new Date().toLocaleString("zh-CN")
          : s.last_active
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 强制踢出
  const handleKick = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
    setShowKickConfirm(null);
    showToast(`已将 ${session?.real_name} 踢下线`, "success");
  };

  // 批量踢出空闲用户
  const kickIdleUsers = () => {
    const idleSessions = sessions.filter(s => s.status === "idle");
    setSessions(sessions.filter(s => s.status !== "idle"));
    showToast(`已踢出 ${idleSessions.length} 个空闲用户`, "success");
  };

  // 过滤会话
  const filteredSessions = sessions.filter(s => 
    selectedRole === "全部" || s.role === selectedRole
  );

  const roles = ["全部", ...new Set(sessions.map(s => s.role))];

  // 计算在线时长
  const getOnlineDuration = (loginTime: string) => {
    const login = new Date(loginTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - login.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff}分钟`;
    return `${Math.floor(diff / 60)}小时${diff % 60}分钟`;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会话管理</h1>
          <p className="text-gray-500 mt-1">查看在线用户，支持强制踢出</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "border-green-500 text-green-600" : ""}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "自动刷新" : "手动刷新"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={kickIdleUsers}
            disabled={stats.idle === 0}
          >
            <LogOut className="w-4 h-4 mr-2" />
            踢出空闲用户 ({stats.idle})
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-white border-l-4 border-l-[#165DFF]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">在线用户</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-6 h-6 text-[#165DFF]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">活跃用户</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Activity className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">空闲用户</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.idle}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">PC端</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pc}</p>
              </div>
              <Monitor className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">移动端</p>
                <p className="text-2xl font-bold text-orange-600">{stats.mobile}</p>
              </div>
              <Smartphone className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">角色分布</p>
                <p className="text-lg font-bold text-blue-600">{Object.keys(stats.byRole).length}种</p>
              </div>
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 在线用户列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-500" />
              在线会话列表
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">登录时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">在线时长</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">最后活跃</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">设备/位置</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{session.real_name}</p>
                          <p className="text-xs text-gray-500">@{session.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${
                        session.role === "超级管理员" ? "bg-red-100 text-red-600" :
                        session.role === "校级管理员" ? "bg-orange-100 text-orange-600" :
                        session.role === "院系管理员" ? "bg-yellow-100 text-yellow-600" :
                        session.role === "辅导员" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {session.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.login_time}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getOnlineDuration(session.login_time)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.last_active}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="flex items-center gap-1 text-gray-600">
                          {session.device === "pc" ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {session.browser}
                        </p>
                        <p className="flex items-center gap-1 text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </p>
                        <p className="text-xs text-gray-400">{session.ip_address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${
                        session.status === "active" 
                          ? "bg-green-100 text-green-600" 
                          : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {session.status === "active" ? (
                          <>
                            <Wifi className="w-3 h-3 mr-1" />
                            活跃
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1" />
                            空闲
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowKickConfirm(session.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
            <span>共 {sessions.length} 个在线会话</span>
            <span>刷新间隔: {autoRefresh ? "30秒" : "手动"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 角色分布统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            角色在线分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(stats.byRole).map(([role, count]) => (
              <div key={role} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">{role}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#165DFF] rounded-full"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 踢出确认弹窗 */}
      {showKickConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">强制踢出</h3>
                <p className="text-sm text-gray-500">用户将立即下线</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              确定要将 <span className="font-medium">{sessions.find(s => s.id === showKickConfirm)?.real_name}</span> 踢下线吗？
              该用户将立即跳转到登录页面。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowKickConfirm(null)}>
                取消
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600"
                onClick={() => handleKick(showKickConfirm)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                确认踢出
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
