'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark, CheckCircle, XCircle, Clock, FileText, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface LoanApplication {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  loanAmount: number;
  applyTime: string;
  pushTime: string;
  bankStatus: 'pushed' | 'reviewing' | 'approved' | 'rejected' | 'disbursed';
  bankReviewer?: string;
  reviewTime?: string;
  rejectReason?: string;
  disburseTime?: string;
  syncDelay: number; // 分钟
}

const mockLoans: LoanApplication[] = [
  {
    id: '1',
    studentName: '张三',
    studentId: 'STU001',
    department: '计算机学院',
    loanAmount: 8000,
    applyTime: '2024-01-10',
    pushTime: '2024-01-11 09:00:00',
    bankStatus: 'disbursed',
    bankReviewer: '李经理',
    reviewTime: '2024-01-12 14:30:00',
    disburseTime: '2024-01-15 10:00:00',
    syncDelay: 15,
  },
  {
    id: '2',
    studentName: '李四',
    studentId: 'STU002',
    department: '机械工程学院',
    loanAmount: 6000,
    applyTime: '2024-01-12',
    pushTime: '2024-01-13 10:00:00',
    bankStatus: 'approved',
    bankReviewer: '王经理',
    reviewTime: '2024-01-14 16:00:00',
    syncDelay: 30,
  },
  {
    id: '3',
    studentName: '王五',
    studentId: 'STU003',
    department: '经济管理学院',
    loanAmount: 10000,
    applyTime: '2024-01-13',
    pushTime: '2024-01-14 08:30:00',
    bankStatus: 'reviewing',
    syncDelay: 45,
  },
  {
    id: '4',
    studentName: '赵六',
    studentId: 'STU004',
    department: '文学院',
    loanAmount: 5000,
    applyTime: '2024-01-14',
    pushTime: '2024-01-15 09:00:00',
    bankStatus: 'rejected',
    bankReviewer: '张经理',
    reviewTime: '2024-01-15 15:00:00',
    rejectReason: '信用记录不符合银行贷款条件',
    syncDelay: 20,
  },
  {
    id: '5',
    studentName: '钱七',
    studentId: 'STU005',
    department: '数学学院',
    loanAmount: 7000,
    applyTime: '2024-01-15',
    pushTime: '2024-01-15 11:00:00',
    bankStatus: 'pushed',
    syncDelay: 10,
  },
];

export default function BankLoanPage() {
  const [loans, setLoans] = useState<LoanApplication[]>(mockLoans);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  const filteredLoans = filterStatus === 'all' 
    ? loans 
    : loans.filter(l => l.bankStatus === filterStatus);

  const getStatusConfig = (status: LoanApplication['bankStatus']) => {
    const config = {
      pushed: { color: 'bg-gray-500', text: '已推送', icon: FileText },
      reviewing: { color: 'bg-blue-500', text: '银行审核中', icon: Clock },
      approved: { color: 'bg-green-500', text: '已通过', icon: CheckCircle },
      rejected: { color: 'bg-red-500', text: '被拒', icon: XCircle },
      disbursed: { color: 'bg-purple-500', text: '已放款', icon: Landmark },
    };
    return config[status];
  };

  const getStatusBadge = (status: LoanApplication['bankStatus']) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const viewDetail = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setShowDetailDialog(true);
  };

  const handleSync = () => {
    toast({
      title: '同步请求已发送',
      description: '正在从银行获取最新审批状态...',
    });
  };

  const statusCounts = {
    pushed: loans.filter(l => l.bankStatus === 'pushed').length,
    reviewing: loans.filter(l => l.bankStatus === 'reviewing').length,
    approved: loans.filter(l => l.bankStatus === 'approved').length,
    rejected: loans.filter(l => l.bankStatus === 'rejected').length,
    disbursed: loans.filter(l => l.bankStatus === 'disbursed').length,
  };

  const avgSyncDelay = loans.reduce((acc, l) => acc + l.syncDelay, 0) / loans.length;
  const maxSyncDelay = Math.max(...loans.map(l => l.syncDelay));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">贷款审批查看</h1>
          <p className="text-muted-foreground">查看全校助学贷款申请在银行端的审批进度</p>
        </div>
        <Button onClick={handleSync} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          同步最新状态
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已推送</p>
              <p className="text-2xl font-bold">{statusCounts.pushed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">审核中</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.reviewing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已通过</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已放款</p>
              <p className="text-2xl font-bold text-purple-600">{statusCounts.disbursed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">被拒绝</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">平均延迟</p>
              <p className="text-2xl font-bold">{avgSyncDelay.toFixed(0)}分钟</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 同步状态提示 */}
      {maxSyncDelay > 50 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              存在同步延迟超过50分钟的记录，建议检查银行接口连通性
            </p>
          </CardContent>
        </Card>
      )}

      {/* 贷款列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>贷款申请列表</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pushed">已推送</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">被拒</SelectItem>
                <SelectItem value="disbursed">已放款</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>院系</TableHead>
                <TableHead>贷款金额</TableHead>
                <TableHead>银行状态</TableHead>
                <TableHead>推送时间</TableHead>
                <TableHead>同步延迟</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.studentName}</TableCell>
                  <TableCell>{loan.studentId}</TableCell>
                  <TableCell>{loan.department}</TableCell>
                  <TableCell>¥{loan.loanAmount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(loan.bankStatus)}</TableCell>
                  <TableCell>{loan.pushTime}</TableCell>
                  <TableCell>
                    <span className={loan.syncDelay > 50 ? 'text-red-600' : ''}>
                      {loan.syncDelay}分钟
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => viewDetail(loan)}>
                      <Eye className="w-3 h-3 mr-1" />
                      详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>贷款申请详情</DialogTitle>
            <DialogDescription>
              查看银行端审批详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">学生姓名</p>
                  <p className="font-medium">{selectedLoan.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">学号</p>
                  <p className="font-medium">{selectedLoan.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">院系</p>
                  <p className="font-medium">{selectedLoan.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">贷款金额</p>
                  <p className="font-medium">¥{selectedLoan.loanAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">申请时间</p>
                  <p className="font-medium">{selectedLoan.applyTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">推送时间</p>
                  <p className="font-medium">{selectedLoan.pushTime}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">银行状态</p>
                  {getStatusBadge(selectedLoan.bankStatus)}
                </div>
              </div>
              
              {selectedLoan.bankReviewer && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">银行审核人</p>
                    <p className="font-medium">{selectedLoan.bankReviewer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">审核时间</p>
                    <p className="font-medium">{selectedLoan.reviewTime}</p>
                  </div>
                </div>
              )}
              
              {selectedLoan.rejectReason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">拒绝原因</p>
                  <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
                    {selectedLoan.rejectReason}
                  </div>
                </div>
              )}
              
              {selectedLoan.disburseTime && (
                <div>
                  <p className="text-sm text-muted-foreground">放款时间</p>
                  <p className="font-medium text-green-600">{selectedLoan.disburseTime}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
