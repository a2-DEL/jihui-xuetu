"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings, Server, Database, Mail, Bell, Shield,
  Save, RefreshCw, Download, AlertTriangle, CheckCircle,
  HardDrive, Upload, Trash2, Key, Eye, EyeOff, Copy,
  Accessibility, Volume2, MousePointer, ZoomIn
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
}

interface Backup {
  id: string;
  name: string;
  size: string;
  created: string;
  type: "auto" | "manual";
}

export default function SystemConfigPage() {
  const { toast } = useToast();
  
  const [basicConfig, setBasicConfig] = useState({
    systemName: "冀慧学途",
    systemLogo: "",
    copyright: "© 2025 冀慧学途校园资助数智化平台",
    icp: "冀ICP备XXXXXXXX号",
  });

  const [aiConfig, setAiConfig] = useState({
    apiKey: "",
    model: "deepseek-v3",
    temperature: "0.7",
    maxTokens: "2048",
  });

  const [notifyConfig, setNotifyConfig] = useState({
    emailSmtp: "smtp.example.com",
    emailPort: "465",
    emailUser: "notify@example.com",
    smsProvider: "aliyun",
    smsAccessKey: "LTAI****",
  });

  // 无障碍配置
  const [accessConfig, setAccessConfig] = useState({
    highContrast: false,
    fontSize: "normal",
    screenReader: false,
    reduceMotion: false,
    keyboardNav: true,
    voiceControl: false,
  });

  // API密钥管理
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: "1", name: "DeepSeek API", key: "由服务端密钥管理器托管", created: "2026-01-15", lastUsed: "2026-05-30", status: "active" },
    { id: "2", name: "银行接口密钥", key: "bank_xxxxxxxxxxxx", created: "2026-03-01", lastUsed: "2026-05-29", status: "active" },
    { id: "3", name: "旧版API密钥", key: "old_xxxxxxxxxxxxx", created: "2025-12-01", lastUsed: "2026-01-10", status: "revoked" },
  ]);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  // 备份管理
  const [backups, setBackups] = useState<Backup[]>([
    { id: "1", name: "auto_backup_20260530", size: "256MB", created: "2026-05-30 03:00:00", type: "auto" },
    { id: "2", name: "manual_backup_20260528", size: "248MB", created: "2026-05-28 14:30:00", type: "manual" },
    { id: "3", name: "auto_backup_20260527", size: "245MB", created: "2026-05-27 03:00:00", type: "auto" },
  ]);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSave = () => {
    toast({ title: "成功", description: "配置已保存" });
  };

  const auditLogs = [
    { time: "2026-05-30 14:30:25", user: "系统管理员", action: "修改系统配置", module: "系统设置", ip: "192.168.1.100", result: "成功" },
    { time: "2026-05-30 14:15:33", user: "张三", action: "提交奖学金申请", module: "申请管理", ip: "192.168.1.105", result: "成功" },
    { time: "2026-05-30 13:50:18", user: "李四", action: "审批申请", module: "审批中心", ip: "192.168.1.102", result: "成功" },
    { time: "2026-05-30 11:20:45", user: "王五", action: "导出报表", module: "报表统计", ip: "192.168.1.108", result: "成功" },
    { time: "2026-05-30 10:05:12", user: "系统管理员", action: "新增用户", module: "用户管理", ip: "192.168.1.100", result: "成功" },
    { time: "2026-05-29 16:45:30", user: "赵六", action: "登录系统", module: "认证", ip: "192.168.1.115", result: "失败" },
  ];

  // 创建备份
  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          const newBackup: Backup = {
            id: Date.now().toString(),
            name: `manual_backup_${new Date().toISOString().split("T")[0].replace(/-/g, "")}`,
            size: "260MB",
            created: new Date().toLocaleString("zh-CN"),
            type: "manual",
          };
          setBackups([newBackup, ...backups]);
          toast({ title: "备份完成", description: "数据备份已成功创建" });
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  // 恢复备份
  const handleRestoreBackup = (backup: Backup) => {
    toast({ title: "恢复中", description: `正在从 ${backup.name} 恢复数据...` });
    setTimeout(() => {
      toast({ title: "恢复成功", description: "数据已从备份恢复" });
    }, 2000);
  };

  // 删除备份
  const handleDeleteBackup = (id: string) => {
    setBackups(backups.filter(b => b.id !== id));
    toast({ title: "删除成功", description: "备份已删除" });
  };

  // 添加API密钥
  const handleAddApiKey = () => {
    if (!newKeyName || !newKeyValue) {
      toast({ title: "错误", description: "请填写完整信息", variant: "destructive" });
      return;
    }
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: newKeyValue,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "-",
      status: "active",
    };
    setApiKeys([...apiKeys, newKey]);
    setShowAddKeyModal(false);
    setNewKeyName("");
    setNewKeyValue("");
    toast({ title: "成功", description: "API密钥已添加" });
  };

  // 撤销API密钥
  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: "revoked" as const } : k));
    toast({ title: "已撤销", description: "API密钥已被撤销" });
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制", description: "密钥已复制到剪贴板" });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1">管理系统参数、查看运行状态和操作日志（超级管理员专属）</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          保存配置
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-grid">
          <TabsTrigger value="basic">基础配置</TabsTrigger>
          <TabsTrigger value="ai">AI配置</TabsTrigger>
          <TabsTrigger value="notify">通知配置</TabsTrigger>
          <TabsTrigger value="backup">备份恢复</TabsTrigger>
          <TabsTrigger value="apikeys">API密钥</TabsTrigger>
          <TabsTrigger value="access">无障碍</TabsTrigger>
          <TabsTrigger value="status">运行状态</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        {/* 基础配置 */}
        <TabsContent value="basic">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>基础配置</CardTitle>
              <CardDescription>配置系统基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>系统名称</Label>
                <Input 
                  value={basicConfig.systemName}
                  onChange={(e) => setBasicConfig({ ...basicConfig, systemName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>系统Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Logo
                  </div>
                  <Button variant="outline" size="sm">上传Logo</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>版权信息</Label>
                <Input 
                  value={basicConfig.copyright}
                  onChange={(e) => setBasicConfig({ ...basicConfig, copyright: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ICP备案号</Label>
                <Input 
                  value={basicConfig.icp}
                  onChange={(e) => setBasicConfig({ ...basicConfig, icp: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI配置 */}
        <TabsContent value="ai">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                AI大模型配置
              </CardTitle>
              <CardDescription>配置AI助手和大模型参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input 
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>模型选择</Label>
                <Select value={aiConfig.model} onValueChange={(v) => setAiConfig({ ...aiConfig, model: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-v3">DeepSeek V3</SelectItem>
                    <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>温度参数</Label>
                  <Input 
                    value={aiConfig.temperature}
                    onChange={(e) => setAiConfig({ ...aiConfig, temperature: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大Token</Label>
                  <Input 
                    value={aiConfig.maxTokens}
                    onChange={(e) => setAiConfig({ ...aiConfig, maxTokens: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知配置 */}
        <TabsContent value="notify">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>通知服务配置</CardTitle>
              <CardDescription>配置邮件和短信通知服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  邮件服务
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP服务器</Label>
                    <Input 
                      value={notifyConfig.emailSmtp}
                      onChange={(e) => setNotifyConfig({ ...notifyConfig, emailSmtp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>端口</Label>
                    <Input 
                      value={notifyConfig.emailPort}
                      onChange={(e) => setNotifyConfig({ ...notifyConfig, emailPort: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  短信服务
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>服务商</Label>
                    <Select value={notifyConfig.smsProvider} onValueChange={(v) => setNotifyConfig({ ...notifyConfig, smsProvider: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aliyun">阿里云</SelectItem>
                        <SelectItem value="tencent">腾讯云</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>AccessKey</Label>
                    <Input 
                      type="password"
                      value={notifyConfig.smsAccessKey}
                      onChange={(e) => setNotifyConfig({ ...notifyConfig, smsAccessKey: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据备份与恢复 */}
        <TabsContent value="backup">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                  数据备份与恢复
                </CardTitle>
                <CardDescription>管理系统数据备份，支持手动和自动备份</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Button onClick={handleCreateBackup} disabled={isBackingUp}>
                    {isBackingUp ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        备份中... {backupProgress}%
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4 mr-2" />
                        创建备份
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    上传备份文件
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>自动备份：</span>
                    <Switch defaultChecked />
                    <span>每日 03:00</span>
                  </div>
                </div>

                {isBackingUp && (
                  <div className="mb-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${backupProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>备份名称</TableHead>
                      <TableHead>大小</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">{backup.name}</TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>{backup.created}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            backup.type === "auto" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          }`}>
                            {backup.type === "auto" ? "自动" : "手动"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRestoreBackup(backup)}
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              恢复
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toast({ title: "下载中", description: "备份文件正在下载..." })}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              下载
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteBackup(backup.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API密钥管理 */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                API密钥管理
              </CardTitle>
              <Button onClick={() => setShowAddKeyModal(true)}>
                <Key className="w-4 h-4 mr-2" />
                添加密钥
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>密钥</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>最后使用</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {showApiKey === apiKey.id ? apiKey.key : `${apiKey.key.slice(0, 8)}...${apiKey.key.slice(-4)}`}
                          </code>
                          <button 
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {showApiKey === apiKey.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{apiKey.created}</TableCell>
                      <TableCell>{apiKey.lastUsed}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          apiKey.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                          {apiKey.status === "active" ? "有效" : "已撤销"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {apiKey.status === "active" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeKey(apiKey.id)}
                          >
                            撤销
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 无障碍配置 */}
        <TabsContent value="access">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-green-500" />
                无障碍配置
              </CardTitle>
              <CardDescription>配置无障碍功能，提升用户体验</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">高对比度模式</p>
                    <p className="text-sm text-gray-500">增强界面对比度，提升可读性</p>
                  </div>
                </div>
                <Switch 
                  checked={accessConfig.highContrast}
                  onCheckedChange={(v) => setAccessConfig({ ...accessConfig, highContrast: v })}
                />
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">字体大小</p>
                    <p className="text-sm text-gray-500">调整界面文字大小</p>
                  </div>
                </div>
                <Select 
                  value={accessConfig.fontSize} 
                  onValueChange={(v) => setAccessConfig({ ...accessConfig, fontSize: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">小</SelectItem>
                    <SelectItem value="normal">正常</SelectItem>
                    <SelectItem value="large">大</SelectItem>
                    <SelectItem value="xlarge">特大</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">屏幕阅读器支持</p>
                    <p className="text-sm text-gray-500">为视障用户提供语音朗读功能</p>
                  </div>
                </div>
                <Switch 
                  checked={accessConfig.screenReader}
                  onCheckedChange={(v) => setAccessConfig({ ...accessConfig, screenReader: v })}
                />
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">减少动画</p>
                    <p className="text-sm text-gray-500">减少界面动画效果</p>
                  </div>
                </div>
                <Switch 
                  checked={accessConfig.reduceMotion}
                  onCheckedChange={(v) => setAccessConfig({ ...accessConfig, reduceMotion: v })}
                />
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">键盘导航增强</p>
                    <p className="text-sm text-gray-500">增强键盘操作体验</p>
                  </div>
                </div>
                <Switch 
                  checked={accessConfig.keyboardNav}
                  onCheckedChange={(v) => setAccessConfig({ ...accessConfig, keyboardNav: v })}
                />
              </div>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">语音控制</p>
                    <p className="text-sm text-gray-500">支持语音指令操作</p>
                  </div>
                </div>
                <Switch 
                  checked={accessConfig.voiceControl}
                  onCheckedChange={(v) => setAccessConfig({ ...accessConfig, voiceControl: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 运行状态 */}
        <TabsContent value="status">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Server className="w-10 h-10 text-blue-500" />
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-medium">应用服务</h4>
                <p className="text-sm text-gray-500">运行正常</p>
                <p className="text-xs text-gray-400 mt-2">内存: 512MB / CPU: 25%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Database className="w-10 h-10 text-green-500" />
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-medium">数据库</h4>
                <p className="text-sm text-gray-500">连接正常</p>
                <p className="text-xs text-gray-400 mt-2">连接数: 15 / 慢查询: 0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="w-10 h-10 text-purple-500" />
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-medium">AI服务</h4>
                <p className="text-sm text-gray-500">可用</p>
                <p className="text-xs text-gray-400 mt-2">模型: DeepSeek-V3</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Mail className="w-10 h-10 text-amber-500" />
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="font-medium">邮件服务</h4>
                <p className="text-sm text-gray-500">未配置</p>
                <p className="text-xs text-gray-400 mt-2">请配置SMTP服务</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>系统信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">系统版本</p>
                  <p className="font-medium">v1.0.0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">运行时间</p>
                  <p className="font-medium">15天 6小时</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">在线用户</p>
                  <p className="font-medium">12人</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">今日请求</p>
                  <p className="font-medium">1,256次</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 操作日志 */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>操作日志</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>模块</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>结果</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{log.time}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.module}</TableCell>
                      <TableCell className="text-sm text-gray-500">{log.ip}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${log.result === "成功" ? "text-green-600" : "text-red-600"}`}>
                          {log.result}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加API密钥弹窗 */}
      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">添加API密钥</h3>
              <button onClick={() => setShowAddKeyModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <span className="sr-only">关闭</span>
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>密钥名称</Label>
                <Input 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="如：银行接口密钥"
                />
              </div>
              <div>
                <Label>密钥值</Label>
                <Input 
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="请输入或粘贴密钥"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddKeyModal(false)}>
                取消
              </Button>
              <Button onClick={handleAddApiKey}>
                添加
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
