"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  FileText,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  Filter,
  Sparkles,
  Bot,
  RefreshCw,
  History,
  Bookmark,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// 知识库文档类型
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  uploadTime: string;
  viewCount: number;
  relevanceScore: number;
  status: "approved" | "pending" | "executing";
}

// 搜索历史类型
interface SearchHistory {
  id: string;
  query: string;
  time: string;
  resultCount: number;
}

// 模拟知识库数据
const mockDocuments: KnowledgeDocument[] = [
  {
    id: "doc-001",
    title: "国家奖学金申请流程指南",
    content: "国家奖学金申请流程包括以下几个步骤：\n\n1. **申请条件审核**\n   - 学业成绩排名在专业前5%\n   - 无违纪记录\n   - 家庭经济困难认定\n\n2. **材料准备**\n   - 申请表填写\n   - 成绩单盖章\n   - 家庭经济情况证明\n   - 获奖证书复印件\n\n3. **提交申请**\n   - 在线填写申请表\n   - 上传相关证明材料\n   - 确认提交\n\n4. **审批流程**\n   - 辅导员初审\n   - 学院复审\n   - 学校终审\n   - 结果公示",
    summary: "详细介绍国家奖学金的申请条件、材料准备、提交方式和审批流程。",
    category: "奖学金",
    tags: ["国家奖学金", "申请流程", "审批"],
    uploadTime: "2024-01-15",
    viewCount: 1256,
    relevanceScore: 0.95,
    status: "approved"
  },
  {
    id: "doc-002",
    title: "国家助学金政策解读",
    content: "国家助学金是为帮助家庭经济困难学生顺利完成学业而设立的资助项目。\n\n**资助标准：**\n- 一等助学金：4000元/年\n- 二等助学金：3000元/年\n- 三等助学金：2000元/年\n\n**申请条件：**\n1. 具有正式学籍的全日制本专科学生\n2. 家庭经济困难，生活俭朴\n3. 遵守校纪校规，无违纪行为\n4. 学习态度端正，勤奋努力\n\n**发放方式：**\n按学期发放，每学期开学后一个月内发放至学生银行卡。",
    summary: "解读国家助学金政策，包括资助标准、申请条件和发放方式。",
    category: "助学金",
    tags: ["国家助学金", "政策解读", "资助标准"],
    uploadTime: "2024-01-10",
    viewCount: 892,
    relevanceScore: 0.88,
    status: "approved"
  },
  {
    id: "doc-003",
    title: "助学贷款申请指南",
    content: "国家助学贷款是由政府主导、财政贴息的信用贷款。\n\n**贷款额度：**\n- 全日制本专科学生：最高12000元/年\n- 全日制研究生：最高16000元/年\n\n**贷款期限：**\n最长不超过22年，毕业后5年内可只还利息。\n\n**申请流程：**\n1. 登录国家助学贷款官网\n2. 填写个人信息和贷款申请\n3. 上传证明材料\n4. 学校审核\n5. 银行审批\n6. 签订合同\n7. 贷款发放\n\n**还款方式：**\n- 正常还款：毕业后开始按月还本付息\n- 提前还款：可随时申请提前还款，无违约金",
    summary: "助学贷款申请条件、额度、期限、流程和还款方式的完整指南。",
    category: "贷款",
    tags: ["助学贷款", "申请指南", "还款"],
    uploadTime: "2024-01-08",
    viewCount: 756,
    relevanceScore: 0.82,
    status: "approved"
  },
  {
    id: "doc-004",
    title: "勤工助学岗位管理",
    content: "学校提供多种勤工助学岗位，帮助学生获得经济收入。\n\n**岗位类型：**\n- 图书馆助理\n- 实验室管理\n- 行政助理\n- 校园导览\n- 网络维护\n\n**申请条件：**\n1. 家庭经济困难学生优先\n2. 学有余力，成绩合格\n3. 遵守工作纪律\n\n**报酬标准：**\n- 按小时计算：15-25元/小时\n- 每月工作时间不超过40小时\n- 按月发放工资\n\n**申请流程：**\n学生事务中心 → 选择岗位 → 提交申请 → 面试 → 上岗",
    summary: "介绍勤工助学岗位类型、申请条件、报酬标准和申请流程。",
    category: "勤工助学",
    tags: ["勤工助学", "岗位", "申请"],
    uploadTime: "2024-01-05",
    viewCount: 534,
    relevanceScore: 0.75,
    status: "executing"
  },
  {
    id: "doc-005",
    title: "临时困难补助申请",
    content: "临时困难补助用于帮助遭遇突发困难的学生。\n\n**补助对象：**\n学生本人或家庭遭遇重大变故，导致经济困难。\n\n**补助标准：**\n- 一般困难：1000-3000元\n- 重大困难：3000-5000元\n- 特殊困难：5000-10000元\n\n**申请材料：**\n1. 临时困难补助申请表\n2. 困难情况说明\n3. 相关证明材料\n4. 辅导员意见\n\n**审批流程：**\n申请 → 辅导员审核 → 学院审核 → 学生处审批 → 财务处发放",
    summary: "临时困难补助的对象、标准、材料和审批流程说明。",
    category: "补助",
    tags: ["临时补助", "困难补助", "申请"],
    uploadTime: "2024-01-03",
    viewCount: 321,
    relevanceScore: 0.68,
    status: "approved"
  }
];

// 模拟搜索历史
const mockSearchHistory: SearchHistory[] = [
  { id: "h1", query: "国家奖学金申请条件", time: "2024-01-20 14:30", resultCount: 3 },
  { id: "h2", query: "助学金发放时间", time: "2024-01-19 10:15", resultCount: 2 },
  { id: "h3", query: "助学贷款还款", time: "2024-01-18 16:45", resultCount: 1 },
  { id: "h4", query: "勤工助学岗位", time: "2024-01-17 09:20", resultCount: 2 },
];

export default function KnowledgeRetrievalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(mockSearchHistory);
  const [aiAnswer, setAiAnswer] = useState<string>("");
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // 搜索知识库
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      let results = mockDocuments.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query) ||
        doc.summary.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
        doc.category.toLowerCase().includes(query)
      );

      // 按分类筛选
      if (selectedCategory !== "all") {
        results = results.filter(doc => doc.category === selectedCategory);
      }

      // 按相关性排序
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      setSearchResults(results);
      setIsSearching(false);

      // 添加到搜索历史
      const newHistory: SearchHistory = {
        id: `h${Date.now()}`,
        query: searchQuery,
        time: new Date().toLocaleString("zh-CN"),
        resultCount: results.length
      };
      setSearchHistory(prev => [newHistory, ...prev.slice(0, 9)]);
    }, 500);
  }, [searchQuery, selectedCategory]);

  // AI智能问答
  const handleAiQuery = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    setIsAiAnswering(true);
    
    // 模拟AI回答
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      let answer = "";

      if (query.includes("奖学金")) {
        answer = `根据知识库检索，关于奖学金的申请条件如下：\n\n**国家奖学金申请条件：**\n1. 学业成绩排名在专业前5%\n2. 无违纪记录\n3. 家庭经济困难认定\n\n**申请流程：**\n材料准备 → 在线申请 → 辅导员初审 → 学院复审 → 学校终审 → 结果公示\n\n📚 相关文档：国家奖学金申请流程指南`;
      } else if (query.includes("助学金")) {
        answer = `根据知识库检索，国家助学金相关信息如下：\n\n**资助标准：**\n- 一等助学金：4000元/年\n- 二等助学金：3000元/年\n- 三等助学金：2000元/年\n\n**发放方式：**\n按学期发放，每学期开学后一个月内发放至学生银行卡。\n\n📚 相关文档：国家助学金政策解读`;
      } else if (query.includes("贷款") || query.includes("还款")) {
        answer = `根据知识库检索，助学贷款相关信息如下：\n\n**贷款额度：**\n- 本专科学生：最高12000元/年\n- 研究生：最高16000元/年\n\n**还款方式：**\n- 正常还款：毕业后开始按月还本付息\n- 提前还款：可随时申请，无违约金\n\n📚 相关文档：助学贷款申请指南`;
      } else {
        answer = `我已在知识库中搜索"${searchQuery}"相关内容。\n\n共找到 ${searchResults.length} 条相关记录。\n\n建议您：\n1. 点击搜索结果查看详细内容\n2. 使用更精确的关键词重新搜索\n3. 查看相关分类下的所有文档`;
      }

      setAiAnswer(answer);
      setIsAiAnswering(false);
    }, 1500);
  }, [searchQuery, searchResults.length]);

  // 查看文档详情
  const handleViewDoc = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setShowDetailDialog(true);
  };

  // 从历史记录搜索
  const handleHistorySearch = (query: string) => {
    setSearchQuery(query);
    setTimeout(() => handleSearch(), 100);
  };

  // 获取状态标签
  const getStatusBadge = (status: KnowledgeDocument["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">已审核</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">待审核</Badge>;
      case "executing":
        return <Badge className="bg-blue-100 text-blue-700">执行中</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识检索</h1>
          <p className="text-gray-500 mt-1">智能检索知识库内容，支持语义搜索和AI问答</p>
        </div>
        <Link href="/knowledge/documents">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            文档管理
          </Button>
        </Link>
      </div>

      {/* 搜索区域 */}
      <Card className="border-2 border-blue-100">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="输入关键词搜索知识库，如：奖学金申请条件、助学金发放时间..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 h-12">
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="奖学金">奖学金</SelectItem>
                <SelectItem value="助学金">助学金</SelectItem>
                <SelectItem value="贷款">贷款</SelectItem>
                <SelectItem value="勤工助学">勤工助学</SelectItem>
                <SelectItem value="补助">补助</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isSearching} className="h-12 px-6">
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  搜索
                </>
              )}
            </Button>
            <Button onClick={handleAiQuery} disabled={isAiAnswering} variant="default" className="h-12 px-6 bg-purple-600 hover:bg-purple-700">
              {isAiAnswering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI问答
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：搜索结果 */}
        <div className="col-span-2 space-y-4">
          {/* AI回答 */}
          {aiAnswer && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Bot className="w-5 h-5" />
                  AI智能回答
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {aiAnswer}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 搜索结果列表 */}
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  找到 {searchResults.length} 条相关结果
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
                  清空结果
                </Button>
              </div>
              {searchResults.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1" onClick={() => handleViewDoc(doc)}>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {doc.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {doc.uploadTime}
                          </span>
                          <span>浏览 {doc.viewCount}</span>
                          <span className="text-green-600 font-medium">
                            相关度 {(doc.relevanceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDoc(expandedDoc === doc.id ? null : doc.id);
                        }}
                      >
                        {expandedDoc === doc.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {expandedDoc === doc.id && (
                      <div className="mt-4 pt-4 border-t text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-auto">
                        {doc.content}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !isSearching && searchQuery && (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">未找到与“{searchQuery}”相关的内容</p>
                <p className="text-sm text-gray-400 mt-2">请尝试使用其他关键词搜索</p>
              </Card>
            )
          )}

          {/* 空状态提示 */}
          {!searchQuery && !aiAnswer && (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">输入关键词开始搜索知识库</p>
              <p className="text-sm text-gray-400 mt-2">支持语义搜索和AI智能问答</p>
            </Card>
          )}
        </div>

        {/* 右侧：搜索历史和快捷入口 */}
        <div className="space-y-4">
          {/* 搜索历史 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-4 h-4" />
                搜索历史
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {searchHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleHistorySearch(item.query)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.query}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.resultCount}条
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 热门标签 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="w-4 h-4" />
                热门标签
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["奖学金", "助学金", "贷款", "勤工助学", "申请流程", "审批", "还款", "资助标准"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => {
                      setSearchQuery(tag);
                      setTimeout(() => handleSearch(), 100);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 快捷入口 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bookmark className="w-4 h-4" />
                快捷入口
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/knowledge/documents" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm">文档管理</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link href="/agent/workflow" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm">知识库工作流</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link href="/approval/pending" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm">文档审批</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 文档详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {selectedDoc?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm">
                  <Tag className="w-4 h-4" />
                  {selectedDoc?.category}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  {selectedDoc?.uploadTime}
                </span>
                <span className="text-sm">浏览 {selectedDoc?.viewCount}</span>
                {selectedDoc && getStatusBadge(selectedDoc.status)}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">摘要</h4>
              <p className="text-gray-600">{selectedDoc?.summary}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">正文内容</h4>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                {selectedDoc?.content}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">标签</h4>
              <div className="flex gap-2 flex-wrap">
                {selectedDoc?.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            <Button variant="outline">
              <Bookmark className="w-4 h-4 mr-2" />
              收藏
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

