"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  FileText,
  User,
  Calendar,
  Building,
  Coins,
} from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  student_name: string;
  student_id: string;
  department: string;
  type: string;
  amount: number;
  status: string;
  submit_time: string;
  ai_score?: number;
  reason?: string;
  materials?: string[];
  reviewer?: string;
}

// 模拟待审核数据
const mockPendingApplications: Application[] = [
  { id: "1", student_name: "张三", student_id: "2021001", department: "计算机学院", type: "国家奖学金", amount: 8000, status: "pending", submit_time: "2026-05-27 10:30", ai_score: 85, reason: "家庭经济困难，成绩优秀", materials: ["成绩单", "家庭情况说明"] },
  { id: "3", student_name: "王五", student_id: "2021003", department: "文学院", type: "校内奖学金", amount: 2000, status: "reviewing", submit_time: "2026-05-26 09:15", ai_score: 78, reason: "学习进步显著", materials: ["成绩单"], reviewer: "李老师" },
  { id: "5", student_name: "钱七", student_id: "2021005", department: "计算机学院", type: "临时困难补助", amount: 1000, status: "pending", submit_time: "2026-05-25 11:30", ai_score: 88, reason: "突发家庭变故", materials: ["情况说明", "证明材料"] },
  { id: "8", student_name: "吴十", student_id: "2021008", department: "理学院", type: "国家奖学金", amount: 8000, status: "pending", submit_time: "2026-05-23 14:50", ai_score: 82, reason: "综合测评前三", materials: ["成绩单", "获奖证书"] },
  { id: "9", student_name: "郑十一", student_id: "2021009", department: "信息学院", type: "国家助学金", amount: 3000, status: "reviewing", submit_time: "2026-05-22 16:30", ai_score: 91, reason: "家庭经济困难", materials: ["贫困证明"], reviewer: "王老师" },
  { id: "10", student_name: "陈十二", student_id: "2021010", department: "法学院", type: "学费减免", amount: 5000, status: "pending", submit_time: "2026-05-21 09:00", ai_score: 76, reason: "烈士子女", materials: ["烈士证明"] },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "待审核", color: "bg-orange-100 text-orange-600", icon: Clock },
  reviewing: { label: "审核中", color: "bg-blue-100 text-blue-600", icon: AlertCircle },
};

const applicationTypes = ["全部类型", "国家奖学金", "国家助学金", "校内奖学金", "勤工助学", "临时困难补助", "生源地贷款", "学费减免"];
const departments = ["全部学院", "计算机学院", "经济学院", "文学院", "理学院", "信息学院", "法学院"];

export default function PendingApplicationList() {
  const [applications, setApplications] = useState<Application[]>(mockPendingApplications);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [departmentFilter, setDepartmentFilter] = useState("全部学院");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredApplications = applications.filter((app) => {
    const matchSearch = app.student_name.includes(searchKeyword) || app.student_id.includes(searchKeyword);
    const matchType = typeFilter === "全部类型" || app.type === typeFilter;
    const matchDept = departmentFilter === "全部学院" || app.department === departmentFilter;
    return matchSearch && matchType && matchDept;
  });

  const paginatedApplications = filteredApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  const handleViewDetail = (app: Application) => {
    setSelectedApp(app);
    setShowDetailModal(true);
  };

  const handleApprove = (app: Application) => {
    setSelectedApp(app);
    setShowApproveConfirm(true);
  };

  const handleReject = (app: Application) => {
    setSelectedApp(app);
    setRejectReason("");
    setShowRejectConfirm(true);
  };

  const confirmApprove = () => {
    if (selectedApp) {
      setApplications(applications.filter(app => app.id !== selectedApp.id));
      showToast(`申请 ${selectedApp.id} 已通过审批`, "success");
      setShowApproveConfirm(false);
      setSelectedApp(null);
    }
  };

  const confirmReject = () => {
    if (selectedApp) {
      setApplications(applications.filter(app => app.id !== selectedApp.id));
      showToast(`申请 ${selectedApp.id} 已驳回`, "success");
      setShowRejectConfirm(false);
      setSelectedApp(null);
      setRejectReason("");
    }
  };

  const handleExport = () => {
    showToast("正在导出待审核申请列表...", "success");
  };

  // 统计数据
  const pendingCount = applications.filter(a => a.status === "pending").length;
  const reviewingCount = applications.filter(a => a.status === "reviewing").length;
  const totalAmount = applications.reduce((sum, a) => sum + a.amount, 0);
  const avgScore = applications.length > 0 
    ? Math.round(applications.reduce((sum, a) => sum + (a.ai_score || 0), 0) / applications.length) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white flex items-center gap-2`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">待审核申请</h1>
          <p className="text-gray-500 mt-1">共 {applications.length} 条待审核申请</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            导出列表
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审核</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">审核中</p>
              <p className="text-2xl font-bold text-blue-600">{reviewingCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">涉及金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AI平均评分</p>
              <p className="text-2xl font-bold text-purple-600">{avgScore}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索学生姓名或学号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {applicationTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 申请列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">申请编号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">学生信息</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">申请类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">AI评分</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">提交时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedApplications.map((app) => {
              const statusInfo = statusConfig[app.status];
              const StatusIcon = statusInfo.icon;
              return (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{app.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{app.student_name}</div>
                    <div className="text-xs text-gray-500">{app.student_id} · {app.department}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{app.type}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{app.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className={`text-sm font-medium ${(app.ai_score || 0) >= 80 ? "text-green-600" : (app.ai_score || 0) >= 60 ? "text-orange-600" : "text-red-600"}`}>
                        {app.ai_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{app.submit_time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(app)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(app)}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="通过"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="驳回"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginatedApplications.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>暂无待审核申请</p>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              共 {filteredApplications.length} 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetailModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">申请详情</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">申请编号</p>
                  <p className="text-sm font-medium">{selectedApp.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">申请类型</p>
                  <p className="text-sm font-medium">{selectedApp.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">学生姓名</p>
                  <p className="text-sm font-medium">{selectedApp.student_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">学号</p>
                  <p className="text-sm font-medium">{selectedApp.student_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">学院</p>
                  <p className="text-sm font-medium">{selectedApp.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">申请金额</p>
                  <p className="text-sm font-medium">¥{selectedApp.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">提交时间</p>
                  <p className="text-sm font-medium">{selectedApp.submit_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">AI评分</p>
                  <p className="text-sm font-medium">{selectedApp.ai_score}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">申请原因</p>
                <p className="text-sm">{selectedApp.reason}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">申请材料</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.materials?.map((m, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleApprove(selectedApp);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                通过
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleReject(selectedApp);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通过确认弹窗 */}
      {showApproveConfirm && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">确认通过</h3>
              <button onClick={() => setShowApproveConfirm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-600">
                确定要通过申请 <span className="font-medium text-gray-900">{selectedApp.id}</span> 吗？
              </p>
              <p className="text-sm text-gray-500 mt-2">
                学生：{selectedApp.student_name}，金额：¥{selectedApp.amount.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 驳回确认弹窗 */}
      {showRejectConfirm && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">驳回申请</h3>
              <button onClick={() => setShowRejectConfirm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                确定要驳回申请 <span className="font-medium text-gray-900">{selectedApp.id}</span> 吗？
              </p>
              <div>
                <label className="block text-sm text-gray-600 mb-1">驳回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入驳回原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
