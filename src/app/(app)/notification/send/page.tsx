"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Users } from "lucide-react";

export default function NotificationSendPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Send className="w-6 h-6" />
          通知发送
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>发送通知</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">接收对象</label>
            <Select defaultValue="counselor">
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="counselor">本院系辅导员</SelectItem>
                <SelectItem value="students">本院系学生</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-500">通知渠道</label>
            <Select defaultValue="wechat">
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wechat">微信通知</SelectItem>
                <SelectItem value="sms">短信通知</SelectItem>
                <SelectItem value="email">邮件通知</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-500">通知标题</label>
            <Input 
              className="mt-1" 
              placeholder="请输入通知标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">通知内容</label>
            <Textarea 
              className="mt-1" 
              placeholder="请输入通知内容"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">取消</Button>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              发送通知
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
