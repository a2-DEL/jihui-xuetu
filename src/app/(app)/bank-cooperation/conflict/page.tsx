'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Clock, Eye, Send, ArrowRightLeft, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ConflictTicket {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  conflictType: 'income' | 'poverty_level' | 'bank_account' | 'other';
  schoolData: string;
  bankData: string;
  difference: string;
  status: 'pending' | 'processing' | 'resolved' | 'transferred';
  createTime: string;
  handler?: string;
  notes?: { time: string; content: string; author: string }[];
}

const mockTickets: ConflictTicket[] = [
  {
    id: '1',
    studentName: '张三',
    studentId: 'STU001',
    department: '计算机学院',
    conflictType: 'income',
    schoolData: '家庭年收入: 3万元',
    bankData: '家庭年收入: 5万元',
    difference: '差异: 66.7%',
    status: 'pending',
    createTime: '2024-01-15 10:30:00',
  },
  {
    id: '2',
    studentName: '李四',
    studentId: 'STU002',
    department: '机械工程学院',
    conflictType: 'poverty_level',
    schoolData: '贫困等级: 一般困难',
    bankData: '贫困等级: 特别困难',
    difference: '等级不一致',
    status: 'processing',
    createTime: '2024-01-14 14:20:00',
    handler: '校级管理员',
    notes: [
      { time: '2024-01-14 15:00:00', content: '已联系学生核实情况', author: '校级管理员' },
    ],
  },
  {
    id: '3',
    studentName: '王五',
    studentId: 'STU003',
    department: '经济管理学院',
    conflictType: 'bank_account',
    schoolData: '银行卡: 6222***1234',
    bankData: '银行卡: 6222***5678',
    difference: '账号不一致',
    status: 'resolved',
    createTime: '2024-01-13 09:15:00',
    handler: '校级管理员',
    notes: [
      { time: '2024-01-13 10:00:00', content: '学生已更新银行卡信息', author: '校级管理员' },
      { time: '2024-01-13 11:30:00', content: '确认信息一致，关闭工单', author: '校级管理员' },
    ],
  },
  {
    id: '4',
    studentName: '赵六',
    studentId: 'STU004',
    department: '文学院',
    conflictType: 'income',
    schoolData: '家庭年收入: 2.5万元',
    bankData: '家庭年收入: 4万元',
    difference: '差异: 60%',
    status: 'transferred',
    createTime: '2024-01-15 08:00:00',
    handler: '院系管理员',
    notes: [
      { time: '2024-01-15 09:00:00', content: '已转交文学院核实', author: '校级管理员' },
    ],
  },
];

export default function ConflictTicketPage() {
  const [tickets, setTickets] = useState<ConflictTicket[]>(mockTickets);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ConflictTicket | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const getConflictTypeText = (type: ConflictTicket['conflictType']) => {
    const map = {
      income: '收入不一致',
      poverty_level: '贫困等级不一致',
      bank_account: '银行卡不一致',
      other: '其他',
    };
    return map[type];
  };

  const getStatusBadge = (status: ConflictTicket['status']) => {
    const config = {
      pending: { color: 'bg-gray-500', text: '待处理' },
      processing: { color: 'bg-blue-500', text: '处理中' },
      resolved: { color: 'bg-green-500', text: '已解决' },
      transferred: { color: 'bg-yellow-500', text: '已转交' },
    };
    const c = config[status];
    return <Badge className={`${c.color} text-white`}>{c.text}</Badge>;
  };

  const viewDetail = (ticket: ConflictTicket) => {
    setSelectedTicket(ticket);
    setShowDetailDialog(true);
  };

  const addNote = () => {
    if (!selectedTicket || !newNote.trim()) return;
    
    setTickets(prev => prev.map(t => 
      t.id === selectedTicket.id 
        ? { 
            ...t, 
            status: 'processing' as const,
            notes: [...(t.notes || []), { 
              time: new Date().toLocaleString(), 
              content: newNote, 
              author: '校级管理员' 
            }]
          }
        : t
    ));
    
    toast({
      title: '备注已添加',
      description: '工单处理进度已更新',
    });
    
    setShowNoteDialog(false);
    setNewNote('');
  };

  const transferTicket = () => {
    if (!selectedTicket) return;
    
    setTickets(prev => prev.map(t => 
      t.id === selectedTicket.id 
        ? { 
            ...t, 
            status: 'transferred' as const,
            handler: '院系管理员',
            notes: [...(t.notes || []), { 
              time: new Date().toLocaleString(), 
              content: '已转交院系管理员核实', 
              author: '校级管理员' 
            }]
          }
        : t
    ));
    
    toast({
      title: '工单已转交',
      description: '已转交院系管理员处理',
    });
    
    setShowTransferDialog(false);
  };

  const resolveTicket = (ticket: ConflictTicket) => {
    setTickets(prev => prev.map(t => 
      t.id === ticket.id 
        ? { 
            ...t, 
            status: 'resolved' as const,
            notes: [...(t.notes || []), { 
              time: new Date().toLocaleString(), 
              content: '确认数据一致，关闭工单', 
              author: '校级管理员' 
            }]
          }
        : t
    ));
    
    toast({
      title: '工单已关闭',
      description: '冲突已解决',
    });
  };

  const pendingCount = tickets.filter(t => t.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">冲突工单处理</h1>
          <p className="text-muted-foreground">处理校银数据不一致的冲突工单</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingCount}个待处理
          </Badge>
        )}
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待处理</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'pending').length}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">处理中</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'processing').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已转交</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'transferred').length}</p>
              </div>
              <ArrowRightLeft className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已解决</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工单列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>冲突工单列表</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="transferred">已转交</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>院系</TableHead>
                <TableHead>冲突类型</TableHead>
                <TableHead>差异</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.studentName}</p>
                      <p className="text-xs text-muted-foreground">{ticket.studentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{ticket.department}</TableCell>
                  <TableCell>{getConflictTypeText(ticket.conflictType)}</TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">{ticket.difference}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{ticket.createTime}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => viewDetail(ticket)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      {ticket.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowNoteDialog(true);
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowTransferDialog(true);
                            }}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {ticket.status === 'processing' && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => resolveTicket(ticket)}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
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
            <DialogTitle>冲突工单详情</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">学生姓名</p>
                  <p className="font-medium">{selectedTicket.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">学号</p>
                  <p className="font-medium">{selectedTicket.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">冲突类型</p>
                  <p className="font-medium">{getConflictTypeText(selectedTicket.conflictType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">学校数据</p>
                  <p className="text-sm">{selectedTicket.schoolData}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">银行数据</p>
                  <p className="text-sm">{selectedTicket.bankData}</p>
                </div>
              </div>
              
              <div className="p-3 bg-red-50 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">差异</p>
                <p className="text-sm text-red-600 font-medium">{selectedTicket.difference}</p>
              </div>
              
              {selectedTicket.notes && selectedTicket.notes.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">处理记录</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedTicket.notes.map((note, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{note.author}</span>
                          <span>{note.time}</span>
                        </div>
                        <p className="mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 添加备注弹窗 */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加处理备注</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="输入备注内容..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>取消</Button>
            <Button onClick={addNote} disabled={!newNote.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 转交弹窗 */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转交工单</DialogTitle>
            <DialogDescription>
              将此工单转交院系管理员进行核实处理
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">
                学生: <span className="font-medium">{selectedTicket.studentName}</span>
                ({selectedTicket.department})
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
            <Button onClick={transferTicket}>确认转交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
