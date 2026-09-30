'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Search, History, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AdjustmentRecord {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  originalScore: number;
  newScore: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  reviewer?: string;
  reviewTime?: string;
  blockchainHash?: string;
}

const mockRecords: AdjustmentRecord[] = [
  {
    id: '1',
    studentName: '张三',
    studentId: 'STU001',
    department: '计算机学院',
    originalScore: 85,
    newScore: 90,
    reason: '系统错误导致信用分计算偏差，实际志愿服务时长为50小时',
    status: 'approved',
    submitTime: '2024-01-10 10:00:00',
    reviewer: '超级管理员',
    reviewTime: '2024-01-11 14:30:00',
    blockchainHash: '0x1234...abcd',
  },
  {
    id: '2',
    studentName: '李四',
    studentId: 'STU002',
    department: '机械工程学院',
    originalScore: 72,
    newScore: 78,
    reason: '因特殊原因错过还款期限，已补还并申请恢复信用',
    status: 'pending',
    submitTime: '2024-01-14 15:20:00',
  },
  {
    id: '3',
    studentName: '王五',
    studentId: 'STU003',
    department: '经济管理学院',
    originalScore: 68,
    newScore: 75,
    reason: '临时困难导致材料延迟提交',
    status: 'rejected',
    submitTime: '2024-01-12 09:00:00',
    reviewer: '超级管理员',
    reviewTime: '2024-01-13 11:00:00',
  },
];

export default function CreditAdjustPage() {
  const [records, setRecords] = useState<AdjustmentRecord[]>(mockRecords);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [adjustScore, setAdjustScore] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const filteredRecords = records.filter(r => 
    r.studentName.includes(searchKeyword) || 
    r.studentId.includes(searchKeyword) ||
    r.department.includes(searchKeyword)
  );

  const getStatusBadge = (status: AdjustmentRecord['status']) => {
    const config = {
      pending: { color: 'bg-yellow-500', text: '待审批' },
      approved: { color: 'bg-green-500', text: '已通过' },
      rejected: { color: 'bg-red-500', text: '已驳回' },
    };
    const c = config[status];
    return <Badge className={`${c.color} text-white`}>{c.text}</Badge>;
  };

  const handleSubmit = async () => {
    if (!selectedStudent.trim() || !adjustScore.trim() || !adjustReason.trim()) {
      toast({
        title: '请填写完整信息',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newRecord: AdjustmentRecord = {
      id: Date.now().toString(),
      studentName: '测试学生',
      studentId: selectedStudent,
      department: '测试院系',
      originalScore: 70,
      newScore: parseInt(adjustScore),
      reason: adjustReason,
      status: 'pending',
      submitTime: new Date().toLocaleString(),
    };

    setRecords(prev => [newRecord, ...prev]);
    setSubmitting(false);
    setShowAdjustDialog(false);
    setSelectedStudent('');
    setAdjustScore('');
    setAdjustReason('');

    toast({
      title: '调整申请已提交',
      description: '等待超级管理员审批',
    });
  };

  const pendingCount = records.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">信用分手动调整</h1>
          <p className="text-muted-foreground">对于特殊案例手动调整学生信用分</p>
        </div>
        <Button onClick={() => setShowAdjustDialog(true)} className="gap-2">
          <Edit className="w-4 h-4" />
          申请调整
        </Button>
      </div>

      {/* 提示说明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">调整说明</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>信用分调整需填写原因并提交超级管理员审批</li>
                <li>调整操作需二次确认</li>
                <li>所有调整记录将写入区块链存证，确保不可篡改</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">待审批</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已通过</p>
              <p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'approved').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已驳回</p>
              <p className="text-2xl font-bold text-red-600">{records.filter(r => r.status === 'rejected').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">总记录</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索学生姓名、学号或院系..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>调整记录</CardTitle>
          <CardDescription>信用分手动调整申请记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>院系</TableHead>
                <TableHead>原分数</TableHead>
                <TableHead>新分数</TableHead>
                <TableHead>调整原因</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>区块链存证</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-xs text-muted-foreground">{record.studentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.originalScore}</TableCell>
                  <TableCell>
                    <span className={record.newScore > record.originalScore ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {record.newScore}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.reason}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>{record.submitTime}</TableCell>
                  <TableCell>
                    {record.blockchainHash ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {record.blockchainHash}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">待存证</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 申请调整弹窗 */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请信用分调整</DialogTitle>
            <DialogDescription>
              填写调整信息并提交审批
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>学生学号</Label>
              <Input 
                placeholder="输入学生学号..."
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              />
            </div>
            <div>
              <Label>调整后分数</Label>
              <Input 
                type="number"
                placeholder="输入调整后的信用分..."
                value={adjustScore}
                onChange={(e) => setAdjustScore(e.target.value)}
              />
            </div>
            <div>
              <Label>调整原因</Label>
              <Textarea 
                placeholder="详细说明调整原因..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '提交审批'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
