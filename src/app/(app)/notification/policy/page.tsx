'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Upload, Users, FileText, CheckCircle, Clock, Eye, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface PolicyNotification {
  id: string;
  title: string;
  content: string;
  attachments: string[];
  recipients: string[];
  recipientCount: number;
  readCount: number;
  sendTime: string;
  sender: string;
  status: 'sent' | 'draft';
}

const mockNotifications: PolicyNotification[] = [
  {
    id: '1',
    title: '关于2024年春季助学金申请的通知',
    content: '各院系请注意，2024年春季助学金申请已开放...',
    attachments: ['助学金申请指南.pdf', '申请表格模板.xlsx'],
    recipients: ['辅导员', '院系管理员'],
    recipientCount: 45,
    readCount: 38,
    sendTime: '2024-01-15 09:00:00',
    sender: '校级管理员',
    status: 'sent',
  },
  {
    id: '2',
    title: '贫困生认定标准调整通知',
    content: '根据最新政策，贫困生认定标准调整为...',
    attachments: ['认定标准文件.pdf'],
    recipients: ['辅导员'],
    recipientCount: 32,
    readCount: 28,
    sendTime: '2024-01-12 14:30:00',
    sender: '校级管理员',
    status: 'sent',
  },
];

export default function PolicyNotificationPage() {
  const [notifications, setNotifications] = useState<PolicyNotification[]>(mockNotifications);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const idCounter = useRef(0);

  const recipientOptions = [
    { id: 'counselor', name: '辅导员', count: 32 },
    { id: 'dept_admin', name: '院系管理员', count: 13 },
    { id: 'student', name: '学生', count: 1250 },
  ];

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!newTitle.trim() || !newContent.trim() || selectedRecipients.length === 0) {
      toast({
        title: '请填写完整信息',
        description: '标题、内容和接收人都不能为空',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const recipientNames = selectedRecipients.map(r => 
      recipientOptions.find(opt => opt.id === r)?.name || ''
    );
    const totalRecipients = selectedRecipients.reduce((acc, r) => 
      acc + (recipientOptions.find(opt => opt.id === r)?.count || 0), 0
    );

    idCounter.current += 1;
    const newNotification: PolicyNotification = {
      id: `notification-${idCounter.current}`,
      title: newTitle,
      content: newContent,
      attachments: newAttachments,
      recipients: recipientNames,
      recipientCount: totalRecipients,
      readCount: 0,
      sendTime: new Date().toLocaleString(),
      sender: '校级管理员',
      status: 'sent',
    };

    setNotifications(prev => [newNotification, ...prev]);
    setSending(false);
    setShowSendDialog(false);
    setNewTitle('');
    setNewContent('');
    setNewAttachments([]);
    setSelectedRecipients([]);

    toast({
      title: '政策已下发',
      description: `已发送给 ${totalRecipients} 人`,
    });
  };

  const handleDelete = (notification: PolicyNotification) => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    toast({
      title: '已删除',
      description: '通知已删除',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">政策下发</h1>
          <p className="text-muted-foreground">将校级政策文件一键发送给指定人员</p>
        </div>
        <Button onClick={() => setShowSendDialog(true)} className="gap-2">
          <Send className="w-4 h-4" />
          发送政策
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已发送</p>
                <p className="text-2xl font-bold">{notifications.filter(n => n.status === 'sent').length}</p>
              </div>
              <Send className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总接收人</p>
                <p className="text-2xl font-bold">{notifications.reduce((acc, n) => acc + n.recipientCount, 0)}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已读率</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const totalRead = notifications.reduce((acc, n) => acc + n.readCount, 0);
                    const totalSent = notifications.reduce((acc, n) => acc + n.recipientCount, 0);
                    return totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) + '%' : '0%';
                  })()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 已发送列表 */}
      <Card>
        <CardHeader>
          <CardTitle>已发送政策</CardTitle>
          <CardDescription>历史发送的政策通知</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>接收人</TableHead>
                <TableHead>已读/总数</TableHead>
                <TableHead>发送时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      {notification.attachments.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <FileText className="w-3 h-3 inline mr-1" />
                          {notification.attachments.length} 个附件
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {notification.recipients.map((r, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600">{notification.readCount}</span>
                    <span className="text-muted-foreground">/{notification.recipientCount}</span>
                  </TableCell>
                  <TableCell>{notification.sendTime}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(notification)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 发送弹窗 */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发送政策通知</DialogTitle>
            <DialogDescription>
              将政策文件发送给指定接收人
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>标题</Label>
              <Input 
                placeholder="输入通知标题..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>内容</Label>
              <Textarea 
                placeholder="输入通知内容..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>接收人</Label>
              <div className="space-y-2 mt-2">
                {recipientOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={opt.id}
                        checked={selectedRecipients.includes(opt.id)}
                        onCheckedChange={() => toggleRecipient(opt.id)}
                      />
                      <Label htmlFor={opt.id} className="cursor-pointer">{opt.name}</Label>
                    </div>
                    <Badge variant="outline">{opt.count}人</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>取消</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? '发送中...' : '发送'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
