"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  MoreHorizontal,
  Eye,
  FileText,
  RefreshCw,
  ChevronDown,
  X,
  AlertCircle,
  Bell,
  FileSpreadsheet,
  FileText as FilePdf,
} from "lucide-react";

// 申请状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  pending_first: { label: "待辅导员审核", color: "bg-blue-100 text-blue-600" },
  pending_college: { label: "待院系审批", color: "bg-purple-100 text-purple-600" },
  pending_school: { label: "待校级审批", color: "bg-orange-100 text-orange-600" },
  pending_bank: { label: "待银行处理", color: "bg-cyan-100 text-cyan-600" },
  approved: { label: "已通过", color: "bg-green-100 text-green-600" },
  rejected: { label: "已驳回", color: "bg-red-100 text-red-600" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-600" },
};

// 模拟申请数据
const mockApplications = [
  { id: "APP001", student_id: "S001", student_name: "张三", college: "计算机学院", major: "软件工程", type: "国家助学金", amount: 3000, status: "pending_school", current_node: "校级审批", stay_hours: 12, is_flagged: false, locked: false, ai_score: 0.85 },
  { id: "APP002", student_id: "S002", student_name: "李四", college: "信息学院", major: "通信工程", type: "国家奖学金", amount: 8000, status: "pending_school", current_node: "校级审批", stay_hours: 36, is_flagged: false, locked: false, ai_score: 0.92 },
  { id: "APP003", student_id: "S003", student_name: "王五", college: "机械学院", major: "机械设计", type: "临时困难补助", amount: 2000, status: "pending_school", current_node: "校级审批", stay_hours: 52, is_flagged: true, locked: true, ai_score: 0.45 },
  { id: "APP004", student_id: "S004", student_name: "赵六", college: "电气学院", major: "电气工程", type: "勤工助学", amount: 1500, status: "approved", current_node: "已通过", stay_hours: 24, is_flagged: false, locked: false, ai_score: 0.78 },
  { id: "APP005", student_id: "S005", student_name: "钱七", college: "经管学院", major: "工商管理", type: "国家助学金", amount: 3000, status: "pending_school", current_node: "校级审批", stay_hours: 8, is_flagged: false, locked: false, ai_score: 0.88 },
  { id: "APP006", student_id: "S006", student_name: "孙八", college: "文学院", major: "汉语言文学", type: "校内奖学金", amount: 5000, status: "pending_school", current_node: "校级审批", stay_hours: 72, is_flagged: false, locked: false, ai_score: 0.72 },
  { id: "APP007", student_id: "S007", student_name: "周九", college: "计算机学院", major: "计算机科学", type: "国家助学金", amount: 3000, status: "pending_school", current_node: "校级审批", stay_hours: 48, is_flagged: true, locked: false, ai_score: 0.55 },
  { id: "APP008", student_id: "S008", student_name: "吴十", college: "信息学院", major: "物联网", type: "临时困难补助", amount: 2000, status: "pending_school", current_node: "校级审批", stay_hours: 16, is_flagged: false, locked: false, ai_score: 0.81 },
];

// 审批节点信息
const approvalNodes = [
  { name: "辅导员审核", avg_time: 4.2, timeout_count: 5 },
  { name: "院系审批", avg_time: 8.5, timeout_count: 3 },
  { name: "校级审批", avg_time: 12.3, timeout_count: 2 },
  { name: "银行处理", avg_time: 24.8, timeout_count: 1 },
];

export default function SchoolApplicationPage() {
  const [applications, setApplications] = useState(mockApplications);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"stay_hours" | "ai_score" | "amount">("stay_hours");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [showBatchApproveModal, setShowBatchApproveModal] = useState(false);
  const [showBatchRejectModal, setShowBatchRejectModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<typeof mockApplications[0] | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // 筛选和排序
  const filteredApplications = applications
    .filter(app => {
      if (searchKeyword && !app.student_name.includes(searchKeyword) && !app.id.includes(searchKeyword)) return false;
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (collegeFilter !== "all" && app.college !== collegeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * multiplier;
    });

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === filteredApplications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplications.map(app => app.id));
    }
  };

  // 单选
  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // 批量导出Excel
  const handleExportExcel = () => {
    const exportData = filteredApplications.map(app => ({
      申请编号: app.id,
      学号: app.student_id,
      姓名: app.student_name,
      学院: app.college,
      专业: app.major,
      申请类型: app.type,
      金额: app.amount,
      状态: statusMap[app.status]?.label || app.status,
      当前节点: app.current_node,
      停留时长: `${app.stay_hours}小时`,
      AI评分: app.ai_score.toFixed(2),
    }));
    
    const headers = Object.keys(exportData[0]);
    const csvContent = headers.join(",") + "\n" + 
      exportData.map(row => headers.map(h => row[h as keyof typeof row]).join(",")).join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `申请列表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 批量通过
  const handleBatchApprove = () => {
    setApplications(applications.map(app => 
      selectedIds.includes(app.id) && !app.locked
        ? { ...app, status: "approved", current_node: "已通过" }
        : app
    ));
    setSelectedIds([]);
    setShowBatchApproveModal(false);
    alert(`已批量通过 ${selectedIds.length} 条申请`);
  };

  // 批量驳回
  const handleBatchReject = () => {
    setApplications(applications.map(app => 
      selectedIds.includes(app.id) && !app.locked
        ? { ...app, status: "rejected", current_node: "已驳回" }
        : app
    ));
    setSelectedIds([]);
    setShowBatchRejectModal(false);
    alert(`已批量驳回 ${selectedIds.length} 条申请`);
  };

  // 标记异常
  const handleFlag = () => {
    if (!selectedApp || !flagReason.trim()) return;
    setApplications(applications.map(app => 
      app.id === selectedApp.id
        ? { ...app, is_flagged: true }
        : app
    ));
    setShowFlagModal(false);
    setFlagReason("");
    setSelectedApp(null);
    alert(`已标记申请 ${selectedApp.id} 为可疑`);
  };

  // 锁定/解锁
  const handleToggleLock = (id: string) => {
    setApplications(applications.map(app => 
      app.id === id
        ? { ...app, locked: !app.locked }
        : app
    ));
  };

  // 催办
  const handleReminder = (id: string) => {
    alert(`已发送催办通知，申请编号：${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">申请管理</h1>
          <p className="text-sm text-gray-500 mt-1">校级管理员 - 申请审核与管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProgressModal(true)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            进度监控
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索申请编号或学生姓名"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending_school">待校级审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部学院</option>
            <option value="计算机学院">计算机学院</option>
            <option value="信息学院">信息学院</option>
            <option value="机械学院">机械学院</option>
            <option value="电气学院">电气学院</option>
            <option value="经管学院">经管学院</option>
            <option value="文学院">文学院</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="stay_hours-desc">停留时长 ↓</option>
            <option value="stay_hours-asc">停留时长 ↑</option>
            <option value="ai_score-desc">AI评分 ↓</option>
            <option value="ai_score-asc">AI评分 ↑</option>
            <option value="amount-desc">金额 ↓</option>
            <option value="amount-asc">金额 ↑</option>
          </select>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              已选择 <span className="font-medium text-[#165DFF]">{selectedIds.length}</span> 条申请
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <FileSpreadsheet className="w-4 h-4" />
                导出Excel
              </button>
              <button
                onClick={() => {}}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <FilePdf className="w-4 h-4" />
                导出PDF
              </button>
              <button
                onClick={() => {}}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <Printer className="w-4 h-4" />
                打印
              </button>
              <button
                onClick={() => setShowBatchApproveModal(true)}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                批量通过
              </button>
              <button
                onClick={() => setShowBatchRejectModal(true)}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                批量驳回
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 申请列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请编号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生信息</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前节点</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">停留时长</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI评分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApplications.map((app) => (
                <tr
                  key={app.id}
                  className={`hover:bg-gray-50 ${app.locked ? "bg-gray-100" : ""} ${app.is_flagged ? "bg-orange-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={() => handleSelect(app.id)}
                      disabled={app.locked}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{app.id}</span>
                      {app.is_flagged && (
                        <span title="已标记可疑"><AlertTriangle className="w-4 h-4 text-orange-500" /></span>
                      )}
                      {app.locked && (
                        <span title="已锁定"><Lock className="w-4 h-4 text-gray-400" /></span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{app.student_name}</div>
                      <div className="text-xs text-gray-500">{app.college} · {app.major}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{app.type}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{app.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusMap[app.status]?.color}`}>
                      {statusMap[app.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{app.current_node}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${app.stay_hours > 48 ? "text-red-600" : app.stay_hours > 24 ? "text-orange-600" : "text-gray-600"}`}>
                      {app.stay_hours}h
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${app.ai_score >= 0.8 ? "bg-green-500" : app.ai_score >= 0.6 ? "bg-blue-500" : app.ai_score >= 0.4 ? "bg-orange-500" : "bg-red-500"}`}
                          style={{ width: `${app.ai_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{(app.ai_score * 100).toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowFlagModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-orange-500 rounded"
                        title="标记异常"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleLock(app.id)}
                        className={`p-1 rounded ${app.locked ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-gray-600"}`}
                        title={app.locked ? "解锁" : "锁定"}
                      >
                        {app.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      {app.stay_hours > 48 && (
                        <button
                          onClick={() => handleReminder(app.id)}
                          className="p-1 text-orange-500 hover:text-orange-600 rounded"
                          title="催办"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 批量通过确认弹窗 */}
      {showBatchApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">确认批量通过</h2>
            <p className="text-sm text-gray-600 mb-6">
              您确定要通过选中的 <span className="font-medium text-[#165DFF]">{selectedIds.length}</span> 条申请吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBatchApproveModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量驳回弹窗 */}
      {showBatchRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">批量驳回原因</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowBatchRejectModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchReject}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标记异常弹窗 */}
      {showFlagModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">标记可疑申请</h2>
            <p className="text-sm text-gray-600 mb-4">
              申请编号：<span className="font-medium">{selectedApp.id}</span>
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="请输入标记原因（如：材料造假嫌疑、重复申请等）"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason("");
                  setSelectedApp(null);
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim()}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 进度监控弹窗 */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">申请进度监控</h2>
              <button
                onClick={() => setShowProgressModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              {/* 审批节点效率 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {approvalNodes.map((node) => (
                  <div key={node.name} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{node.name}</div>
                    <div className="text-xl font-bold text-gray-900">{node.avg_time}h</div>
                    <div className="text-xs text-gray-500">平均处理时长</div>
                    {node.timeout_count > 0 && (
                      <div className="text-xs text-red-500 mt-1">超时 {node.timeout_count} 件</div>
                    )}
                  </div>
                ))}
              </div>

              {/* 超时申请列表 */}
              <h3 className="text-sm font-medium text-gray-700 mb-3">超时申请（&gt;48小时）</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">申请编号</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">学生</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">类型</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">当前节点</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">停留时长</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApplications.filter(app => app.stay_hours > 48).map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{app.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{app.student_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{app.type}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{app.current_node}</td>
                        <td className="px-4 py-2">
                          <span className="text-sm font-medium text-red-600">{app.stay_hours}h</span>
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleReminder(app.id)}
                            className="text-sm text-[#165DFF] hover:underline"
                          >
                            催办
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
