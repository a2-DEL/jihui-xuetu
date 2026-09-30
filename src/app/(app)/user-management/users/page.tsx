"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  Shield,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Download,
  Upload,
  FileText,
  History,
  AlertTriangle,
} from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  real_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  created_at: string;
}

interface AuditLog {
  id: string;
  time: string;
  action: string;
  target: string;
  operator: string;
  detail: string;
}

const mockUsers: UserItem[] = [
  { id: "1", username: "admin", real_name: "系统管理员", email: "admin@edu.cn", phone: "13800138000", role: "超级管理员", department: "资助中心", status: "active", created_at: "2026-01-01" },
  { id: "2", username: "school_admin", real_name: "校级管理员", email: "school@edu.cn", phone: "13800138001", role: "校级管理员", department: "资助中心", status: "active", created_at: "2026-01-15" },
  { id: "3", username: "college_admin", real_name: "院系管理员", email: "college@edu.cn", phone: "13800138002", role: "院系管理员", department: "计算机学院", status: "active", created_at: "2026-02-01" },
  { id: "4", username: "teacher1", real_name: "张老师", email: "zhang@edu.cn", phone: "13800138003", role: "辅导员", department: "计算机学院", status: "active", created_at: "2026-03-15" },
  { id: "5", username: "teacher2", real_name: "李老师", email: "li@edu.cn", phone: "13800138004", role: "辅导员", department: "经济学院", status: "active", created_at: "2026-03-16" },
  { id: "6", username: "reviewer1", real_name: "王审核", email: "wang@edu.cn", phone: "13800138005", role: "校级管理员", department: "资助中心", status: "active", created_at: "2026-04-01" },
  { id: "7", username: "student1", real_name: "学生张三", email: "student1@edu.cn", phone: "13800138006", role: "学生", department: "计算机学院", status: "active", created_at: "2026-04-10" },
  { id: "8", username: "student2", real_name: "学生李四", email: "student2@edu.cn", phone: "13800138007", role: "学生", department: "经济学院", status: "active", created_at: "2026-04-11" },
  { id: "9", username: "bank1", real_name: "银行工作人员", email: "bank@bank.cn", phone: "13800138008", role: "银行人员", department: "合作银行", status: "active", created_at: "2026-05-01" },
  { id: "10", username: "auditor1", real_name: "审计员赵", email: "auditor@edu.cn", phone: "13800138009", role: "审计员", department: "审计部门", status: "active", created_at: "2026-05-15" },
];

const roles = ["超级管理员", "校级管理员", "院系管理员", "辅导员", "学生", "银行人员", "审计员"];
const departments = ["资助中心", "计算机学院", "经济学院", "信息学院", "合作银行", "审计部门"];

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>(mockUsers);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("全部");
  
  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  
  // 敏感操作二次确认
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // 审计日志
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: "1", time: "2026-05-30 14:30:00", action: "新增用户", target: "学生王五", operator: "系统管理员", detail: "创建学生账号" },
    { id: "2", time: "2026-05-30 14:15:00", action: "编辑用户", target: "张老师", operator: "系统管理员", detail: "修改部门为计算机学院" },
    { id: "3", time: "2026-05-30 13:00:00", action: "批量导入", target: "10个用户", operator: "系统管理员", detail: "导入辅导员名单" },
    { id: "4", time: "2026-05-29 16:45:00", action: "删除用户", target: "测试账号", operator: "系统管理员", detail: "删除测试账号" },
    { id: "5", time: "2026-05-29 10:20:00", action: "导出数据", target: "全体用户", operator: "系统管理员", detail: "导出用户名单" },
  ]);
  
  // 表单数据
  const [formData, setFormData] = useState({
    username: "",
    real_name: "",
    email: "",
    phone: "",
    role: "学生",
    department: "计算机学院",
    status: "active" as "active" | "inactive",
  });
  
  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // 添加审计日志
  const addAuditLog = (action: string, target: string, detail: string) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleString("zh-CN"),
      action,
      target,
      operator: "当前用户",
      detail,
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch = user.real_name.includes(searchKeyword) || user.username.includes(searchKeyword);
    const matchRole = roleFilter === "全部" || user.role === roleFilter;
    return matchSearch && matchRole;
  });
  
  // 打开新增弹窗
  const handleAdd = () => {
    setFormData({
      username: "",
      real_name: "",
      email: "",
      phone: "",
      role: "学生",
      department: "计算机学院",
      status: "active",
    });
    setShowAddModal(true);
  };
  
  // 打开编辑弹窗
  const handleEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      real_name: user.real_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setShowEditModal(true);
  };
  
  // 打开删除确认
  const handleDeleteConfirm = (user: UserItem) => {
    setSelectedUser(user);
    setDeleteConfirmText("");
    setShowDeleteConfirm(true);
  };
  
  // 提交新增
  const submitAdd = () => {
    if (!formData.username || !formData.real_name || !formData.email) {
      showToast("请填写完整信息", "error");
      return;
    }
    
    const newUser: UserItem = {
      id: Date.now().toString(),
      ...formData,
      created_at: new Date().toISOString().split("T")[0],
    };
    
    setUsers([...users, newUser]);
    setShowAddModal(false);
    addAuditLog("新增用户", formData.real_name, `创建${formData.role}账号`);
    showToast("用户添加成功", "success");
  };
  
  // 提交编辑
  const submitEdit = () => {
    if (!selectedUser || !formData.username || !formData.real_name || !formData.email) {
      showToast("请填写完整信息", "error");
      return;
    }
    
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, ...formData }
        : u
    ));
    setShowEditModal(false);
    addAuditLog("编辑用户", formData.real_name, `修改用户信息`);
    setSelectedUser(null);
    showToast("用户信息已更新", "success");
  };
  
  // 确认删除（敏感操作需要二次确认）
  const confirmDelete = () => {
    if (!selectedUser) return;
    if (deleteConfirmText !== selectedUser.username) {
      showToast("请输入正确的用户名确认删除", "error");
      return;
    }
    
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setShowDeleteConfirm(false);
    addAuditLog("删除用户", selectedUser.real_name, `删除${selectedUser.role}账号`);
    setSelectedUser(null);
    showToast("用户已删除", "success");
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };
  
  // 切换单个选择
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  
  // 导出用户数据
  const exportUsers = () => {
    const dataToExport = selectedIds.length > 0 
      ? users.filter(u => selectedIds.includes(u.id))
      : filteredUsers;
    
    const csv = [
      "用户名,真实姓名,邮箱,手机号,角色,部门,状态,创建时间",
      ...dataToExport.map(u => `${u.username},${u.real_name},${u.email},${u.phone},${u.role},${u.department},${u.status === "active" ? "正常" : "禁用"},${u.created_at}`)
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `用户数据_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    addAuditLog("导出数据", `${dataToExport.length}个用户`, "导出用户名单CSV");
    showToast(`已导出${dataToExport.length}个用户数据`, "success");
    setSelectedIds([]);
  };
  
  // 导入用户数据
  const handleImport = () => {
    if (!importData.trim()) {
      showToast("请输入导入数据", "error");
      return;
    }
    
    try {
      const lines = importData.trim().split("\n");
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 5) {
          const newUser: UserItem = {
            id: Date.now().toString() + i,
            username: parts[0].trim(),
            real_name: parts[1].trim(),
            email: parts[2].trim(),
            phone: parts[3].trim(),
            role: parts[4].trim() || "学生",
            department: parts[5]?.trim() || "资助中心",
            status: "active",
            created_at: new Date().toISOString().split("T")[0],
          };
          setUsers(prev => [...prev, newUser]);
          successCount++;
        } else {
          failCount++;
        }
      }
      
      addAuditLog("批量导入", `${successCount}个用户`, `成功${successCount}个，失败${failCount}个`);
      showToast(`导入成功${successCount}个，失败${failCount}个`, successCount > 0 ? "success" : "error");
      setShowImportModal(false);
      setImportData("");
    } catch {
      showToast("导入数据格式错误", "error");
    }
  };
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户和角色权限（超级管理员全量管理）</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAuditLog(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <History className="w-4 h-4" />
            审计日志
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Upload className="w-4 h-4" />
            批量导入
          </button>
          <button 
            onClick={exportUsers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            新增用户
          </button>
        </div>
      </div>

      {/* 批量操作提示 */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="w-4 h-4" />
            已选择 {selectedIds.length} 个用户
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportUsers}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              导出选中
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-100"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户名或姓名..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="全部">全部角色</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-12">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户信息</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">部门</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">联系方式</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.real_name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    user.role === "超级管理员" ? "bg-red-100 text-red-600" :
                    user.role === "校级管理员" ? "bg-orange-100 text-orange-600" :
                    user.role === "院系管理员" ? "bg-yellow-100 text-yellow-600" :
                    user.role === "辅导员" ? "bg-blue-100 text-blue-600" :
                    user.role === "学生" ? "bg-green-100 text-green-600" :
                    user.role === "银行人员" ? "bg-purple-100 text-purple-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <Shield className="w-3 h-3" />
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600">{user.department}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <p className="flex items-center gap-1 text-gray-600">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </p>
                    <p className="flex items-center gap-1 text-gray-500 mt-1">
                      <Phone className="w-3 h-3" />
                      {user.phone}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    user.status === "active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {user.status === "active" ? "正常" : "禁用"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg" 
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => handleDeleteConfirm(user)}
                      className="p-1.5 hover:bg-red-50 rounded-lg" 
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 text-sm text-gray-500">
          共 {users.length} 个用户，当前显示 {filteredUsers.length} 个
        </div>
      </div>
      
      {/* 新增用户弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新增用户</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名 *</label>
                <input
                  type="text"
                  value={formData.real_name}
                  onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="请输入真实姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="请输入邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="请输入手机号"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={submitAdd}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑用户弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">编辑用户</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名 *</label>
                <input
                  type="text"
                  value={formData.real_name}
                  onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="active">正常</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={submitEdit}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 删除确认弹窗 - 敏感操作二次确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600">敏感操作确认</h3>
                <p className="text-sm text-gray-500">此操作不可恢复</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">
                您即将删除用户 <span className="font-semibold">{selectedUser?.real_name}</span>（@{selectedUser?.username}），
                该操作将永久删除该用户的所有数据，且无法恢复。
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请输入用户名 <span className="font-mono bg-gray-100 px-1 rounded">{selectedUser?.username}</span> 确认删除：
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="请输入用户名确认"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmText !== selectedUser?.username}
                className={`px-4 py-2 rounded-lg ${
                  deleteConfirmText === selectedUser?.username
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 批量导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">批量导入用户</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
                >
                  <Upload className="w-4 h-4" />
                  选择文件
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const template = "用户名,真实姓名,邮箱,手机号,角色,部门\nzhangsan,张三,zhang@edu.cn,13800138000,学生,计算机学院\nlisi,李四,li@edu.cn,13800138001,辅导员,经济学院";
                    const blob = new Blob(["\ufeff" + template], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "用户导入模板.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast("模板已下载", "success");
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  下载模板
                </button>
                <span className="text-sm text-gray-500">支持 CSV/TXT/XLSX 格式</span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-blue-700 mb-2">📋 字段说明：</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-blue-600">
                  <span>• 用户名（必填）</span>
                  <span>• 真实姓名（必填）</span>
                  <span>• 邮箱（必填）</span>
                  <span>• 手机号</span>
                  <span>• 角色（默认：学生）</span>
                  <span>• 部门（默认：资助中心）</span>
                </div>
                <p className="text-xs text-blue-500 mt-2">提示：第一行为表头，从第二行开始为数据</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  导入规则：用户名重复的行将被跳过，邮箱格式不正确的行将提示错误
                </p>
              </div>
              
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-48 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                placeholder="用户名,真实姓名,邮箱,手机号,角色,部门
zhangsan,张三,zhang@edu.cn,13800138000,学生,计算机学院
lisi,李四,li@edu.cn,13800138001,辅导员,经济学院"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 审计日志弹窗 */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">操作审计日志</h3>
              </div>
              <button onClick={() => setShowAuditLog(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作对象</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作人</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{log.time}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          log.action === "删除用户" ? "bg-red-100 text-red-600" :
                          log.action === "新增用户" ? "bg-green-100 text-green-600" :
                          log.action === "编辑用户" ? "bg-blue-100 text-blue-600" :
                          log.action === "批量导入" ? "bg-purple-100 text-purple-600" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{log.target}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.operator}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {auditLogs.length} 条记录</span>
              <button
                onClick={() => setShowAuditLog(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
