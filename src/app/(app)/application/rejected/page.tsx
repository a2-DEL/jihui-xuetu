"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Eye,
  XCircle,
  X,
  Coins,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface Application {
  id: string;
  student_name: string;
  student_id: string;
  department: string;
  type: string;
  amount: number;
  status: string;
  submit_time: string;
  reject_time: string;
  ai_score?: number;
  reason?: string;
  materials?: string[];
  reviewer?: string;
  reject_reason?: string;
}

// 模拟已驳回数据
const mockRejectedApplications: Application[] = [
  { id: "4", student_name: "赵六", student_id: "2021004", department: "理学院", type: "勤工助学", amount: 1500, status: "rejected", submit_time: "2026-05-25 16:45", reject_time: "2026-05-26 10:30", ai_score: 65, reason: "申请岗位已满", materials: ["申请表"], reviewer: "张老师", reject_reason: "当前勤工助学岗位已满，建议下学期再申请" },
  { id: "14", student_name: "周十六", student_id: "2021014", department: "信息学院", type: "国家奖学金", amount: 8000, status: "rejected", submit_time: "2026-05-22 14:00", reject_time: "2026-05-24 16:20", ai_score: 58, reason: "申请国家奖学金", materials: ["成绩单"], reviewer: "李老师", reject_reason: "综合测评排名未达到前10%，不符合国家奖学金申请条件" },
  { id: "15", student_name: "吴十七", student_id: "2021015", department: "法学院", type: "国家助学金", amount: 3000, status: "rejected", submit_time: "2026-05-20 10:30", reject_time: "2026-05-22 09:15", ai_score: 55, reason: "家庭经济困难申请助学金", materials: ["申请表"], reviewer: "王老师", reject_reason: "未提供有效的家庭经济困难证明材料，请补充材料后重新申请" },
  { id: "16", student_name: "郑十八", student_id: "2021016", department: "文学院", type: "临时困难补助", amount: 2000, status: "rejected", submit_time: "2026-05-18 11:00", reject_time: "2026-05-20 14:00", ai_score: 48, reason: "突发情况申请补助", materials: ["情况说明"], reviewer: "张老师", reject_reason: "情况说明不够详细，缺少相关证明材料" },
];

const applicationTypes = ["全部类型", "国家奖学金", "国家助学金", "校内奖学金", "勤工助学", "临时困难补助", "生源地贷款", "学费减免"];
const departments = ["全部学院", "计算机学院", "经济学院", "文学院", "理学院", "信息学院", "法学院"];

export default function RejectedApplicationList() {
  const [applications, setApplications] = useState<Application[]>(mockRejectedApplications);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [departmentFilter, setDepartmentFilter] = useState("全部学院");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReapplyConfirm, setShowReapplyConfirm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

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

  const handleReapply = (app: Application) => {
    setSelectedApp(app);
    setShowReapplyConfirm(true);
  };

  const confirmReapply = () => {
    if (selectedApp) {
      setApplications(applications.filter(app => app.id !== selectedApp.id));
      showToast(`申请 ${selectedApp.id} 已重新提交审核`, "success");
      setShowReapplyConfirm(false);
      setSelectedApp(null);
    }
  };

  const handleExport = () => {
    showToast("正在导出已驳回申请列表...", "success");
  };

  // 统计数据
  const totalAmount = applications.reduce((sum, a) => sum + a.amount, 0);
  const avgScore = applications.length > 0 
    ? Math.round(applications.reduce((sum, a) => sum + (a.ai_score || 0), 0) / applications.length) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white flex items-center gap-2`}>
          {toast.type === "success" ? <RotateCcw className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">已驳回申请</h1>
          <p className="text-gray-500 mt-1">共 {applications.length} 条已驳回申请</p>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已驳回数量</p>
              <p className="text-2xl font-bold text-red-600">{applications.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">涉及金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-600" />
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">AI评分</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">驳回人</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">驳回时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedApplications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{app.id}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{app.student_name}</div>
                  <div className="text-xs text-gray-500">{app.student_id} · {app.department}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.type}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{app.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-red-600">
                      {app.ai_score}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.reviewer}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.reject_time}</td>
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
                      onClick={() => handleReapply(app)}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                      title="重新申请"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedApplications.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <XCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>暂无已驳回申请</p>
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
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">驳回原因</p>
                  <p className="text-sm text-red-700 mt-1">{selectedApp.reject_reason}</p>
                </div>
              </div>
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
                  <p className="text-sm font-medium text-red-600">¥{selectedApp.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">提交时间</p>
                  <p className="text-sm font-medium">{selectedApp.submit_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">驳回时间</p>
                  <p className="text-sm font-medium text-red-600">{selectedApp.reject_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">AI评分</p>
                  <p className="text-sm font-medium">{selectedApp.ai_score}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">驳回人</p>
                  <p className="text-sm font-medium">{selectedApp.reviewer}</p>
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
                  handleReapply(selectedApp);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重新申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重新申请确认弹窗 */}
      {showReapplyConfirm && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[400px]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">重新申请</h3>
              <button onClick={() => setShowReapplyConfirm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-600">
                确定要重新提交申请 <span className="font-medium text-gray-900">{selectedApp.id}</span> 吗？
              </p>
              <p className="text-sm text-gray-500 mt-2">
                请确保已根据驳回原因修改申请材料
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowReapplyConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmReapply}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认重新申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
