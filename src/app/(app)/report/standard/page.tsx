'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Eye, Calendar, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface StandardReport {
  id: string;
  name: string;
  templateType: string;
  semester: string;
  status: 'ready' | 'generating' | 'generated';
  generateTime?: string;
  fileSize?: string;
}

const mockReports: StandardReport[] = [
  {
    id: '1',
    name: '2024年春季助学金发放明细表',
    templateType: '助学金发放明细',
    semester: '2024春季',
    status: 'generated',
    generateTime: '2024-01-15 10:00:00',
    fileSize: '2.5MB',
  },
  {
    id: '2',
    name: '2024年春季助学贷款审批汇总表',
    templateType: '助学贷款汇总',
    semester: '2024春季',
    status: 'generated',
    generateTime: '2024-01-14 15:30:00',
    fileSize: '1.8MB',
  },
  {
    id: '3',
    name: '2023年秋季临时困难补助发放表',
    templateType: '困难补助发放',
    semester: '2023秋季',
    status: 'generated',
    generateTime: '2023-12-20 09:00:00',
    fileSize: '856KB',
  },
];

const reportTemplates = [
  { id: '1', name: '助学金发放明细表', description: '教育厅标准格式，包含发放明细' },
  { id: '2', name: '助学贷款审批汇总表', description: '银行对接格式，汇总审批情况' },
  { id: '3', name: '临时困难补助发放表', description: '校内补助发放明细' },
  { id: '4', name: '贫困生认定汇总表', description: '贫困等级认定情况汇总' },
  { id: '5', name: '资助工作统计表', description: '资助工作综合统计数据' },
];

export default function StandardReportPage() {
  const [reports, setReports] = useState<StandardReport[]>(mockReports);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('2024春季');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    setGenerating(true);
    
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const template = reportTemplates.find(t => t.id === selectedTemplate);
    const newReport: StandardReport = {
      id: Date.now().toString(),
      name: `${selectedSemester}${template?.name || ''}`,
      templateType: template?.name || '',
      semester: selectedSemester,
      status: 'generated',
      generateTime: new Date().toLocaleString(),
      fileSize: '1.2MB',
    };
    
    setReports(prev => [newReport, ...prev]);
    setGenerating(false);
    setShowGenerateDialog(false);
    
    toast({
      title: '报表生成成功',
      description: `${newReport.name} 已生成`,
    });
  };

  const handleDownload = (report: StandardReport) => {
    toast({
      title: '开始下载',
      description: `${report.name} 正在下载...`,
    });
  };

  const handleDelete = (report: StandardReport) => {
    setReports(prev => prev.filter(r => r.id !== report.id));
    toast({
      title: '已删除',
      description: `${report.name} 已删除`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">标准报表</h1>
          <p className="text-muted-foreground">根据教育厅要求自动生成标准格式报表</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          生成报表
        </Button>
      </div>

      {/* 报表模板 */}
      <Card>
        <CardHeader>
          <CardTitle>可用模板</CardTitle>
          <CardDescription>教育厅标准报表模板</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-8 h-8 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 已生成报表 */}
      <Card>
        <CardHeader>
          <CardTitle>已生成报表</CardTitle>
          <CardDescription>历史生成的标准报表</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报表名称</TableHead>
                <TableHead>模板类型</TableHead>
                <TableHead>学期</TableHead>
                <TableHead>生成时间</TableHead>
                <TableHead>文件大小</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.templateType}</TableCell>
                  <TableCell>{report.semester}</TableCell>
                  <TableCell>{report.generateTime}</TableCell>
                  <TableCell>{report.fileSize}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(report)}>
                        <Download className="w-3 h-3 mr-1" />
                        下载
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(report)}>
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

      {/* 生成报表弹窗 */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生成标准报表</DialogTitle>
            <DialogDescription>
              选择模板和学期生成教育厅标准格式报表
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>报表模板</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="选择模板" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>学期</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024春季">2024春季</SelectItem>
                  <SelectItem value="2023秋季">2023秋季</SelectItem>
                  <SelectItem value="2023春季">2023春季</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>取消</Button>
            <Button onClick={handleGenerate} disabled={!selectedTemplate || generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                '生成报表'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
