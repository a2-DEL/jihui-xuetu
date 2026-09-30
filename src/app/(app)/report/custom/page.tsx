'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout, Save, Download, RotateCcw, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const dimensions = [
  { id: 'department', name: '院系' },
  { id: 'major', name: '专业' },
  { id: 'grade', name: '年级' },
  { id: 'poverty_level', name: '贫困等级' },
  { id: 'semester', name: '学期' },
  { id: 'month', name: '月份' },
];

const metrics = [
  { id: 'apply_count', name: '申请人数' },
  { id: 'approve_count', name: '通过人数' },
  { id: 'reject_count', name: '驳回人数' },
  { id: 'approve_rate', name: '通过率' },
  { id: 'avg_amount', name: '平均金额' },
  { id: 'total_amount', name: '总金额' },
  { id: 'avg_process_time', name: '平均处理时长' },
];

type ReportCell = string | number;
type ReportRow = Record<string, ReportCell>;

const savedTemplates = [
  { id: '1', name: '院系资助统计', dimensions: ['department'], metrics: ['apply_count', 'approve_rate'] },
  { id: '2', name: '贫困等级分析', dimensions: ['poverty_level', 'semester'], metrics: ['apply_count', 'total_amount'] },
];

export default function CustomReportPage() {
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleDimension = (id: string) => {
    setSelectedDimensions(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const generateReport = async () => {
    if (selectedDimensions.length === 0 || selectedMetrics.length === 0) {
      toast({
        title: '请选择维度和指标',
        description: '至少选择一个维度和一个指标',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // 模拟生成报表
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 生成模拟数据
    const mockData = [
      { department: '计算机学院', apply_count: 156, approve_count: 142, approve_rate: '91.0%', total_amount: '¥568,000' },
      { department: '机械工程学院', apply_count: 98, approve_count: 87, approve_rate: '88.8%', total_amount: '¥348,000' },
      { department: '经济管理学院', apply_count: 120, approve_count: 108, approve_rate: '90.0%', total_amount: '¥432,000' },
      { department: '文学院', apply_count: 85, approve_count: 78, approve_rate: '91.8%', total_amount: '¥312,000' },
      { department: '数学学院', apply_count: 72, approve_count: 65, approve_rate: '90.3%', total_amount: '¥260,000' },
    ];
    
    setPreviewData(mockData);
    setLoading(false);
    
    toast({
      title: '报表生成成功',
      description: '自定义报表已生成',
    });
  };

  const saveTemplate = () => {
    toast({
      title: '模板已保存',
      description: '当前配置已保存为模板',
    });
  };

  const exportReport = () => {
    toast({
      title: '开始导出',
      description: '报表正在导出...',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">自定义报表</h1>
          <p className="text-muted-foreground">拖拽选择维度和指标生成交叉表</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveTemplate} className="gap-2">
            <Save className="w-4 h-4" />
            保存模板
          </Button>
          <Button onClick={exportReport} className="gap-2">
            <Download className="w-4 h-4" />
            导出
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 维度选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">选择维度</CardTitle>
            <CardDescription>选择报表的行维度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensions.map((dim) => (
              <div key={dim.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={dim.id}
                  checked={selectedDimensions.includes(dim.id)}
                  onCheckedChange={() => toggleDimension(dim.id)}
                />
                <Label htmlFor={dim.id} className="cursor-pointer">{dim.name}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 指标选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">选择指标</CardTitle>
            <CardDescription>选择报表的数据指标</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={metric.id}
                  checked={selectedMetrics.includes(metric.id)}
                  onCheckedChange={() => toggleMetric(metric.id)}
                />
                <Label htmlFor={metric.id} className="cursor-pointer">{metric.name}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 已保存模板 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">已保存模板</CardTitle>
            <CardDescription>快速加载历史模板</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedTemplates.map((template) => (
              <div 
                key={template.id}
                className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedDimensions(template.dimensions);
                  setSelectedMetrics(template.metrics);
                  toast({ title: `已加载模板: ${template.name}` });
                }}
              >
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.dimensions.length}个维度, {template.metrics.length}个指标
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 生成按钮 */}
      <div className="flex justify-center">
        <Button size="lg" onClick={generateReport} disabled={loading} className="w-48 gap-2">
          {loading ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              生成报表
            </>
          )}
        </Button>
      </div>

      {/* 预览区域 */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>报表预览</CardTitle>
            <CardDescription>
              维度: {selectedDimensions.map(d => dimensions.find(dim => dim.id === d)?.name).join(', ')} | 
              指标: {selectedMetrics.map(m => metrics.find(met => met.id === m)?.name).join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">院系</th>
                    <th className="border p-2 text-right">申请人数</th>
                    <th className="border p-2 text-right">通过人数</th>
                    <th className="border p-2 text-right">通过率</th>
                    <th className="border p-2 text-right">总金额</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2">{row.department}</td>
                      <td className="border p-2 text-right">{row.apply_count}</td>
                      <td className="border p-2 text-right">{row.approve_count}</td>
                      <td className="border p-2 text-right">{row.approve_rate}</td>
                      <td className="border p-2 text-right">{row.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

