"use client";

import { useState } from "react";
import {
  Accessibility, Volume2, Languages, Eye, ZoomIn, MousePointer,
  Upload, CheckCircle, AlertCircle, Settings, Save, RefreshCw,
  Mic, Globe, Brain, Heart
} from "lucide-react";

// 方言模型类型
interface DialectModel {
  id: string;
  name: string;
  region: string;
  accuracy: number;
  status: "active" | "inactive" | "training";
  uploadTime?: string;
}

export default function AccessibilityConfigPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 方言识别模型
  const [dialectModels, setDialectModels] = useState<DialectModel[]>([
    { id: "1", name: "冀鲁官话模型", region: "河北、山东", accuracy: 92.5, status: "active", uploadTime: "2026-05-01" },
    { id: "2", name: "晋语模型", region: "山西、内蒙古", accuracy: 89.8, status: "active", uploadTime: "2026-04-15" },
    { id: "3", name: "东北官话模型", region: "辽宁、吉林、黑龙江", accuracy: 91.2, status: "inactive", uploadTime: "2026-03-20" },
  ]);

  // 蒙语界面配置
  const [mongolianConfig, setMongolianConfig] = useState({
    enabled: false,
    fontLoaded: false,
    rtlSupport: true,
    traditionalScript: true,
    CyrillicSupport: false,
  });

  // 无障碍配置
  const [accessConfig, setAccessConfig] = useState({
    highContrast: false,
    largeFont: false,
    fontSize: "normal",
    reduceMotion: false,
    screenReader: false,
    keyboardNav: true,
    voiceControl: false,
    colorBlindMode: "none",
    focusIndicator: true,
  });

  // 语音识别配置
  const [voiceConfig, setVoiceConfig] = useState({
    enabled: false,
    dialectDetection: true,
    autoLanguageSwitch: true,
    noiseReduction: true,
    confidenceThreshold: 0.85,
  });

  // 处理方言模型上传
  const handleModelUpload = (modelId: string) => {
    showToast(`模型 ${modelId} 上传成功`, "success");
  };

  // 切换方言模型状态
  const toggleModelStatus = (modelId: string) => {
    setDialectModels(models => models.map(m => 
      m.id === modelId ? { ...m, status: m.status === "active" ? "inactive" as const : "active" as const } : m
    ));
    showToast("模型状态已更新", "success");
  };

  // 保存配置
  const handleSave = () => {
    showToast("配置已保存", "success");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" />
            特殊群体关怀配置
          </h1>
          <p className="text-sm text-gray-500 mt-1">配置方言识别、蒙语界面、无障碍功能，为特殊群体提供更好的服务体验</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4AD4]"
        >
          <Save className="w-4 h-4" />
          保存配置
        </button>
      </div>

      {/* 方言语音识别 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-500" />
            <h2 className="font-medium text-gray-900">方言语音识别</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">上传方言语音识别模型，支持冀鲁官话、晋语等地方方言</p>
        </div>
        <div className="p-4 space-y-4">
          {/* 语音识别开关 */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900">语音识别服务</p>
                <p className="text-sm text-gray-500">开启后用户可通过语音输入信息</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={voiceConfig.enabled}
                onChange={(e) => setVoiceConfig({ ...voiceConfig, enabled: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* 方言模型列表 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">模型名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">覆盖区域</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">识别准确率</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dialectModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{model.name}</td>
                    <td className="px-4 py-3 text-gray-600">{model.region}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${model.accuracy >= 90 ? "text-green-600" : "text-orange-600"}`}>
                        {model.accuracy}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        model.status === "active" ? "bg-green-100 text-green-600" :
                        model.status === "training" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {model.status === "active" ? "已启用" : model.status === "training" ? "训练中" : "未启用"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleModelStatus(model.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            model.status === "active" 
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
                              : "bg-purple-500 text-white hover:bg-purple-600"
                          }`}
                        >
                          {model.status === "active" ? "禁用" : "启用"}
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 上传新模型 */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50">
              <Upload className="w-4 h-4" />
              上传新方言模型
            </button>
            <span className="text-sm text-gray-500">支持 .pth, .onnx, .bin 格式</span>
          </div>

          {/* 高级配置 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">自动方言检测</p>
                <p className="text-sm text-gray-500">根据语音特征自动识别方言类型</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={voiceConfig.dialectDetection}
                  onChange={(e) => setVoiceConfig({ ...voiceConfig, dialectDetection: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">降噪处理</p>
                <p className="text-sm text-gray-500">降低环境噪音对识别的影响</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={voiceConfig.noiseReduction}
                  onChange={(e) => setVoiceConfig({ ...voiceConfig, noiseReduction: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 蒙语界面 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <h2 className="font-medium text-gray-900">蒙语界面支持</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">为蒙古族学生提供蒙语界面，支持传统蒙古文和西里尔蒙古文</p>
        </div>
        <div className="p-4 space-y-4">
          {/* 蒙语界面开关 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">蒙语界面</p>
                <p className="text-sm text-gray-500">启用蒙语界面选项，用户可切换蒙语显示</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={mongolianConfig.enabled}
                onChange={(e) => setMongolianConfig({ ...mongolianConfig, enabled: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {mongolianConfig.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">传统蒙古文</p>
                  <p className="text-sm text-gray-500">竖写传统蒙古文（胡都木文）</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mongolianConfig.traditionalScript}
                    onChange={(e) => setMongolianConfig({ ...mongolianConfig, traditionalScript: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">西里尔蒙古文</p>
                  <p className="text-sm text-gray-500">西里尔字母蒙古文（内蒙古）</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mongolianConfig.CyrillicSupport}
                    onChange={(e) => setMongolianConfig({ ...mongolianConfig, CyrillicSupport: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">RTL支持</p>
                  <p className="text-sm text-gray-500">从右到左文本布局支持</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mongolianConfig.rtlSupport}
                    onChange={(e) => setMongolianConfig({ ...mongolianConfig, rtlSupport: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  {mongolianConfig.fontLoaded ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {mongolianConfig.fontLoaded ? "蒙文字体已加载" : "蒙文字体待加载"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 无障碍模式 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-green-500" />
            <h2 className="font-medium text-gray-900">无障碍模式</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">配置无障碍功能，为视障、听障等用户群体提供便利</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 高对比度 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">高对比度模式</p>
                  <p className="text-sm text-gray-500">增强界面对比度</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={accessConfig.highContrast}
                  onChange={(e) => setAccessConfig({ ...accessConfig, highContrast: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* 大字体 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ZoomIn className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">大字体模式</p>
                  <p className="text-sm text-gray-500">放大界面文字</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={accessConfig.largeFont}
                  onChange={(e) => setAccessConfig({ ...accessConfig, largeFont: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* 屏幕阅读器 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">屏幕阅读器支持</p>
                  <p className="text-sm text-gray-500">兼容主流屏幕阅读器</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={accessConfig.screenReader}
                  onChange={(e) => setAccessConfig({ ...accessConfig, screenReader: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* 减少动画 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">减少动画效果</p>
                  <p className="text-sm text-gray-500">减少界面动画和过渡效果</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={accessConfig.reduceMotion}
                  onChange={(e) => setAccessConfig({ ...accessConfig, reduceMotion: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* 色盲模式 */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">色盲友好模式</p>
                  <p className="text-sm text-gray-500">调整颜色以适应色盲用户</p>
                </div>
              </div>
              <select
                value={accessConfig.colorBlindMode}
                onChange={(e) => setAccessConfig({ ...accessConfig, colorBlindMode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="none">关闭</option>
                <option value="protanopia">红色盲</option>
                <option value="deuteranopia">绿色盲</option>
                <option value="tritanopia">蓝色盲</option>
                <option value="achromatopsia">全色盲</option>
              </select>
            </div>

            {/* 键盘导航 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">增强键盘导航</p>
                  <p className="text-sm text-gray-500">优化键盘操作体验</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={accessConfig.keyboardNav}
                  onChange={(e) => setAccessConfig({ ...accessConfig, keyboardNav: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
