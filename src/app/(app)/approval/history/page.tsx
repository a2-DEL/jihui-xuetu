"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Calendar,
  User,
  FileText,
  Clock,
  ChevronRight,
  ChevronDown,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";

interface HistoryItem {
  id: string;
  student_name: string;
  student_id: string;
  college: string;
  type: string;
  amount: number;
  submit_time: string;
  approval_time: string;
  status: "approved" | "rejected";
  result: string;
  handler: string;
  comment: string;
  ai_score: number;
}

const mockHistory: HistoryItem[] = [
  {
    id: "H1",
    student_name: "周九",
    student_id: "2020001",
    college: "计算机学院",
    type: "国家奖学金",
    amount: 8000,
    submit_time: "2026-05-20 09:00",
    approval_time: "2026-05-22 15:30",
    status: "approved",
    result: "审批通过",
    handler: "校资助中心张主任",
    comment: "材料齐全，符合申请条件，同意发放",
    ai_score: 92,
  },
  {
    id: "H2",
    student_name: "吴十",
    student_id: "2020002",
    college: "信息学院",
    type: "国家助学金",
    amount: 3000,
    submit_time: "2026-05-18 14:00",
    approval_time: "2026-05-21 10:00",
    status: "approved",
    result: "审批通过",
    handler: "院资助中心李老师",
    comment: "家庭经济困难情况属实，同意推荐",
    ai_score: 88,
  },
  {
    id: "H3",
    student_name: "郑十一",
    student_id: "2020003",
    college: "计算机学院",
    type: "校内奖学金",
    amount: 2000,
    submit_time: "2026-05-15 11:30",
    approval_time: "2026-05-17 16:00",
    status: "rejected",
    result: "审批驳回",
    handler: "院资助中心王老师",
    comment: "成绩未达到申请要求，建议下学期再申请",
    ai_score: 65,
  },
  {
    id: "H4",
    student_name: "冯十二",
    student_id: "2020004",
    college: "信息学院",
    type: "勤工助学",
    amount: 1500,
    submit_time: "2026-05-10 08:45",
    approval_time: "2026-05-12 14:20",
    status: "approved",
    result: "审批通过",
    handler: "辅导员张老师",
    comment: "已匹配图书馆助理岗位",
    ai_score: 75,
  },
  {
    id: "H5",
    student_name: "陈十三",
    student_id: "2020005",
    college: "计算机学院",
    type: "临时困难补助",
    amount: 1000,
    submit_time: "2026-05-08 16:00",
    approval_time: "2026-05-09 10:30",
    status: "approved",
    result: "审批通过",
    handler: "院资助中心李老师",
    comment: "突发困难情况属实，快速审批通过",
    ai_score: 90,
  },
  {
    id: "H6",
    student_name: "褚十四",
    student_id: "2020006",
    college: "信息学院",
    type: "国家奖学金",
    amount: 8000,
    submit_time: "2026-05-05 13:20",
    approval_time: "2026-05-08 11:00",
    status: "rejected",
    result: "审批驳回",
    handler: "校资助中心张主任",
    comment: "综合评审排名较低，建议申请其他类型资助",
    ai_score: 70,
  },
];

const statusOptions = ["全部结果", "已通过", "已驳回"];
const typeOptions = ["全部类型", "国家奖学金", "国家助学金", "校内奖学金", "勤工助学", "临时困难补助"];
const collegeOptions = ["全部学院", "计算机学院", "信息学院"];

export default function ApprovalHistory() {
  const [history] = useState(mockHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);

  // 筛选状态
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部结果");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [collegeFilter, setCollegeFilter] = useState("全部学院");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // 筛选后的数据
  const filteredHistory = useMemo(() => {
    let result = [...history];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.student_name.toLowerCase().includes(search) ||
          item.student_id.includes(search) ||
          item.type.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "全部结果") {
      const status = statusFilter === "已通过" ? "approved" : "rejected";
      result = result.filter((item) => item.status === status);
    }

    if (typeFilter !== "全部类型") {
      result = result.filter((item) => item.type === typeFilter);
    }

    if (collegeFilter !== "全部学院") {
      result = result.filter((item) => item.college === collegeFilter);
    }

    return result;
  }, [history, searchText, statusFilter, typeFilter, collegeFilter, dateRange]);

  // 统计数据
  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const approved = filteredHistory.filter((item) => item.status === "approved").length;
    const rejected = filteredHistory.filter((item) => item.status === "rejected").length;
    const totalAmount = filteredHistory
      .filter((item) => item.status === "approved")
      .reduce((sum, item) => sum + item.amount, 0);
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, rejected, totalAmount, approvalRate };
  }, [filteredHistory]);

  const handleExport = () => {
    console.log("导出审批历史");
  };

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">审批历史</h1>
          <p className="text-gray-500 mt-1">查看所有已处理的审批记录</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
          >
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-500">总审批数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-500">已通过</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</div>
          <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
            <TrendingUp className="w-3 h-3" />
            通过率 {stats.approvalRate}%
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <div className="text-sm text-gray-500">已驳回</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-500">发放总额</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">¥{stats.totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-500">平均处理时效</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">1.8天</div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名、学号或申请类型..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {collegeOptions.map((college) => (
              <option key={college} value={college}>{college}</option>
            ))}
          </select>

          <input
            type="date"
            placeholder="开始日期"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <span className="text-gray-400">至</span>
          <input
            type="date"
            placeholder="结束日期"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.status === "approved" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {item.status === "approved" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{item.student_name}</span>
                      <span className="text-sm text-gray-500">{item.student_id}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{item.college}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {item.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.submit_time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-800">¥{item.amount.toLocaleString()}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.status === "approved"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {item.result}
                  </span>
                  <span className="text-sm text-gray-500">{item.approval_time}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailItem(item);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {expandedId === item.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedId === item.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">审批人</div>
                    <div className="font-medium text-gray-800">{item.handler}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">审批时间</div>
                    <div className="font-medium text-gray-800">{item.approval_time}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">处理耗时</div>
                    <div className="font-medium text-gray-800">2.1天</div>
                  </div>
                </div>
                <div className="mt-4 bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">审批意见</div>
                  <div className="text-gray-800">{item.comment}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无审批历史记录</p>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl w-[700px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    detailItem.status === "approved" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {detailItem.status === "approved" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{detailItem.result}</h2>
                  <p className="text-sm text-gray-500">审批编号：{detailItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">学生姓名</span>
                    <span className="text-gray-800">{detailItem.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">学号</span>
                    <span className="text-gray-800">{detailItem.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">学院</span>
                    <span className="text-gray-800">{detailItem.college}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">申请类型</span>
                    <span className="text-gray-800">{detailItem.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">申请金额</span>
                    <span className="text-blue-600 font-medium">¥{detailItem.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">AI评分</span>
                    <span className={detailItem.ai_score >= 80 ? "text-green-600" : "text-orange-600"}>
                      {detailItem.ai_score}分
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">审批时间线</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">提交: {detailItem.submit_time}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-600">审批: {detailItem.approval_time}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">审批人</div>
                <div className="text-gray-800">{detailItem.handler}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">审批意见</div>
                <div className="text-gray-800">{detailItem.comment}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
