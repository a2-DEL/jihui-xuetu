"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Settings,
  Gift,
  History,
  Ban,
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  AlertTriangle,
} from "lucide-react";

const stats = [
  { label: "信用体系学生", value: "12,456", change: "+156", icon: Users },
  { label: "平均信用分", value: "76.8", change: "+2.3", icon: TrendingUp },
  { label: "优秀率", value: "32.5%", change: "+5.2%", icon: Star },
  { label: "黑名单人数", value: "23", change: "-3", icon: AlertTriangle },
];

const quickLinks = [
  {
    title: "评分规则配置",
    description: "配置信用评分计算权重和等级规则",
    icon: Settings,
    href: "/credit/score-config",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "权益管理",
    description: "管理不同信用等级可享受的权益",
    icon: Gift,
    href: "/credit/benefits",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "变更审计",
    description: "查看信用分变更历史记录",
    icon: History,
    href: "/credit/audit",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "黑名单管理",
    description: "管理严重失信学生名单",
    icon: Ban,
    href: "/credit/blacklist",
    color: "bg-red-100 text-red-600",
  },
];

const recentChanges = [
  {
    student: "张三",
    studentId: "2021001001",
    change: -7,
    reason: "助学贷款逾期",
    time: "10分钟前",
  },
  {
    student: "李四",
    studentId: "2021001002",
    change: 13,
    reason: "勤工助学表现优秀",
    time: "1小时前",
  },
  {
    student: "王五",
    studentId: "2021001003",
    change: -25,
    reason: "申请材料造假",
    time: "2小时前",
  },
];

export default function CreditManagementPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">信用管理中心</h1>
        <p className="text-gray-500 mt-1">
          学生信用评分体系配置与管理，支持信用等级划分、权益配置、变更审计
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
                  <p
                    className={`text-sm mt-1 ${
                      stat.change.startsWith("+")
                        ? "text-green-600"
                        : stat.change.startsWith("-")
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {stat.change} 本月
                  </p>
                </div>
                <div className="p-3 bg-[#165DFF]/10 rounded-lg">
                  <stat.icon className="w-6 h-6 text-[#165DFF]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <Link key={index} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${link.color}`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{link.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 最近变更 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#165DFF]" />
                最近信用变更
              </CardTitle>
              <Link href="/credit/audit">
                <Button variant="link" size="sm">
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentChanges.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.change > 0 ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          item.change > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.change > 0 ? "+" : ""}
                        {item.change}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{item.student}</p>
                      <p className="text-sm text-gray-500">{item.reason}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{item.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#165DFF]" />
              信用等级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span>优秀 (90-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">4,056</span>
                  <Badge className="bg-green-500">32.5%</Badge>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "32.5%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span>良好 (75-89)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">5,234</span>
                  <Badge className="bg-blue-500">42.0%</Badge>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "42%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span>一般 (60-74)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">2,890</span>
                  <Badge className="bg-yellow-500">23.2%</Badge>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: "23.2%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span>较差 (0-59)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">276</span>
                  <Badge className="bg-red-500">2.2%</Badge>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: "2.2%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
