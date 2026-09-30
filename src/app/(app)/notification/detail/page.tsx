"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Clock, User, Bell, CheckCircle,
  FileText, Calendar, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  title: string;
  content: string;
  type: "system" | "approval" | "deadline" | "notice";
  sender: string;
  time: string;
  read: boolean;
  relatedId?: string;
  attachments?: Array<{ name: string; size: string }>;
}

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    // 模拟获取消息详情
    const mockMessage: Message = {
      id: params.id as string,
      title: "您的国家奖学金申请已通过初审",
      content: `尊敬的同学：

您提交的2025-2026学年国家奖学金申请已通过初审，请于3个工作日内携带相关材料原件到资助中心进行现场核验。

核验时间：工作日 9:00-17:00
核验地点：学生事务服务中心 201室

所需材料：
1. 申请表原件
2. 成绩单原件
3. 家庭经济情况证明原件
4. 身份证原件及复印件

如有疑问，请联系资助中心：010-12345678

感谢您的配合！

资助中心
2025年10月15日`,
      type: "approval",
      sender: "资助中心",
      time: "2025-10-15 14:30:00",
      read: false,
      relatedId: "APP-2025-001",
      attachments: [
        { name: "核验须知.pdf", size: "125KB" },
        { name: "材料清单.docx", size: "45KB" },
      ],
    };
    setMessage(mockMessage);
  }, [params.id]);

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      system: { label: "系统消息", color: "bg-blue-100 text-blue-700" },
      approval: { label: "审批通知", color: "bg-green-100 text-green-700" },
      deadline: { label: "截止提醒", color: "bg-amber-100 text-amber-700" },
      notice: { label: "公告通知", color: "bg-purple-100 text-purple-700" },
    };
    return types[type] || types.system;
  };

  const handleMarkRead = () => {
    if (message) {
      setMessage({ ...message, read: true });
      toast({ title: "成功", description: "已标记为已读" });
    }
  };

  if (!message) {
    return <div className="flex items-center justify-center h-96">加载中...</div>;
  }

  const typeInfo = getTypeBadge(message.type);

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => router.push("/notification/center")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回消息列表
      </Button>

      {/* 消息详情 */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
              <h1 className="text-xl font-bold text-gray-900">{message.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {message.sender}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {message.time}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!message.read && (
                <Button variant="outline" size="sm" onClick={handleMarkRead}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  标记已读
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          <div className="prose max-w-none">
            {message.content.split("\n").map((line, i) => (
              <p key={i} className="text-gray-700 leading-relaxed">{line}</p>
            ))}
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="font-medium text-gray-900 mb-3">附件</h4>
                <div className="space-y-2">
                  {message.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{file.size}</span>
                        <Button variant="link" size="sm">下载</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {message.relatedId && (
            <>
              <Separator className="my-6" />
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-700">
                    关联申请：<strong>{message.relatedId}</strong>
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/application/detail?id=${message.relatedId}`)}
                >
                  查看详情
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
