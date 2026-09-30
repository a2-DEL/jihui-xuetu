"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileSpreadsheet } from "lucide-react";

export default function ExportRecordsPage() {
  const records = [
    { time: "2026-06-08 10:00", name: "本院系助学金明细.xlsx", type: "Excel", size: "256KB", status: "已完成" },
    { time: "2026-06-07 15:30", name: "学生贫困等级统计.pdf", type: "PDF", size: "1.2MB", status: "已完成" },
    { time: "2026-06-06 09:00", name: "申请汇总报表.csv", type: "CSV", size: "128KB", status: "已完成" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          导出记录
        </h1>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>导出时间</TableHead>
                <TableHead>文件名</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.time}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
