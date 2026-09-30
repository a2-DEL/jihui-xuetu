"use client";

import { useState, useEffect } from "react";
import {
  User,
  Lock,
  FileText,
  Bell,
  Settings,
  Camera,
  Save,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  Building,
  Award,
} from "lucide-react";
import Link from "next/link";

interface UserInfo {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  avatar: string;
  department: string;
  position: string;
  roles: string[];
  joinDate: string;
}

interface MyApplication {
  id: string;
  type: string;
  title: string;
  status: "pending" | "approved" | "rejected" | "draft";
  submitTime: string;
  amount?: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "password" | "applications">("info");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: "1",
    username: "admin",
    realName: "张三",
    email: "zhangsan@edu.cn",
    phone: "13800138000",
    avatar: "",
    department: "学生资助管理中心",
    position: "管理员",
    roles: ["超级管理员", "审批员"],
    joinDate: "2024-09-01",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [myApplications] = useState<MyApplication[]>([
    {
      id: "1",
      type: "国家奖学金",
      title: "2024-2025学年国家奖学金申请",
      status: "approved",
      submitTime: "2024-10-15 14:30",
      amount: 8000,
    },
    {
      id: "2",
      type: "国家助学金",
      title: "2024-2025学年国家助学金申请",
      status: "pending",
      submitTime: "2024-11-20 09:15",
      amount: 3000,
    },
    {
      id: "3",
      type: "勤工助学",
      title: "图书馆助理岗位申请",
      status: "approved",
      submitTime: "2024-09-10 16:45",
    },
    {
      id: "4",
      type: "临时困难补助",
      title: "家庭临时困难补助申请",
      status: "rejected",
      submitTime: "2024-08-05 11:20",
      amount: 2000,
    },
    {
      id: "5",
      type: "学费减免",
      title: "2024年秋季学期学费减免申请",
      status: "draft",
      submitTime: "2024-12-01 10:00",
    },
  ]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; text: string; icon: React.ReactNode }> = {
      pending: { color: "text-orange-600", bg: "bg-orange-50", text: "待审核", icon: <Clock className="w-4 h-4" /> },
      approved: { color: "text-green-600", bg: "bg-green-50", text: "已通过", icon: <CheckCircle className="w-4 h-4" /> },
      rejected: { color: "text-red-600", bg: "bg-red-50", text: "已驳回", icon: <XCircle className="w-4 h-4" /> },
      draft: { color: "text-gray-600", bg: "bg-gray-50", text: "草稿", icon: <AlertCircle className="w-4 h-4" /> },
    };
    return configs[status] || configs.draft;
  };

  const handleSaveInfo = () => {
    // 保存个人信息
    alert("个人信息保存成功！");
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("两次输入的密码不一致！");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("密码长度不能少于6位！");
      return;
    }
    alert("密码修改成功！");
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">个人中心</h1>
          <p className="text-gray-500 mt-1">管理您的个人信息和账户设置</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* 左侧个人信息卡片 */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* 头像 */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#165DFF] to-[#0D1B2A] flex items-center justify-center text-white text-3xl font-medium">
                    {userInfo.realName.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{userInfo.realName}</h3>
                <p className="text-gray-500 text-sm">{userInfo.position}</p>
              </div>

              {/* 基本信息 */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="truncate">{userInfo.department}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="truncate">{userInfo.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{userInfo.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>加入于 {userInfo.joinDate}</span>
                </div>
              </div>

              {/* 角色标签 */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">角色权限</p>
                <div className="flex flex-wrap gap-2">
                  {userInfo.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white rounded-xl shadow-sm mt-4 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "info" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    个人信息
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "password" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    修改密码
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "applications" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    我的申请
                  </span>
                  <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                    {myApplications.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="col-span-3">
            {/* 个人信息 */}
            {activeTab === "info" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">基本信息</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                    <input
                      type="text"
                      value={userInfo.username}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">真实姓名</label>
                    <input
                      type="text"
                      value={userInfo.realName}
                      onChange={(e) => setUserInfo({ ...userInfo, realName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
                    <input
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">所属部门</label>
                    <input
                      type="text"
                      value={userInfo.department}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">职位</label>
                    <input
                      type="text"
                      value={userInfo.position}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveInfo}
                    className="px-6 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存修改
                  </button>
                </div>
              </div>
            )}

            {/* 修改密码 */}
            {activeTab === "password" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">修改密码</h2>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
                    <input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      placeholder="请输入当前密码"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="请输入新密码（至少6位）"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="请再次输入新密码"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleChangePassword}
                      className="w-full px-6 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      确认修改
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 我的申请 */}
            {activeTab === "applications" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">我的申请</h2>
                  <Link
                    href="/application/create"
                    className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    新建申请
                  </Link>
                </div>
                <div className="space-y-4">
                  {myApplications.map((app) => {
                    const statusConfig = getStatusConfig(app.status);
                    return (
                      <div
                        key={app.id}
                        className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                                {app.type}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 ${statusConfig.bg} ${statusConfig.color} text-xs rounded-full`}>
                                {statusConfig.icon}
                                {statusConfig.text}
                              </span>
                            </div>
                            <h3 className="mt-2 text-gray-900 font-medium">{app.title}</h3>
                            <p className="text-gray-500 text-sm mt-1">提交时间：{app.submitTime}</p>
                          </div>
                          {app.amount && (
                            <div className="text-right">
                              <p className="text-gray-500 text-xs">申请金额</p>
                              <p className="text-lg font-semibold text-[#165DFF]">¥{app.amount.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
