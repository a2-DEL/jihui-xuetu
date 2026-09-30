"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  Search,
  FolderOpen,
  FileText,
  Trash2,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Tag,
  X,
  FileUp,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Send,
  Bot,
  RefreshCw,
  HardDrive,
  Files,
  Layers,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  category: string;
  status: "pending" | "approved" | "executing" | "error";
  upload_time: string;
  chunks: number;
  content?: string;
  reviewer?: string;
  reviewTime?: string;
  executor?: string;
  executeTime?: string;
}

const mockDocuments: Document[] = [
  { id: "1", name: "国家奖学金评审办法.pdf", type: "pdf", size: "2.3 MB", category: "政策文件", status: "executing", upload_time: "2026-05-27 10:30", chunks: 45, content: "国家奖学金评审办法\n\n第一章 总则\n\n第一条 为规范国家奖学金评审工作，确保评审工作公平、公正、公开，制定本办法。\n\n第二条 国家奖学金由中央政府出资，用于奖励高校全日制在校学生中特别优秀的学生。", reviewer: "张主任", reviewTime: "2026-05-27 11:00", executor: "Agent-001", executeTime: "2026-05-27 11:30" },
  { id: "2", name: "助学金申请指南.docx", type: "docx", size: "1.5 MB", category: "申请指南", status: "approved", upload_time: "2026-05-26 14:20", chunks: 32, content: "助学金申请指南\n\n一、申请条件\n\n1. 具有中华人民共和国国籍；\n2. 热爱社会主义祖国，拥护中国共产党的领导；\n3. 遵守宪法和法律，遵守学校规章制度；\n4. 诚实守信，道德品质优良；\n5. 家庭经济困难，生活俭朴。", reviewer: "李老师", reviewTime: "2026-05-26 15:00" },
  { id: "3", name: "勤工助学管理办法.pdf", type: "pdf", size: "3.1 MB", category: "政策文件", status: "pending", upload_time: "2026-05-26 09:15", chunks: 0 },
  { id: "4", name: "生源地贷款政策.pdf", type: "pdf", size: "1.8 MB", category: "政策文件", status: "executing", upload_time: "2026-05-25 16:45", chunks: 28, content: "生源地信用助学贷款政策\n\n一、贷款对象\n\n已被根据国家有关规定批准设立、实施高等学历教育的全日制普通本科高校、高等职业学校和高等专科学校正式录取，取得真实、合法、有效的录取通知书的新生或在读学生。", reviewer: "王主任", reviewTime: "2026-05-25 17:00", executor: "Agent-002", executeTime: "2026-05-25 17:30" },
  { id: "5", name: "资助政策汇编.pdf", type: "pdf", size: "8.5 MB", category: "政策文件", status: "error", upload_time: "2026-05-25 11:30", chunks: 0 },
];

const categories = ["全部", "政策文件", "申请指南", "常见问题", "通知公告"];

export default function KnowledgeDocuments() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // 上传表单
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("政策文件");
  
  // 批量上传
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  
  // 审核表单
  const [reviewComment, setReviewComment] = useState("");
  
  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 计算统计数据
  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "pending").length,
    approved: documents.filter(d => d.status === "approved").length,
    executing: documents.filter(d => d.status === "executing").length,
    chunks: documents.reduce((sum, d) => sum + d.chunks, 0),
    totalSize: documents.reduce((sum, d) => sum + parseFloat(d.size), 0).toFixed(1) + " MB"
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchCategory = activeCategory === "全部" || doc.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // 打开文件选择对话框
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  // 文件选择变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setShowUploadModal(true);
    }
    // 清空 input 以便再次选择同一文件
    e.target.value = "";
  };

  // 确认上传
  const confirmUpload = useCallback(() => {
    if (!uploadFile) return;
    
    setUploading(true);
    setShowUploadModal(false);
    
    // 模拟上传过程
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: uploadFile.name,
        type: uploadFile.name.split('.').pop() || "unknown",
        size: (uploadFile.size / 1024 / 1024).toFixed(2) + " MB",
        category: uploadCategory,
        status: "pending",
        upload_time: new Date().toLocaleString("zh-CN"),
        chunks: 0,
        content: `文档 ${uploadFile.name} 的内容正在等待审核后处理...`,
      };
      setDocuments([newDoc, ...documents]);
      setUploading(false);
      setUploadFile(null);
      showToast("文档上传成功，等待审核", "success");
    }, 1500);
  }, [uploadFile, uploadCategory, documents]);

  // 删除确认
  const handleDeleteConfirm = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (!selectedDoc) return;
    setDocuments(documents.filter(doc => doc.id !== selectedDoc.id));
    setShowDeleteConfirm(false);
    setSelectedDoc(null);
    showToast("文档已删除", "success");
  };
  
  // 查看详情
  const handleView = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDetailModal(true);
  };
  
  // 下载文档
  const handleDownload = (doc: Document) => {
    // 创建模拟下载
    const content = doc.content || "文档内容";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`正在下载 ${doc.name}`, "success");
  };

  // 审核文档
  const handleReview = (doc: Document) => {
    setSelectedDoc(doc);
    setReviewComment("");
    setShowReviewModal(true);
  };

  // 确认审核通过
  const confirmReview = () => {
    if (!selectedDoc) return;
    
    setDocuments(documents.map(doc => 
      doc.id === selectedDoc.id 
        ? { ...doc, status: "approved" as const, chunks: Math.floor(Math.random() * 50) + 10, reviewer: "当前用户", reviewTime: new Date().toLocaleString("zh-CN") }
        : doc
    ));
    setShowReviewModal(false);
    setSelectedDoc(null);
    showToast("文档审核通过", "success");
  };

  // 开始执行（Agent处理）
  const handleExecute = (doc: Document) => {
    setDocuments(documents.map(d => 
      d.id === doc.id 
        ? { ...d, status: "executing" as const, executor: `Agent-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, executeTime: new Date().toLocaleString("zh-CN") }
        : d
    ));
    showToast(`Agent开始处理文档 ${doc.name}`, "success");
  };

  // 停止执行
  const handleStopExecute = (doc: Document) => {
    setDocuments(documents.map(d => 
      d.id === doc.id 
        ? { ...d, status: "approved" as const }
        : d
    ));
    showToast(`已停止处理文档 ${doc.name}`, "success");
  };

  // 批量上传相关
  const handleBatchSelectFiles = () => {
    batchFileInputRef.current?.click();
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setBatchFiles(files);
      setShowBatchUploadModal(true);
    }
    e.target.value = "";
  };

  const confirmBatchUpload = useCallback(() => {
    if (batchFiles.length === 0) return;
    
    setUploading(true);
    setShowBatchUploadModal(false);
    
    // 模拟批量上传
    setTimeout(() => {
      const newDocs: Document[] = batchFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        type: file.name.split('.').pop() || "unknown",
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        category: uploadCategory,
        status: "pending" as const,
        upload_time: new Date().toLocaleString("zh-CN"),
        chunks: 0,
        content: `文档 ${file.name} 的内容正在等待审核后处理...`,
      }));
      setDocuments([...newDocs, ...documents]);
      setUploading(false);
      setBatchFiles([]);
      showToast(`成功上传 ${batchFiles.length} 个文档，等待审核`, "success");
    }, 2000);
  }, [batchFiles, uploadCategory, documents]);

  const removeBatchFile = (index: number) => {
    setBatchFiles(batchFiles.filter((_, i) => i !== index));
  };

  const statusConfig = {
    pending: { label: "待审核", color: "bg-yellow-100 text-yellow-600", icon: Clock, desc: "等待管理员审核" },
    approved: { label: "已审核", color: "bg-green-100 text-green-600", icon: CheckCircle, desc: "审核通过，可开始执行" },
    executing: { label: "执行中", color: "bg-blue-100 text-blue-600", icon: PlayCircle, desc: "Agent正在处理" },
    error: { label: "处理失败", color: "bg-red-100 text-red-600", icon: AlertCircle, desc: "处理出错" },
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

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* 隐藏的批量文件输入 */}
      <input
        ref={batchFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        multiple
        onChange={handleBatchFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">文档管理</h1>
          <p className="text-gray-500 mt-1">上传文档并构建AI问答知识库，文档需审核后才能执行</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchSelectFiles}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-[#165DFF] text-[#165DFF] rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
          >
            <Files className="w-4 h-4" />
            {uploading ? "上传中..." : "批量上传"}
          </button>
          <button
            onClick={handleSelectFile}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "上传中..." : "上传文档"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* 统计卡片 */}
        {[
          { title: "文档总数", value: stats.total, icon: FolderOpen, color: "from-blue-500 to-blue-600" },
          { title: "待审核", value: stats.pending, icon: Clock, color: "from-yellow-500 to-yellow-600" },
          { title: "已审核", value: stats.approved, icon: CheckCircle, color: "from-green-500 to-green-600" },
          { title: "执行中", value: stats.executing, icon: PlayCircle, color: "from-purple-500 to-purple-600" },
          { title: "知识片段", value: stats.chunks, icon: BookOpen, color: "from-violet-500 to-violet-600" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-white/30" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  activeCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const status = statusConfig[doc.status];
            const StatusIcon = status.icon;
            return (
              <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">{doc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`} title={status.desc}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{doc.size}</span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {doc.category}
                    </span>
                    {doc.chunks > 0 && <span>{doc.chunks} 个知识片段</span>}
                    <span>{doc.upload_time}</span>
                    {doc.reviewer && <span className="text-green-600">审核人: {doc.reviewer}</span>}
                    {doc.executor && <span className="text-purple-600">执行者: {doc.executor}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleView(doc)}
                    className="p-2 hover:bg-gray-100 rounded-lg" 
                    title="查看"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    onClick={() => handleDownload(doc)}
                    className="p-2 hover:bg-gray-100 rounded-lg" 
                    title="下载"
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                  </button>
                  {doc.status === "pending" && (
                    <button 
                      onClick={() => handleReview(doc)}
                      className="p-2 hover:bg-green-50 rounded-lg" 
                      title="审核"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </button>
                  )}
                  {doc.status === "approved" && (
                    <button 
                      onClick={() => handleExecute(doc)}
                      className="p-2 hover:bg-purple-50 rounded-lg" 
                      title="开始执行"
                    >
                      <PlayCircle className="w-4 h-4 text-purple-500" />
                    </button>
                  )}
                  {doc.status === "executing" && (
                    <button 
                      onClick={() => handleStopExecute(doc)}
                      className="p-2 hover:bg-orange-50 rounded-lg" 
                      title="停止执行"
                    >
                      <PauseCircle className="w-4 h-4 text-orange-500" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteConfirm(doc)}
                    className="p-2 hover:bg-red-50 rounded-lg" 
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无文档</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 上传弹窗 */}
      {showUploadModal && uploadFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">上传文档</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileUp className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{uploadFile.name}</p>
                    <p className="text-sm text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">文档分类</label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="政策文件">政策文件</option>
                  <option value="申请指南">申请指南</option>
                  <option value="常见问题">常见问题</option>
                  <option value="通知公告">通知公告</option>
                </select>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                文档上传后需要审核才能开始执行
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmUpload}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 审核弹窗 */}
      {showReviewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">审核文档</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">文档名称</p>
                <p className="font-medium">{selectedDoc.name}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">审核意见（可选）</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="输入审核意见..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmReview}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                审核通过
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 文档详情弹窗 */}
      {showDetailModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">文档详情</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">文档名称</label>
                  <p className="font-medium">{selectedDoc.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">文件大小</label>
                  <p className="font-medium">{selectedDoc.size}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">分类</label>
                  <p className="font-medium">{selectedDoc.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">状态</label>
                  <p className="font-medium">{statusConfig[selectedDoc.status].label}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">知识片段</label>
                  <p className="font-medium">{selectedDoc.chunks}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">上传时间</label>
                  <p className="font-medium">{selectedDoc.upload_time}</p>
                </div>
                {selectedDoc.reviewer && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">审核人</label>
                      <p className="font-medium">{selectedDoc.reviewer}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">审核时间</label>
                      <p className="font-medium">{selectedDoc.reviewTime}</p>
                    </div>
                  </>
                )}
                {selectedDoc.executor && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">执行Agent</label>
                      <p className="font-medium text-purple-600">{selectedDoc.executor}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">执行时间</label>
                      <p className="font-medium">{selectedDoc.executeTime}</p>
                    </div>
                  </>
                )}
              </div>
              {selectedDoc.content && (
                <div>
                  <label className="text-sm text-gray-500">文档内容预览</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-auto">
                    {selectedDoc.content}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
              {selectedDoc.status === "pending" && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleReview(selectedDoc);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  审核通过
                </button>
              )}
              {selectedDoc.status === "approved" && (
                <button
                  onClick={() => {
                    handleExecute(selectedDoc);
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  <PlayCircle className="w-4 h-4 inline mr-1" />
                  开始执行
                </button>
              )}
              <button
                onClick={() => {
                  handleDownload(selectedDoc);
                }}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600"
              >
                下载文档
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 删除确认弹窗 */}
      {showDeleteConfirm && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可恢复</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              确定要删除文档 <span className="font-medium">{selectedDoc.name}</span> 吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 批量上传弹窗 */}
      {showBatchUploadModal && batchFiles.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#165DFF]" />
                批量上传文档
              </h3>
              <button 
                onClick={() => { setShowBatchUploadModal(false); setBatchFiles([]); }} 
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-auto">
              <div>
                <label className="block text-sm text-gray-500 mb-2">统一分类</label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="政策文件">政策文件</option>
                  <option value="申请指南">申请指南</option>
                  <option value="常见问题">常见问题</option>
                  <option value="通知公告">通知公告</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  待上传文件 ({batchFiles.length} 个)
                </label>
                <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-auto">
                  {batchFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBatchFile(index)}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                文档上传后需要审核才能开始执行，系统将自动解析PDF/Word文档并向量化
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button
                onClick={() => { setShowBatchUploadModal(false); setBatchFiles([]); }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmBatchUpload}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                上传 {batchFiles.length} 个文档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
