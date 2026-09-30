"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  FileSpreadsheet,
  Globe,
  Eye,
} from "lucide-react";

// FAQ数据类型
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  startTime: string;
  endTime: string;
  views: number;
  createdAt: string;
}

// 模拟FAQ数据
const mockFAQs: FAQ[] = [
  { id: "FAQ001", question: "国家助学金的申请条件是什么？", answer: "家庭经济困难，经学校认定的在籍在校学生，品德优良，学习刻苦。", category: "申请条件", published: true, startTime: "2024-01-01", endTime: "2024-12-31", views: 1234, createdAt: "2024-01-15" },
  { id: "FAQ002", question: "如何申请临时困难补助？", answer: "学生本人提出申请，填写临时困难补助申请表，附相关证明材料，经辅导员审核后提交院系。", category: "申请流程", published: true, startTime: "2024-01-01", endTime: "2024-12-31", views: 856, createdAt: "2024-02-10" },
  { id: "FAQ003", question: "勤工助学岗位如何申请？", answer: "登录学生资助系统，在勤工助学模块查看岗位信息，选择合适的岗位提交申请。", category: "申请流程", published: true, startTime: "2024-01-01", endTime: "2024-12-31", views: 678, createdAt: "2024-02-20" },
  { id: "FAQ004", question: "国家奖学金和国家励志奖学金有什么区别？", answer: "国家奖学金奖励特别优秀的在校生，国家励志奖学金奖励品学兼优的家庭经济困难学生。", category: "政策解释", published: false, startTime: "2024-03-01", endTime: "2024-06-30", views: 234, createdAt: "2024-03-05" },
  { id: "FAQ005", question: "助学金发放时间是什么时候？", answer: "国家助学金一般在每学期末发放，具体时间请关注学校通知。", category: "发放相关", published: true, startTime: "2024-01-01", endTime: "2024-12-31", views: 1567, createdAt: "2024-03-10" },
];

// 分类列表
const categories = ["申请条件", "申请流程", "政策解释", "发放相关", "材料要求", "其他"];

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>(mockFAQs);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "申请条件",
    startTime: "",
    endTime: "",
  });

  // 筛选
  const filteredFAQs = faqs.filter(faq => {
    if (searchKeyword && !faq.question.includes(searchKeyword) && !faq.answer.includes(searchKeyword)) return false;
    if (categoryFilter !== "all" && faq.category !== categoryFilter) return false;
    return true;
  });

  // 新建FAQ
  const handleCreate = () => {
    setFormData({
      question: "",
      answer: "",
      category: "申请条件",
      startTime: new Date().toISOString().slice(0, 10),
      endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    setEditingFAQ(null);
    setShowEditModal(true);
  };

  // 编辑FAQ
  const handleEdit = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      startTime: faq.startTime,
      endTime: faq.endTime,
    });
    setEditingFAQ(faq);
    setShowEditModal(true);
  };

  // 保存FAQ
  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;
    
    if (editingFAQ) {
      setFaqs(faqs.map(faq => 
        faq.id === editingFAQ.id
          ? { ...faq, ...formData }
          : faq
      ));
    } else {
      const newFAQ: FAQ = {
        id: `FAQ${String(faqs.length + 1).padStart(3, "0")}`,
        ...formData,
        published: false,
        views: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setFaqs([...faqs, newFAQ]);
    }
    setShowEditModal(false);
  };

  // 发布/取消发布
  const handleTogglePublish = (id: string) => {
    setFaqs(faqs.map(faq =>
      faq.id === id
        ? { ...faq, published: !faq.published }
        : faq
    ));
  };

  // 删除FAQ
  const handleDelete = (id: string) => {
    if (confirm("确定要删除该FAQ吗？")) {
      setFaqs(faqs.filter(faq => faq.id !== id));
    }
  };

  // 导出Excel
  const handleExport = () => {
    const csvContent = "问题,答案,分类,是否发布,生效开始时间,生效结束时间,浏览次数\n" +
      faqs.map(faq => 
        `"${faq.question}","${faq.answer}","${faq.category}","${faq.published ? '是' : '否'}","${faq.startTime}","${faq.endTime}","${faq.views}"`
      ).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FAQ列表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理常见问题与解答</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            批量导入
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建FAQ
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索问题或答案"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* FAQ列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">问题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生效时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">浏览次数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFAQs.map((faq) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="text-sm font-medium text-gray-900 truncate">{faq.question}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">{faq.answer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">{faq.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    {faq.published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                        <Globe className="w-3 h-3" /> 已发布
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                        <Clock className="w-3 h-3" /> 未发布
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500">
                      {faq.startTime} ~ {faq.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{faq.views}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(faq.id)}
                        className={`p-1 rounded ${faq.published ? "text-green-500 hover:text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                        title={faq.published ? "取消发布" : "发布"}
                      >
                        <Globe className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingFAQ ? "编辑FAQ" : "新建FAQ"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">问题 *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="请输入问题"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">答案 *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="请输入答案"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">生效开始时间</label>
                  <input
                    type="date"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">生效结束时间</label>
                  <input
                    type="date"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.question.trim() || !formData.answer.trim()}
                className="px-4 py-2 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">批量导入FAQ</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">支持 Excel/CSV 格式</p>
                <p className="text-xs text-gray-400 mt-1">格式：问题, 答案, 分类</p>
                <button className="mt-4 px-4 py-2 text-sm bg-[#165DFF] text-white rounded-lg hover:bg-blue-600">
                  选择文件
                </button>
              </div>
              <button className="text-sm text-[#165DFF] hover:underline flex items-center gap-1">
                <Download className="w-4 h-4" />
                下载导入模板
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
