"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Application {
  id: string;
  studentName: string;
  studentId: string;
  major: string;
  type: string;
  amount: number;
  status: string;
  aiScore: number;
  submitTime: string;
  currentApprover: string;
  flagged: boolean;
}

export default function DeptApplicationListPage() {
  const [applications] = useState<Application[]>([
    {
      id: "APP2026001",
      studentName: "张**",
      studentId: "2021****001",
      major: "计算机科学与技术",
      type: "国家助学金",
      amount: 4400,
      status: "待院系复核",
      aiScore: 92,
      submitTime: "2026-06-08 10:30",
      currentApprover: "院系管理员王老师",
      flagged: false,
    },
    {
      id: "APP2026002",
      studentName: "李**",
      studentId: "2021****002",
      major: "软件工程",
      type: "临时困难补助",
      amount: 2000,
      status: "待辅导员初审",
      aiScore: 88,
      submitTime: "2026-06-08 09:15",
      currentApprover: "辅导员张老师",
      flagged: true,
    },
    {
      id: "APP2026003",
      studentName: "王**",
      studentId: "2022****003",
      major: "网络工程",
      type: "国家奖学金",
      amount: 8000,
      status: "待院系复核",
      aiScore: 95,
      submitTime: "2026-06-07 16:45",
      currentApprover: "院系管理员王老师",
      flagged: false,
    },
    {
      id: "APP2026004",
      studentName: "赵**",
      studentId: "2023****004",
      major: "信息安全",
      type: "勤工助学",
      amount: 1500,
      status: "已通过",
      aiScore: 78,
      submitTime: "2026-06-07 14:20",
      currentApprover: "-",
      flagged: false,
    },
    {
      id: "APP2026005",
      studentName: "刘**",
      studentId: "2022****005",
      major: "数据科学与大数据技术",
      type: "国家助学金",
      amount: 3300,
      status: "已驳回",
      aiScore: 65,
      submitTime: "2026-06-07 11:00",
      currentApprover: "-",
      flagged: false,
    },
  ]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "待院系复核":
        return "bg-blue-100 text-blue-700";
      case "待辅导员初审":
        return "bg-orange-100 text-orange-700";
      case "已通过":
        return "bg-green-100 text-green-700";
      case "已驳回":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const handleViewDetail = (app: Application) => {
    setSelectedApp(app);
    setShowDetail(true);
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) {
      alert("请先选择申请");
      return;
    }
    alert(`批量通过 ${selectedIds.length} 个申请`);
    setSelectedIds([]);
  };

  const handleBatchReject = () => {
    if (selectedIds.length === 0) {
      alert("请先选择申请");
      return;
    }
    alert(`批量驳回 ${selectedIds.length} 个申请`);
    setSelectedIds([]);
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (typeFilter !== "all" && app.type !== typeFilter) return false;
    if (
      searchText &&
      !app.studentName.includes(searchText) &&
      !app.id.includes(searchText)
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">申请列表</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="申请状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="待院系复核">待院系复核</SelectItem>
                <SelectItem value="待辅导员初审">待辅导员初审</SelectItem>
                <SelectItem value="已通过">已通过</SelectItem>
                <SelectItem value="已驳回">已驳回</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="申请类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="国家助学金">国家助学金</SelectItem>
                <SelectItem value="国家奖学金">国家奖学金</SelectItem>
                <SelectItem value="临时困难补助">临时困难补助</SelectItem>
                <SelectItem value="勤工助学">勤工助学</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                className="pl-10"
                placeholder="搜索学号/姓名..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedIds.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                已选择 {selectedIds.length} 个申请
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBatchApprove}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  批量通过
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={handleBatchReject}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  批量驳回
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                >
                  取消选择
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 申请列表 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredApplications.map((a) => a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    checked={
                      selectedIds.length === filteredApplications.length &&
                      filteredApplications.length > 0
                    }
                  />
                </TableHead>
                <TableHead>申请编号</TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>申请类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>AI评分</TableHead>
                <TableHead>当前审批人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow
                  key={app.id}
                  className={app.flagged ? "bg-red-50" : ""}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.includes(app.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, app.id]);
                        } else {
                          setSelectedIds(selectedIds.filter((id) => id !== app.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{app.id}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {app.studentName}
                      {app.flagged && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{app.studentId}</TableCell>
                  <TableCell>{app.major}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.type}</Badge>
                  </TableCell>
                  <TableCell>¥{app.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={getAIScoreColor(app.aiScore)}>
                      {app.aiScore}
                    </span>
                  </TableCell>
                  <TableCell>{app.currentApprover}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(app)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 申请详情弹窗 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">申请编号</p>
                  <p className="font-medium">{selectedApp.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">学生姓名</p>
                  <p className="font-medium">{selectedApp.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">学号</p>
                  <p className="font-medium">{selectedApp.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">专业</p>
                  <p className="font-medium">{selectedApp.major}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申请类型</p>
                  <p className="font-medium">{selectedApp.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申请金额</p>
                  <p className="font-medium">
                    ¥{selectedApp.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">AI评分</p>
                  <p className={`font-medium ${getAIScoreColor(selectedApp.aiScore)}`}>
                    {selectedApp.aiScore}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">当前状态</p>
                  <Badge className={getStatusColor(selectedApp.status)}>
                    {selectedApp.status}
                  </Badge>
                </div>
              </div>
              {selectedApp.status === "待院系复核" && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-red-600"
                    onClick={() => {
                      alert("已驳回");
                      setShowDetail(false);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    驳回
                  </Button>
                  <Button
                    onClick={() => {
                      alert("已通过");
                      setShowDetail(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    通过
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
