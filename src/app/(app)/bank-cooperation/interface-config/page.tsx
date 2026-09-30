"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";

const interfaces = [
  {
    id: 1,
    name: "放款通知接口",
    bank: "中国银行",
    url: "https://api.boc.cn/loan/notify",
    method: "POST",
    status: "active",
    lastCall: "5分钟前",
    successRate: "99.8%",
  },
  {
    id: 2,
    name: "还款查询接口",
    bank: "中国银行",
    url: "https://api.boc.cn/repayment/query",
    method: "GET",
    status: "active",
    lastCall: "10分钟前",
    successRate: "100%",
  },
  {
    id: 3,
    name: "账户绑定接口",
    bank: "工商银行",
    url: "https://api.icbc.cn/account/bind",
    method: "POST",
    status: "active",
    lastCall: "15分钟前",
    successRate: "99.5%",
  },
  {
    id: 4,
    name: "余额查询接口",
    bank: "建设银行",
    url: "https://api.ccb.cn/balance/query",
    method: "GET",
    status: "error",
    lastCall: "2小时前",
    successRate: "85.2%",
  },
  {
    id: 5,
    name: "对账数据同步",
    bank: "农业银行",
    url: "https://api.abocn.com/recon/sync",
    method: "POST",
    status: "active",
    lastCall: "30分钟前",
    successRate: "99.9%",
  },
];

export default function InterfaceConfigPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">银行接口配置</h1>
          <p className="text-gray-500 mt-1">配置和管理各银行API接口参数</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增接口
        </Button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">总接口数</p>
            <p className="text-2xl font-bold">{interfaces.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">正常运行</p>
            <p className="text-2xl font-bold text-green-600">
              {interfaces.filter((i) => i.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">异常接口</p>
            <p className="text-2xl font-bold text-red-600">
              {interfaces.filter((i) => i.status === "error").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">平均成功率</p>
            <p className="text-2xl font-bold">96.9%</p>
          </CardContent>
        </Card>
      </div>

      {/* 接口列表 */}
      <Card>
        <CardHeader>
          <CardTitle>接口列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interfaces.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      item.status === "active"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Link2
                      className={`w-5 h-5 ${
                        item.status === "active"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge
                        className={
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {item.status === "active" ? "正常" : "异常"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{item.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm text-right">
                    <p className="text-gray-500">{item.bank}</p>
                    <p className="text-gray-400">最后调用: {item.lastCall}</p>
                  </div>
                  <Badge variant="outline">{item.method}</Badge>
                  <Badge
                    variant="secondary"
                    className={
                      parseFloat(item.successRate) >= 99
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }
                  >
                    {item.successRate}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
