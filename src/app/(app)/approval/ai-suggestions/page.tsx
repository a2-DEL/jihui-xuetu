"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  BarChart3,
  FileText,
  User,
  ThumbsUp,
  ThumbsDown,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// 模拟AI建议数据
const mockSuggestions = [
  {
    id: "1",
    applicationNo: "APP-2026-001",
    studentName: "张三",
    studentNo: "2021001",
    type: "国家奖学金",
    amount: 8000,
    college: "计算机学院",
    aiScore: 92,
    suggestion: "通过",
    reason: "GPA排名前5%（3.92/4.0），家庭经济困难认定等级为A，材料完整度98%，无违规记录，综合素质评价优秀",
    confidence: 95,
    riskFactors: [],
    highlights: ["GPA优秀", "材料完整", "困难认定A级"],
    submitTime: "2026-05-28 09:30",
  },
  {
    id: "2",
    applicationNo: "APP-2026-002",
    studentName: "李四",
    studentNo: "2021002",
    type: "国家助学金",
    amount: 4000,
    college: "信息学院",
    aiScore: 85,
    suggestion: "通过",
    reason: "家庭经济困难认定等级为B，符合申请条件，材料齐全，参与勤工助学表现良好",
    confidence: 88,
    riskFactors: [],
    highlights: ["困难认定B级", "勤工助学"],
    submitTime: "2026-05-27 14:20",
  },
  {
    id: "3",
    applicationNo: "APP-2026-003",
    studentName: "王五",
    studentNo: "2021003",
    type: "临时困难补助",
    amount: 3000,
    college: "机械学院",
    aiScore: 78,
    suggestion: "通过",
    reason: "突发家庭变故（父亲重病），已提供医院证明，情况属实，建议给予补助",
    confidence: 82,
    riskFactors: ["需核实医疗证明真实性"],
    highlights: ["情况紧急", "证明材料齐全"],
    submitTime: "2026-05-27 10:15",
  },
  {
    id: "4",
    applicationNo: "APP-2026-004",
    studentName: "赵六",
    studentNo: "2021004",
    type: "国家奖学金",
    amount: 8000,
    college: "经管学院",
    aiScore: 65,
    suggestion: "复核",
    reason: "GPA排名不在前10%（前15%），但家庭经济困难情况特殊（单亲家庭，母亲残疾），建议人工审核决定",
    confidence: 72,
    riskFactors: ["GPA未达标", "特殊情况需人工判断"],
    highlights: ["家庭情况特殊"],
    submitTime: "2026-05-26 16:00",
  },
  {
    id: "5",
    applicationNo: "APP-2026-005",
    studentName: "钱七",
    studentNo: "2021005",
    type: "国家助学金",
    amount: 4000,
    college: "外语学院",
    aiScore: 58,
    suggestion: "驳回",
    reason: "家庭经济困难认定等级为C，不满足助学金申请条件（需B级以上），建议申请其他类型资助",
    confidence: 85,
    riskFactors: ["困难等级不达标", "不符合申请条件"],
    highlights: [],
    submitTime: "2026-05-25 11:30",
  },
];

export default function AISuggestionsPage() {
  const router = useRouter();
  const [suggestions] = useState(mockSuggestions);
  const [filter, setFilter] = useState<string>("all");
  const [detailItem, setDetailItem] = useState<typeof mockSuggestions[0] | null>(null);

  const filteredSuggestions = suggestions.filter((item) => {
    if (filter === "all") return true;
    return item.suggestion === filter;
  });

  const stats = {
    total: suggestions.length,
    pass: suggestions.filter((s) => s.suggestion === "通过").length,
    review: suggestions.filter((s) => s.suggestion === "复核").length,
    reject: suggestions.filter((s) => s.suggestion === "驳回").length,
    avgConfidence: Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length),
  };

  const getSuggestionColor = (suggestion: string) => {
    switch (suggestion) {
      case "通过":
        return "bg-green-100 text-green-700 border-green-200";
      case "复核":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "驳回":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSuggestionIcon = (suggestion: string) => {
    switch (suggestion) {
      case "通过":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "复核":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "驳回":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            AI审批建议
          </h1>
          <p className="text-gray-500 mt-1">基于AI模型的智能审批建议，辅助快速决策</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/approval/pending")}>
            查看待审批
          </Button>
          <Button onClick={() => router.push("/approval/pending")}>
            一键采纳建议
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">总建议数</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.pass}</p>
              <p className="text-sm text-green-600">建议通过</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.review}</p>
              <p className="text-sm text-yellow-600">需复核</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.reject}</p>
              <p className="text-sm text-red-600">建议驳回</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.avgConfidence}%</p>
              <p className="text-sm text-purple-600">平均置信度</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={filter === "通过" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("通过")}
            className={filter === "通过" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            通过
          </Button>
          <Button
            variant={filter === "复核" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("复核")}
            className={filter === "复核" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            复核
          </Button>
          <Button
            variant={filter === "驳回" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("驳回")}
            className={filter === "驳回" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <XCircle className="w-3 h-3 mr-1" />
            驳回
          </Button>
        </div>
      </div>

      {/* 建议列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSuggestions.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setDetailItem(item)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{item.studentName}</span>
                    <span className="text-sm text-gray-500">{item.studentNo}</span>
                  </div>
                  <div className="text-sm text-gray-500">{item.college} · {item.type}</div>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getSuggestionColor(item.suggestion)}`}>
                  {getSuggestionIcon(item.suggestion)}
                  {item.suggestion}
                </div>
              </div>

              {/* 置信度进度条 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">AI置信度</span>
                  <span className={`font-medium ${
                    item.confidence >= 85 ? "text-green-600" :
                    item.confidence >= 70 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>{item.confidence}%</span>
                </div>
                <Progress
                  value={item.confidence}
                  className="h-2"
                />
              </div>

              {/* AI评分 */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-500">AI评分:</span>
                  <span className={`font-bold ${
                    item.aiScore >= 80 ? "text-green-600" :
                    item.aiScore >= 60 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>{item.aiScore}</span>
                </div>
                <div className="text-sm text-gray-500">
                  ¥{item.amount.toLocaleString()}
                </div>
              </div>

              {/* 简要原因 */}
              <div className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded">
                {item.reason}
              </div>

              {/* 风险提示 */}
              {item.riskFactors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.riskFactors.map((risk, idx) => (
                    <Badge key={idx} variant="outline" className="text-orange-600 border-orange-200">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {risk}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 快捷操作 */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/approval/pending");
                  }}
                >
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  采纳
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/approval/pending");
                  }}
                >
                  <ThumbsDown className="w-3 h-3 mr-1" />
                  忽略
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 详情弹窗 */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="max-w-2xl">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI建议详情
                </DialogTitle>
                <DialogDescription>
                  {detailItem.applicationNo} · {detailItem.studentName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">学生</p>
                    <p className="font-medium">{detailItem.studentName} ({detailItem.studentNo})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">申请类型</p>
                    <p className="font-medium">{detailItem.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">学院</p>
                    <p className="font-medium">{detailItem.college}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">申请金额</p>
                    <p className="font-medium">¥{detailItem.amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* AI建议 */}
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">AI建议</span>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getSuggestionColor(detailItem.suggestion)}`}>
                        {getSuggestionIcon(detailItem.suggestion)}
                        {detailItem.suggestion}
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${
                      detailItem.aiScore >= 80 ? "text-green-600" :
                      detailItem.aiScore >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      AI评分: {detailItem.aiScore}
                    </span>
                  </div>
                  <p className="text-gray-700">{detailItem.reason}</p>
                </div>

                {/* 置信度 */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">置信度</span>
                    <span className="font-medium">{detailItem.confidence}%</span>
                  </div>
                  <Progress value={detailItem.confidence} className="h-3" />
                </div>

                {/* 亮点标签 */}
                {detailItem.highlights.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">申请亮点</p>
                    <div className="flex flex-wrap gap-2">
                      {detailItem.highlights.map((h, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-700">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 风险因素 */}
                {detailItem.riskFactors.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">风险因素</p>
                    <div className="flex flex-wrap gap-2">
                      {detailItem.riskFactors.map((r, idx) => (
                        <Badge key={idx} variant="outline" className="text-orange-600 border-orange-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailItem(null)}>
                  关闭
                </Button>
                <Button onClick={() => router.push("/approval/pending")}>
                  去处理
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
