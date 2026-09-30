"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Link2,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Database,
} from "lucide-react";

const stats = [
  { label: "已接入银行", value: "5", icon: Building2, color: "text-blue-600" },
  { label: "今日同步次数", value: "127", icon: RefreshCw, color: "text-green-600" },
  { label: "数据冲突", value: "3", icon: AlertTriangle, color: "text-red-600" },
  { label: "待对账金额", value: "¥2.3M", icon: DollarSign, color: "text-purple-600" },
];

const banks = [
  {
    name: "中国银行",
    status: "online",
    lastSync: "5分钟前",
    apiStatus: "正常",
    interfaceCount: 12,
  },
  {
    name: "工商银行",
    status: "online",
    lastSync: "10分钟前",
    apiStatus: "正常",
    interfaceCount: 8,
  },
  {
    name: "建设银行",
    status: "offline",
    lastSync: "2小时前",
    apiStatus: "连接异常",
    interfaceCount: 6,
  },
  {
    name: "农业银行",
    status: "online",
    lastSync: "3分钟前",
    apiStatus: "正常",
    interfaceCount: 10,
  },
  {
    name: "邮政储蓄",
    status: "online",
    lastSync: "15分钟前",
    apiStatus: "正常",
    interfaceCount: 5,
  },
];

const syncLogs = [
  { time: "10:35:22", type: "放款通知", bank: "中国银行", status: "success", count: 156 },
  { time: "10:30:15", type: "还款同步", bank: "工商银行", status: "success", count: 89 },
  { time: "10:25:08", type: "余额查询", bank: "建设银行", status: "failed", count: 0 },
  { time: "10:20:33", type: "账户绑定", bank: "农业银行", status: "success", count: 23 },
];

export default function BankCooperationPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">校银协同中心</h1>
        <p className="text-gray-500 mt-1">
          银行接口管理、数据同步监控、冲突规则配置、对账管理
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gray-100 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/bank-cooperation/interface-config">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Link2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">接口配置</h3>
                  <p className="text-sm text-gray-500">配置银行API接口参数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/bank-cooperation/sync-monitor">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">同步监控</h3>
                  <p className="text-sm text-gray-500">监控数据同步状态</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/bank-cooperation/conflict-rules">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium">冲突规则</h3>
                  <p className="text-sm text-gray-500">配置数据冲突处理规则</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/bank-cooperation/reconciliation">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">对账管理</h3>
                  <p className="text-sm text-gray-500">银行账务核对管理</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 银行状态和同步日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#165DFF]" />
                银行接入状态
              </CardTitle>
              <Button variant="outline" size="sm">刷新状态</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {banks.map((bank, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        bank.status === "online" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{bank.name}</p>
                      <p className="text-sm text-gray-500">
                        最后同步: {bank.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{bank.interfaceCount} 个接口</Badge>
                    <Badge
                      className={
                        bank.apiStatus === "正常"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {bank.apiStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#165DFF]" />
              最近同步记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{log.type}</p>
                      <p className="text-sm text-gray-500">{log.bank}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">{log.time}</span>
                    {log.count > 0 && (
                      <Badge variant="secondary">{log.count}条</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
