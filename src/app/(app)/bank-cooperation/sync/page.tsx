'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Play, Eye, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SyncTask {
  id: string;
  taskName: string;
  targetBank: string;
  dataType: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  status: 'success' | 'failed' | 'running' | 'pending';
  startTime: string;
  endTime?: string;
  errorMessage?: string;
  nextSyncTime?: string;
}

const mockSyncTasks: SyncTask[] = [
  {
    id: '1',
    taskName: '贫困等级同步',
    targetBank: '中国银行',
    dataType: '贫困等级数据',
    totalCount: 1250,
    successCount: 1245,
    failCount: 5,
    status: 'success',
    startTime: '2024-01-15 02:00:00',
    endTime: '2024-01-15 02:15:32',
    nextSyncTime: '2024-01-16 02:00:00',
  },
  {
    id: '2',
    taskName: '助学贷款数据同步',
    targetBank: '工商银行',
    dataType: '贷款申请数据',
    totalCount: 520,
    successCount: 480,
    failCount: 40,
    status: 'failed',
    startTime: '2024-01-15 03:00:00',
    endTime: '2024-01-15 03:45:18',
    errorMessage: '网络超时，部分数据未能同步',
    nextSyncTime: '2024-01-16 03:00:00',
  },
  {
    id: '3',
    taskName: '实时贫困等级推送',
    targetBank: '建设银行',
    dataType: '增量贫困数据',
    totalCount: 35,
    successCount: 28,
    failCount: 0,
    status: 'running',
    startTime: '2024-01-15 10:30:00',
  },
  {
    id: '4',
    taskName: '历史数据迁移',
    targetBank: '农业银行',
    dataType: '历史贫困记录',
    totalCount: 8500,
    successCount: 0,
    failCount: 0,
    status: 'pending',
    startTime: '2024-01-16 04:00:00',
    nextSyncTime: '2024-01-16 04:00:00',
  },
];

export default function BankSyncMonitorPage() {
  const [syncTasks, setSyncTasks] = useState<SyncTask[]>(mockSyncTasks);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<SyncTask | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [retryReason, setRetryReason] = useState('');
  const { toast } = useToast();

  const filteredTasks = filterStatus === 'all' 
    ? syncTasks 
    : syncTasks.filter(t => t.status === filterStatus);

  const getStatusBadge = (status: SyncTask['status']) => {
    const config = {
      success: { color: 'bg-green-500', text: '成功', icon: CheckCircle },
      failed: { color: 'bg-red-500', text: '失败', icon: XCircle },
      running: { color: 'bg-blue-500', text: '进行中', icon: Play },
      pending: { color: 'bg-gray-500', text: '待执行', icon: Clock },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {c.text}
      </Badge>
    );
  };

  const handleRetry = (task: SyncTask) => {
    setSelectedTask(task);
    setShowRetryDialog(true);
  };

  const confirmRetry = () => {
    if (!selectedTask) return;
    
    setSyncTasks(prev => prev.map(t => 
      t.id === selectedTask.id 
        ? { ...t, status: 'running' as const, successCount: 0, failCount: 0 }
        : t
    ));
    
    toast({
      title: '重试任务已启动',
      description: `任务"${selectedTask.taskName}"正在重新执行`,
    });
    
    setShowRetryDialog(false);
    setRetryReason('');
    setSelectedTask(null);
  };

  const viewErrorDetail = (task: SyncTask) => {
    setSelectedTask(task);
    setShowErrorDialog(true);
  };

  const runningTasks = syncTasks.filter(t => t.status === 'running');
  const failedTasks = syncTasks.filter(t => t.status === 'failed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">同步监控</h1>
          <p className="text-muted-foreground">监控贫困等级同步到银行的任务状态</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          刷新
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总任务数</p>
                <p className="text-2xl font-bold">{syncTasks.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">进行中</p>
                <p className="text-2xl font-bold text-blue-600">{runningTasks.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">失败任务</p>
                <p className="text-2xl font-bold text-red-600">{failedTasks.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">成功率</p>
                <p className="text-2xl font-bold text-green-600">
                  {((syncTasks.filter(t => t.status === 'success').length / syncTasks.length) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>同步任务列表</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="running">进行中</SelectItem>
                <SelectItem value="pending">待执行</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>目标银行</TableHead>
                <TableHead>数据类型</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>下次同步</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.taskName}</TableCell>
                  <TableCell>{task.targetBank}</TableCell>
                  <TableCell>{task.dataType}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress 
                        value={(task.successCount / task.totalCount) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-green-600">成功: {task.successCount}</span>
                        <span className="text-red-600">失败: {task.failCount}</span>
                        <span>总数: {task.totalCount}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{task.startTime}</TableCell>
                  <TableCell>{task.nextSyncTime || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {task.status === 'failed' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => viewErrorDetail(task)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            详情
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRetry(task)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            重试
                          </Button>
                        </>
                      )}
                      {task.status === 'running' && (
                        <span className="text-xs text-blue-600 animate-pulse">同步中...</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 错误详情弹窗 */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              错误详情
            </DialogTitle>
            <DialogDescription>
              任务执行失败的详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">任务名称</p>
                  <p className="font-medium">{selectedTask.taskName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">目标银行</p>
                  <p className="font-medium">{selectedTask.targetBank}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">失败数量</p>
                  <p className="font-medium text-red-600">{selectedTask.failCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">结束时间</p>
                  <p className="font-medium">{selectedTask.endTime}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">错误信息</p>
                <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
                  {selectedTask.errorMessage}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重试确认弹窗 */}
      <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重试</DialogTitle>
            <DialogDescription>
              重新执行同步任务，请填写重试原因
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="请输入重试原因..."
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetryDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmRetry} disabled={!retryReason.trim()}>
              确认重试
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
