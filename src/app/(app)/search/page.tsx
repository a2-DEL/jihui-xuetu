"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Users,
  ClipboardCheck,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface SearchResult {
  applications: Array<{
    id: string;
    application_no: string;
    type: string;
    status: string;
    amount: number;
    created_at: string;
    applicant?: { id: string; real_name: string; student_id: string };
  }>;
  students: Array<{
    id: string;
    student_id: string;
    real_name: string;
    email: string;
    phone: string;
  }>;
  approvals: Array<{
    id: string;
    status: string;
    comment: string;
    created_at: string;
    application?: { id: string; application_no: string; type: string };
    approver?: { id: string; real_name: string };
  }>;
  total: number;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  pending: { label: "待审核", color: "bg-orange-100 text-orange-600" },
  reviewing: { label: "审核中", color: "bg-blue-100 text-blue-600" },
  approved: { label: "已通过", color: "bg-green-100 text-green-600" },
  rejected: { label: "已驳回", color: "bg-red-100 text-red-600" },
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keyword = searchParams.get("keyword") || "";
  const type = searchParams.get("type") || "all";

  const [searchValue, setSearchValue] = useState(keyword);
  const [searchType, setSearchType] = useState(type);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function performSearch() {
    if (!searchValue.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?keyword=${encodeURIComponent(searchValue)}&type=${searchType}`
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (keyword) {
      performSearch();
    }
  }, [keyword, type]);

  const handleSearch = () => {
    if (searchValue.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(searchValue)}&type=${searchType}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* 搜索头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard/overview"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Link>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索申请编号、学生姓名、学号..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] focus:border-transparent text-lg"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
            >
              <option value="all">全部</option>
              <option value="application">申请</option>
              <option value="student">学生</option>
              <option value="approval">审批</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4FD9] transition-colors font-medium"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#165DFF]" />
            <span className="ml-2 text-gray-500">搜索中...</span>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* 结果统计 */}
            <div className="text-gray-600">
              找到 <span className="font-semibold text-gray-900">{results.total}</span> 条相关结果
              {keyword && (
                <span>
                  {" "}
                  关键词: &quot;<span className="font-semibold">{keyword}</span>&quot;
                </span>
              )}
            </div>

            {/* 申请结果 */}
            {results.applications.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#165DFF]" />
                  <span className="font-medium text-gray-900">申请记录</span>
                  <span className="text-gray-500">({results.applications.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/application/detail?id=${app.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900">{app.application_no}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              statusMap[app.status]?.color || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {statusMap[app.status]?.label || app.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.type} · {app.applicant?.real_name || "未知"} · ¥
                          {app.amount?.toLocaleString() || 0}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 学生结果 */}
            {results.students.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">学生信息</span>
                  <span className="text-gray-500">({results.students.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{student.real_name}</div>
                        <div className="text-sm text-gray-500">
                          学号: {student.student_id} · {student.email} · {student.phone || "无电话"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 审批结果 */}
            {results.approvals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">审批记录</span>
                  <span className="text-gray-500">({results.approvals.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.approvals.map((approval) => (
                    <Link
                      key={approval.id}
                      href={`/application/detail?id=${approval.application?.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900">
                            {approval.application?.application_no}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              approval.status === "approved"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {approval.status === "approved" ? "已通过" : "已驳回"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          审批人: {approval.approver?.real_name} · {approval.comment || "无意见"}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 无结果 */}
            {results.total === 0 && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500 mb-2">未找到相关结果</div>
                <div className="text-sm text-gray-400">请尝试其他关键词</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500">输入关键词开始搜索</div>
          </div>
        )}
      </div>
    </div>
  );
}


