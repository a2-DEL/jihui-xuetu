"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserCheck, ArrowRight } from "lucide-react";

export default function DelegateApprovalPage() {
  const [delegations] = useState([
    {
      id: "1",
      fromUser: "王老师",
      toUser: "李老师",
      startTime: "2026-06-08 09:00",
      endTime: "2026-06-10 18:00",
      status: "生效中",
      reason: "出差",
    },
    {
      id: "2",
      fromUser: "张老师",
      toUser: "王老师",
      startTime: "2026-06-05 09:00",
      endTime: "2026-06-06 18:00",
      status: "已结束",
      reason: "请假",
    },
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">委托审批</h1>
      </div>

      {/* 新建委托 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新建委托</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">委托给</p>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择人员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="li">李老师</SelectItem>
                  <SelectItem value="zhang">张老师</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">开始时间</p>
              <Input type="datetime-local" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">结束时间</p>
              <Input type="datetime-local" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">委托原因</p>
              <Input placeholder="请输入原因" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button>
              <ArrowRight className="w-4 h-4 mr-2" />
              创建委托
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 委托列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">委托记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {delegations.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>{item.fromUser}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{item.toUser}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.startTime} ~ {item.endTime}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      item.status === "生效中"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-500">{item.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
