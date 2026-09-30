"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Gift,
  Star,
  Edit,
  Trash2,
  Plus,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Benefit {
  id: string;
  name: string;
  description: string;
  requiredLevel: string;
  requiredScore: number;
  type: "financial" | "service" | "priority";
  active: boolean;
  usedCount: number;
}

const initialBenefits: Benefit[] = [
  {
    id: "1",
    name: "审批绿色通道",
    description: "申请材料预审通过后，直接进入审批流程，无需排队等待",
    requiredLevel: "优秀",
    requiredScore: 90,
    type: "priority",
    active: true,
    usedCount: 156,
  },
  {
    id: "2",
    name: "额度提升20%",
    description: "各类资助申请额度可提升20%",
    requiredLevel: "优秀",
    requiredScore: 90,
    type: "financial",
    active: true,
    usedCount: 89,
  },
  {
    id: "3",
    name: "勤工助学优先选岗",
    description: "新岗位发布后24小时内优先选择",
    requiredLevel: "良好",
    requiredScore: 75,
    type: "priority",
    active: true,
    usedCount: 234,
  },
  {
    id: "4",
    name: "临时困补快速审批",
    description: "临时困难补助申请24小时内完成审批",
    requiredLevel: "良好",
    requiredScore: 75,
    type: "service",
    active: true,
    usedCount: 67,
  },
  {
    id: "5",
    name: "免息期延长",
    description: "助学贷款免息期可延长3个月",
    requiredLevel: "优秀",
    requiredScore: 90,
    type: "financial",
    active: true,
    usedCount: 45,
  },
];

const levelColors: Record<string, string> = {
  优秀: "bg-green-500",
  良好: "bg-blue-500",
  一般: "bg-yellow-500",
  较差: "bg-red-500",
};

const typeIcons: Record<string, React.ReactNode> = {
  financial: <DollarSign className="w-4 h-4" />,
  service: <Clock className="w-4 h-4" />,
  priority: <Star className="w-4 h-4" />,
};

const typeNames: Record<string, string> = {
  financial: "资金优惠",
  service: "服务特权",
  priority: "优先权益",
};

export default function CreditBenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>(initialBenefits);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const [newBenefit, setNewBenefit] = useState({
    name: "",
    description: "",
    requiredLevel: "良好",
    requiredScore: 75,
    type: "service" as "financial" | "service" | "priority",
  });

  const filteredBenefits =
    filterType === "all"
      ? benefits
      : benefits.filter((b) => b.type === filterType);

  const handleToggleActive = (id: string) => {
    setBenefits(
      benefits.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const handleDelete = () => {
    if (selectedBenefit) {
      setBenefits(benefits.filter((b) => b.id !== selectedBenefit.id));
      setShowDeleteDialog(false);
      setSelectedBenefit(null);
    }
  };

  const handleAdd = () => {
    const benefit: Benefit = {
      id: Date.now().toString(),
      ...newBenefit,
      active: true,
      usedCount: 0,
    };
    setBenefits([...benefits, benefit]);
    setShowAddDialog(false);
    setNewBenefit({
      name: "",
      description: "",
      requiredLevel: "良好",
      requiredScore: 75,
      type: "service",
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用权益管理</h1>
          <p className="text-gray-500 mt-1">
            配置不同信用等级可享受的权益和优惠
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#165DFF] hover:bg-[#165DFF]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增权益
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {benefits.filter((b) => b.active).length}
                </div>
                <div className="text-sm text-gray-500">已启用权益</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {benefits.reduce((sum, b) => sum + b.usedCount, 0)}
                </div>
                <div className="text-sm text-gray-500">总使用次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {benefits.filter((b) => b.type === "financial").length}
                </div>
                <div className="text-sm text-gray-500">资金优惠</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {benefits.filter((b) => b.type === "priority").length}
                </div>
                <div className="text-sm text-gray-500">优先权益</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={filterType === "all" ? "bg-[#165DFF]" : ""}
        >
          全部
        </Button>
        <Button
          variant={filterType === "financial" ? "default" : "outline"}
          onClick={() => setFilterType("financial")}
          className={filterType === "financial" ? "bg-[#165DFF]" : ""}
        >
          资金优惠
        </Button>
        <Button
          variant={filterType === "service" ? "default" : "outline"}
          onClick={() => setFilterType("service")}
          className={filterType === "service" ? "bg-[#165DFF]" : ""}
        >
          服务特权
        </Button>
        <Button
          variant={filterType === "priority" ? "default" : "outline"}
          onClick={() => setFilterType("priority")}
          className={filterType === "priority" ? "bg-[#165DFF]" : ""}
        >
          优先权益
        </Button>
      </div>

      {/* 权益列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBenefits.map((benefit) => (
          <Card
            key={benefit.id}
            className={`${!benefit.active ? "opacity-60" : ""}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      benefit.type === "financial"
                        ? "bg-purple-100"
                        : benefit.type === "priority"
                        ? "bg-orange-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {typeIcons[benefit.type]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{benefit.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {typeNames[benefit.type]}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(benefit.id)}
                  >
                    {benefit.active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedBenefit(benefit);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{benefit.description}</p>
              <div className="flex items-center gap-2">
                <Badge className={levelColors[benefit.requiredLevel]}>
                  {benefit.requiredLevel}
                </Badge>
                <span className="text-sm text-gray-500">
                  需要 {benefit.requiredScore} 分以上
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">使用次数</span>
                <span className="font-medium">{benefit.usedCount} 次</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 新增权益弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增信用权益</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">权益名称</label>
              <Input
                value={newBenefit.name}
                onChange={(e) =>
                  setNewBenefit({ ...newBenefit, name: e.target.value })
                }
                placeholder="如：审批绿色通道"
              />
            </div>
            <div>
              <label className="text-sm font-medium">权益描述</label>
              <Input
                value={newBenefit.description}
                onChange={(e) =>
                  setNewBenefit({ ...newBenefit, description: e.target.value })
                }
                placeholder="描述该权益的具体内容"
              />
            </div>
            <div>
              <label className="text-sm font-medium">权益类型</label>
              <select
                className="w-full border rounded-md p-2"
                value={newBenefit.type}
                onChange={(e) =>
                  setNewBenefit({
                    ...newBenefit,
                    type: e.target.value as "financial" | "service" | "priority",
                  })
                }
              >
                <option value="financial">资金优惠</option>
                <option value="service">服务特权</option>
                <option value="priority">优先权益</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">所需信用等级</label>
              <select
                className="w-full border rounded-md p-2"
                value={newBenefit.requiredLevel}
                onChange={(e) => {
                  const level = e.target.value;
                  const scores: Record<string, number> = {
                    优秀: 90,
                    良好: 75,
                    一般: 60,
                  };
                  setNewBenefit({
                    ...newBenefit,
                    requiredLevel: level,
                    requiredScore: scores[level] || 60,
                  });
                }}
              >
                <option value="优秀">优秀（90分以上）</option>
                <option value="良好">良好（75分以上）</option>
                <option value="一般">一般（60分以上）</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newBenefit.name || !newBenefit.description}
              className="bg-[#165DFF] hover:bg-[#165DFF]/90"
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>
            确定要删除权益“{selectedBenefit?.name}”吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

