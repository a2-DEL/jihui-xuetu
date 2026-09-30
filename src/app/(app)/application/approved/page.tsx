"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Eye,
  CheckCircle,
  X,
  Coins,
  Calendar,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
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
  approve_time: string;
  ai_score?: number;
  reason?: string;
  materials?: string[];
  approver?: string;
  remark?: string;
}

// 模拟已通过数据
const mockApprovedApplications: Application[] = [
  { id: "2", student_name: "李四", student_id: "2021002", department: "经济学院", type: "国家助学金", amount: 3000, status: "approved", submit_time: "2026-05-26 14:20", approve_time: "2026-05-27 09:30", ai_score: 92, reason: "建档立卡贫困户", materials: ["贫困证明", "户口本"], approver: "张老师", remark: "材料齐全，符合条件" },
  { id: "6", student_name: "孙八", student_id: "2021006", department: "经济学院", type: "生源地贷款", amount: 6000, status: "approved", submit_time: "2026-05-24 15:00", approve_time: "2026-05-25 10:15", ai_score: 90, reason: "助学贷款续贷", materials: ["贷款合同"], approver: "李老师", remark: "续贷申请，已核实" },
  { id: "11", student_name: "刘十三", student_id: "2021011", department: "计算机学院", type: "国家奖学金", amount: 8000, status: "approved", submit_time: "2026-05-20 11:00", approve_time: "2026-05-22 14:30", ai_score: 95, reason: "综合测评第一", materials: ["成绩单", "获奖证书"], approver: "王老师", remark: "成绩优异，优先通过" },
  { id: "12", student_name: "黄十四", student_id: "2021012", department: "文学院", type: "校内奖学金", amount: 3000, status: "approved", submit_time: "2026-05-18 16:30", approve_time: "2026-05-20 11:00", ai_score: 88, reason: "学习成绩进步显著", materials: ["成绩单", "进步证明"], approver: "张老师", remark: "进步明显，予以奖励" },
  { id: "13", student_name: "林十五", student_id: "2021013", department: "理学院", type: "勤工助学", amount: 2000, status: "approved", submit_time: "2026-05-15 09:00", approve_time: "2026-05-17 15:20", ai_score: 82, reason: "家庭经济困难，需要资助", materials: ["申请表", "贫困证明"], approver: "李老师", remark: "已安排图书馆岗位" },
];

const applicationTypes = ["全部类型", "国家奖学金", "国家助学金", "校内奖学金", "勤工助学", "临时困难补助", "生源地贷款", "学费减免"];
const departments = ["全部学院", "计算机学院", "经济学院", "文学院", "理学院", "信息学院", "法学院"];

export default function ApprovedApplicationList() {
  const [applications] = useState<Application[]>(mockApprovedApplications);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [departmentFilter, setDepartmentFilter] = useState("全部学院");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  const handleExport = () => {
    showToast("正在导出已通过申请列表...", "success");
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
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">已通过申请</h1>
          <p className="text-gray-500 mt-1">共 {applications.length} 条已通过申请</p>
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
              <p className="text-sm text-gray-500">已通过数量</p>
              <p className="text-2xl font-bold text-green-600">{applications.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">发放总额</p>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">审批人</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">通过时间</th>
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
                    <span className={`text-sm font-medium ${(app.ai_score || 0) >= 80 ? "text-green-600" : "text-orange-600"}`}>
                      {app.ai_score}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.approver}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.approve_time}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleViewDetail(app)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="查看详情"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedApplications.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>暂无已通过申请</p>
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
                  <p className="text-sm font-medium text-green-600">¥{selectedApp.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">提交时间</p>
                  <p className="text-sm font-medium">{selectedApp.submit_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">通过时间</p>
                  <p className="text-sm font-medium text-green-600">{selectedApp.approve_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">AI评分</p>
                  <p className="text-sm font-medium">{selectedApp.ai_score}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">审批人</p>
                  <p className="text-sm font-medium">{selectedApp.approver}</p>
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
              <div className="space-y-1">
                <p className="text-xs text-gray-500">审批备注</p>
                <p className="text-sm">{selectedApp.remark}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
