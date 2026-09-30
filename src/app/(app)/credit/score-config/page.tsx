"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Settings,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  RotateCcw,
  Info,
  BarChart3,
} from "lucide-react";

interface WeightConfig {
  id: string;
  name: string;
  weight: number;
  description: string;
  editable: boolean;
}

const defaultWeights: WeightConfig[] = [
  {
    id: "funding_compliance",
    name: "资助合规",
    weight: 40,
    description: "申请材料完整性、审批通过率、违约记录等",
    editable: true,
  },
  {
    id: "work_study",
    name: "勤工表现",
    weight: 15,
    description: "勤工助学岗位表现评价、出勤率、任务完成度",
    editable: true,
  },
  {
    id: "loan_repayment",
    name: "还款记录",
    weight: 35,
    description: "助学贷款按时还款记录、逾期次数",
    editable: true,
  },
  {
    id: "financial_course",
    name: "金融课程",
    weight: 10,
    description: "金融素养课程学习情况、考试成绩",
    editable: true,
  },
];

interface ScoreLevel {
  level: string;
  min: number;
  max: number;
  color: string;
  benefits: string[];
}

const scoreLevels: ScoreLevel[] = [
  {
    level: "优秀",
    min: 90,
    max: 100,
    color: "bg-green-500",
    benefits: ["优先审批", "额度提升20%", "绿色通道"],
  },
  {
    level: "良好",
    min: 75,
    max: 89,
    color: "bg-blue-500",
    benefits: ["正常审批", "标准额度"],
  },
  {
    level: "一般",
    min: 60,
    max: 74,
    color: "bg-yellow-500",
    benefits: ["需补充材料", "额度限制"],
  },
  {
    level: "较差",
    min: 0,
    max: 59,
    color: "bg-red-500",
    benefits: ["人工审核", "额度降低", "限制申请"],
  },
];

export default function CreditScoreConfigPage() {
  const [weights, setWeights] = useState<WeightConfig[]>(defaultWeights);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempWeight, setTempWeight] = useState<number>(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  const handleEdit = (id: string) => {
    const weight = weights.find((w) => w.id === id);
    if (weight) {
      setEditingId(id);
      setTempWeight(weight.weight);
    }
  };

  const handleSave = () => {
    if (editingId) {
      setWeights(
        weights.map((w) =>
          w.id === editingId ? { ...w, weight: tempWeight } : w
        )
      );
      setEditingId(null);
      setHasChanges(true);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleReset = () => {
    setWeights(defaultWeights);
    setHasChanges(false);
    setShowResetDialog(false);
  };

  const handleApply = () => {
    // 模拟保存到后端
    alert("配置已保存，将于次日零点生效！");
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用评分规则配置</h1>
          <p className="text-gray-500 mt-1">
            配置学生信用评分计算权重，修改后次日零点生效
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置默认
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasChanges || totalWeight !== 100}
            className="bg-[#165DFF] hover:bg-[#165DFF]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            应用配置
          </Button>
        </div>
      </div>

      {/* 权重配置卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 权重设置 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#165DFF]" />
              评分维度权重配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weights.map((weight) => (
              <div
                key={weight.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{weight.name}</div>
                  <div className="text-sm text-gray-500">{weight.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === weight.id ? (
                    <>
                      <Input
                        type="number"
                        value={tempWeight}
                        onChange={(e) => setTempWeight(Number(e.target.value))}
                        className="w-20"
                        min={0}
                        max={100}
                      />
                      <span className="text-gray-500">%</span>
                      <Button size="sm" onClick={handleSave}>
                        保存
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge
                        variant="secondary"
                        className="text-lg px-3 py-1 bg-[#165DFF]/10 text-[#165DFF]"
                      >
                        {weight.weight}%
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(weight.id)}
                        disabled={!weight.editable}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* 总权重校验 */}
            <div
              className={`p-4 rounded-lg ${
                totalWeight === 100
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">权重总和</span>
                <span
                  className={`text-xl font-bold ${
                    totalWeight === 100 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalWeight}%
                </span>
              </div>
              {totalWeight !== 100 && (
                <p className="text-red-600 text-sm mt-1">
                  权重总和必须等于100%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 权重预览 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#165DFF]" />
              权重分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weights.map((weight) => (
                <div key={weight.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{weight.name}</span>
                    <span>{weight.weight}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#165DFF] rounded-full transition-all"
                      style={{ width: `${weight.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="link"
              className="w-full mt-4"
              onClick={() => setShowInfoDialog(true)}
            >
              <Info className="w-4 h-4 mr-2" />
              查看计算公式
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 信用等级配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#165DFF]" />
            信用等级与权益配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scoreLevels.map((level) => (
              <div
                key={level.level}
                className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-4 h-4 rounded ${level.color}`} />
                  <span className="font-bold text-lg">{level.level}</span>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {level.min} - {level.max} 分
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    可用权益：
                  </div>
                  {level.benefits.map((benefit, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="mr-1 mb-1 text-xs"
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 重置确认弹窗 */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重置</DialogTitle>
          </DialogHeader>
          <p>确定要重置为默认配置吗？当前修改将丢失。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              取消
            </Button>
            <Button onClick={handleReset} className="bg-red-500 hover:bg-red-600">
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 计算公式弹窗 */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>信用评分计算公式</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
              <div className="text-center">
                信用分 = Σ(维度得分 × 权重)
              </div>
              <div className="mt-4 text-gray-600">
                = 资助合规分 × {weights[0].weight}% + 勤工表现分 ×{" "}
                {weights[1].weight}% + 还款记录分 × {weights[2].weight}% +
                金融课程分 × {weights[3].weight}%
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-2">各维度得分来源：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>资助合规：申请通过率、材料完整度、违约记录</li>
                <li>勤工表现：岗位评价、出勤率、任务完成度</li>
                <li>还款记录：按时还款次数/总期数</li>
                <li>金融课程：课程完成度、考试成绩</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
