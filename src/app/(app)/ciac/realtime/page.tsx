"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";

const ciacMetrics = {
  totalStudents: 15823,
  identified: 12658,
  accuracy: 94.5,
  pending: 856,
  matched: 2310,
};

const realtimeData = [
  { time: "10:00", value: 85 },
  { time: "10:05", value: 88 },
  { time: "10:10", value: 82 },
  { time: "10:15", value: 90 },
  { time: "10:20", value: 87 },
  { time: "10:25", value: 92 },
  { time: "10:30", value: 89 },
];

export default function CIACRealtimePage() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState("1h");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const container = chartRef.current;
    container.innerHTML = "";
    
    const width = container.clientWidth;
    const height = 200;
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    
    // 绘制折线图
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // 绘制网格线
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(padding));
      line.setAttribute("y1", String(y));
      line.setAttribute("x2", String(width - padding));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", "#E5E7EB");
      line.setAttribute("stroke-dasharray", "3,3");
      svg.appendChild(line);
    }
    
    // 绘制折线
    const points = realtimeData.map((d, i) => {
      const x = padding + (chartWidth / (realtimeData.length - 1)) * i;
      const y = padding + chartHeight - (d.value / 100) * chartHeight;
      return `${x},${y}`;
    }).join(" ");
    
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", points);
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#165DFF");
    polyline.setAttribute("stroke-width", "2");
    svg.appendChild(polyline);
    
    // 绘制数据点
    realtimeData.forEach((d, i) => {
      const x = padding + (chartWidth / (realtimeData.length - 1)) * i;
      const y = padding + chartHeight - (d.value / 100) * chartHeight;
      
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "#165DFF");
      svg.appendChild(circle);
      
      // X轴标签
      if (i % 2 === 0) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(x));
        text.setAttribute("y", String(height - 10));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "11");
        text.setAttribute("fill", "#666");
        text.textContent = d.time;
        svg.appendChild(text);
      }
    });
    
    container.appendChild(svg);
  }, [selectedRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">实时CIAC看板</h1>
          <p className="text-gray-500 mt-1">Comprehensive Intelligence & Assistance Center 实时监控</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30m">近30分钟</SelectItem>
              <SelectItem value="1h">近1小时</SelectItem>
              <SelectItem value="6h">近6小时</SelectItem>
              <SelectItem value="24h">近24小时</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-green-500 animate-pulse" />
            实时更新中
          </Badge>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">识别学生总数</p>
            <p className="text-2xl font-bold text-blue-600">{ciacMetrics.totalStudents.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">已识别贫困生</p>
            <p className="text-2xl font-bold text-green-600">{ciacMetrics.identified.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">识别准确率</p>
            <p className="text-2xl font-bold text-purple-600">{ciacMetrics.accuracy}%</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">待处理预警</p>
            <p className="text-2xl font-bold text-orange-600">{ciacMetrics.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-cyan-50">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">精准匹配数</p>
            <p className="text-2xl font-bold text-cyan-600">{ciacMetrics.matched.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* 实时趋势图 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI识别效率趋势</CardTitle>
          <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="w-full" style={{ height: 200 }} />
        </CardContent>
      </Card>

      {/* 实时告警 */}
      <Card>
        <CardHeader>
          <CardTitle>实时告警</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <Activity className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className="font-medium text-red-700">异常申请峰值</p>
                <p className="text-sm text-red-600">计算机学院申请异常率超过15%</p>
              </div>
              <span className="text-xs text-gray-500">3分钟前</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-yellow-700">审批延迟提醒</p>
                <p className="text-sm text-yellow-600">23份申请等待超过48小时</p>
              </div>
              <span className="text-xs text-gray-500">5分钟前</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-blue-700">AI识别效率提升</p>
                <p className="text-sm text-blue-600">识别准确率较昨日提升2.3%</p>
              </div>
              <span className="text-xs text-gray-500">10分钟前</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
