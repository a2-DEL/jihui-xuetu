"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  Clock
} from "lucide-react";

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "degraded";
  uptime: string;
  lastCheck: string;
  responseTime: number;
}

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setMetrics([
        { name: "CPU使用率", value: 45, unit: "%", status: "healthy", trend: "stable" },
        { name: "内存使用率", value: 68, unit: "%", status: "warning", trend: "up" },
        { name: "磁盘使用率", value: 32, unit: "%", status: "healthy", trend: "stable" },
        { name: "网络延迟", value: 12, unit: "ms", status: "healthy", trend: "down" },
        { name: "数据库连接数", value: 156, unit: "个", status: "healthy", trend: "stable" },
        { name: "API响应时间", value: 89, unit: "ms", status: "healthy", trend: "stable" },
      ]);

      setServices([
        { name: "Next.js 服务", status: "running", uptime: "15天 8小时", lastCheck: "刚刚", responseTime: 12 },
        { name: "PostgreSQL 数据库", status: "running", uptime: "30天 2小时", lastCheck: "1分钟前", responseTime: 5 },
        { name: "Redis 缓存", status: "running", uptime: "30天 2小时", lastCheck: "1分钟前", responseTime: 1 },
        { name: "MinIO 对象存储", status: "running", uptime: "25天 6小时", lastCheck: "2分钟前", responseTime: 45 },
        { name: "DeepSeek API", status: "running", uptime: "-", lastCheck: "5分钟前", responseTime: 890 },
        { name: "银行接口服务", status: "degraded", uptime: "-", lastCheck: "3分钟前", responseTime: 2100 },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "running":
        return "text-green-500";
      case "warning":
      case "degraded":
        return "text-yellow-500";
      case "critical":
      case "stopped":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "running":
        return <Badge className="bg-green-100 text-green-700">正常</Badge>;
      case "warning":
      case "degraded":
        return <Badge className="bg-yellow-100 text-yellow-700">警告</Badge>;
      case "critical":
      case "stopped":
        return <Badge className="bg-red-100 text-red-700">异常</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-[#165DFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统健康度监控</h1>
          <p className="text-gray-500 mt-1">实时监控系统各项指标和服务状态</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 整体健康度 */}
      <Card className="bg-gradient-to-r from-[#165DFF] to-[#0D1B2A] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/80">系统整体健康度</p>
                <p className="text-4xl font-bold">92%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80">上次检查时间</p>
              <p className="text-lg">{new Date().toLocaleString("zh-CN")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">{metric.name}</span>
                {getStatusBadge(metric.status)}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{metric.value}</span>
                <span className="text-gray-500 mb-1">{metric.unit}</span>
              </div>
              <Progress 
                value={metric.unit === "%" ? metric.value : (metric.value / 200) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 服务状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            服务状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {service.status === "running" ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : service.status === "degraded" ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-500">
                      运行时间: {service.uptime} | 上次检查: {service.lastCheck}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">响应时间</p>
                    <p className={`font-medium ${service.responseTime > 1000 ? "text-yellow-500" : "text-green-500"}`}>
                      {service.responseTime} ms
                    </p>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 告警记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            最近告警
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">银行接口服务响应缓慢</p>
                <p className="text-sm text-yellow-600">响应时间超过2000ms，可能影响贷款审批流程</p>
              </div>
              <span className="text-sm text-yellow-600">5分钟前</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-800">PostgreSQL 数据库恢复正常</p>
                <p className="text-sm text-green-600">连接池已恢复，当前连接数156</p>
              </div>
              <span className="text-sm text-green-600">1小时前</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
