"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  Calendar,
  FileArchive,
  Server,
  Zap,
  X,
  History,
  Activity,
  Settings,
} from "lucide-react";

interface BackupRecord {
  id: number;
  type: "full" | "incremental";
  size: string;
  duration: string;
  status: "completed" | "running" | "failed";
  createdAt: string;
  includes: string[];
  retentionDays: number;
}

interface RestoreTest {
  id: number;
  backupId: number;
  backupDate: string;
  status: "success" | "running" | "failed";
  duration: string;
  dataConsistency: number;
  userCount: number;
  applicationCount: number;
  testedAt: string;
}

const backupRecords: BackupRecord[] = [
  {
    id: 1,
    type: "full",
    size: "1.2 TB",
    duration: "1小时32分钟",
    status: "completed",
    createdAt: "2024-06-05 02:00",
    includes: ["数据库", "文件存储", "向量库", "日志"],
    retentionDays: 30,
  },
  {
    id: 2,
    type: "full",
    size: "1.18 TB",
    duration: "1小时28分钟",
    status: "completed",
    createdAt: "2024-06-04 02:00",
    includes: ["数据库", "文件存储", "向量库", "日志"],
    retentionDays: 30,
  },
  {
    id: 3,
    type: "incremental",
    size: "45 GB",
    duration: "12分钟",
    status: "completed",
    createdAt: "2024-06-04 12:00",
    includes: ["数据库增量", "文件增量"],
    retentionDays: 7,
  },
  {
    id: 4,
    type: "full",
    size: "1.15 TB",
    duration: "1小时25分钟",
    status: "completed",
    createdAt: "2024-06-03 02:00",
    includes: ["数据库", "文件存储", "向量库", "日志"],
    retentionDays: 30,
  },
];

const restoreTests: RestoreTest[] = [
  {
    id: 1,
    backupId: 2,
    backupDate: "2024-06-04 02:00",
    status: "success",
    duration: "1小时45分钟",
    dataConsistency: 100,
    userCount: 15680,
    applicationCount: 8920,
    testedAt: "2024-06-01 10:00",
  },
  {
    id: 2,
    backupId: 4,
    backupDate: "2024-06-03 02:00",
    status: "success",
    duration: "1小时38分钟",
    dataConsistency: 100,
    userCount: 15650,
    applicationCount: 8900,
    testedAt: "2024-05-15 10:00",
  },
];

export default function BackupPage() {
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isRestoreTestRunning, setIsRestoreTestRunning] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);

  const handleStartBackup = () => {
    setIsBackupRunning(true);
    // 模拟备份过程
    setTimeout(() => {
      setIsBackupRunning(false);
      alert("备份任务已启动！系统将在后台执行备份操作。");
    }, 1000);
  };

  const handleStartRestoreTest = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const handleConfirmRestoreTest = () => {
    setShowRestoreModal(false);
    setIsRestoreTestRunning(true);
    setRestoreProgress(0);
    
    // 模拟恢复演练进度
    const interval = setInterval(() => {
      setRestoreProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRestoreTestRunning(false);
          alert("恢复演练完成！数据一致性校验通过。");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据备份与恢复</h1>
          <p className="text-gray-500 mt-1">管理系统数据备份、恢复演练和数据安全</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStartBackup} disabled={isBackupRunning}>
            {isBackupRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                备份中...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                立即备份
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 存储状态 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">总存储空间</span>
            </div>
            <p className="text-2xl font-bold mt-2">5.0 TB</p>
            <Progress value={75} className="mt-2 h-2" />
            <p className="text-xs text-gray-500 mt-1">已使用 3.75 TB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">备份文件数</span>
            </div>
            <p className="text-2xl font-bold mt-2">{backupRecords.length}</p>
            <p className="text-xs text-gray-500 mt-2">最近备份: {backupRecords[0].createdAt}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500">恢复演练</span>
            </div>
            <p className="text-2xl font-bold mt-2">{restoreTests.length}次</p>
            <p className="text-xs text-gray-500 mt-2">成功率: 100%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-500">下次自动备份</span>
            </div>
            <p className="text-2xl font-bold mt-2">02:00</p>
            <p className="text-xs text-gray-500 mt-2">每日凌晨执行</p>
          </CardContent>
        </Card>
      </div>

      {/* 备份配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            备份配置
          </CardTitle>
          <CardDescription>配置自动备份策略和保留规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">全量备份</span>
                <Badge className="bg-green-100 text-green-700">已启用</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">执行时间</span>
                  <span>每日 02:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">保留天数</span>
                  <span>30 天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最近执行</span>
                  <span className="text-green-600">{backupRecords[0].createdAt}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">增量备份</span>
                <Badge className="bg-green-100 text-green-700">已启用</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">执行时间</span>
                  <span>每12小时</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">保留天数</span>
                  <span>7 天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最近执行</span>
                  <span className="text-green-600">{backupRecords[2].createdAt}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">异地备份</span>
                <Badge className="bg-yellow-100 text-yellow-700">待配置</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">目标位置</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">同步频率</span>
                  <span>-</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  配置异地备份
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 恢复演练进度 */}
      {isRestoreTestRunning && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-purple-700">恢复演练进行中...</p>
                <Progress value={restoreProgress} className="mt-2 h-3" />
                <p className="text-sm text-purple-600 mt-1">
                  {restoreProgress < 30 && "正在恢复数据库..."}
                  {restoreProgress >= 30 && restoreProgress < 60 && "正在恢复文件存储..."}
                  {restoreProgress >= 60 && restoreProgress < 80 && "正在恢复向量库..."}
                  {restoreProgress >= 80 && restoreProgress < 100 && "正在校验数据一致性..."}
                  {restoreProgress >= 100 && "恢复演练完成！"}
                </p>
              </div>
              <span className="text-2xl font-bold text-purple-600">{restoreProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 备份记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            备份记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backupRecords.map((backup) => (
              <div key={backup.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {backup.type === "full" ? "全量备份" : "增量备份"}
                      </span>
                      <Badge variant="outline">{backup.id}</Badge>
                      <Badge className={backup.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {backup.status === "completed" ? "已完成" : "进行中"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>时间: {backup.createdAt}</span>
                      <span>大小: {backup.size}</span>
                      <span>耗时: {backup.duration}</span>
                      <span>保留: {backup.retentionDays}天</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {backup.includes.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      onClick={() => handleStartRestoreTest(backup)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      恢复演练
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 恢复演练记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            恢复演练记录
          </CardTitle>
          <CardDescription>定期演练确保备份可恢复，建议每年至少2次</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {restoreTests.map((test) => (
              <div key={test.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium">恢复演练 #{test.id}</span>
                      <Badge className="bg-green-100 text-green-700">成功</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-500">备份点</p>
                        <p className="font-medium">{test.backupDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">恢复耗时</p>
                        <p className="font-medium text-blue-600">{test.duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">数据一致性</p>
                        <p className="font-medium text-green-600">{test.dataConsistency}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">用户数校验</p>
                        <p className="font-medium">{test.userCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">申请数校验</p>
                        <p className="font-medium">{test.applicationCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">演练时间: {test.testedAt}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileArchive className="w-4 h-4 mr-1" />
                    查看报告
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 恢复演练确认弹窗 */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-600">
                <Play className="w-5 h-5 inline mr-2" />
                恢复演练
              </h2>
              <button onClick={() => setShowRestoreModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
                  备份点：<strong>{selectedBackup.createdAt}</strong>
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  备份类型：<strong>{selectedBackup.type === "full" ? "全量备份" : "增量备份"}</strong>
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  数据大小：<strong>{selectedBackup.size}</strong>
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>恢复演练将在隔离环境（staging）中执行，不影响生产环境数据。</span>
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <Zap className="w-4 h-4 inline mr-1" />
                  演练内容：恢复数据 → 校验用户数 → 校验申请数 → 数据一致性检查
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowRestoreModal(false)}>
                  取消
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                  onClick={handleConfirmRestoreTest}
                >
                  <Play className="w-4 h-4 mr-2" />
                  开始演练
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
