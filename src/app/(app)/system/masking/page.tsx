"use client";

import { useState } from "react";
import {
  Shield, Eye, EyeOff, Save, Plus, Edit, Trash2, RefreshCw,
  CheckCircle, AlertCircle, Settings, Users, FileText
} from "lucide-react";

// 脱敏规则类型
interface MaskingRule {
  id: string;
  fieldName: string;
  fieldLabel: string;
  pattern: string;
  description: string;
  enabled: boolean;
  roles: string[]; // 应用到的角色
}

// 角色列表
const ROLES = [
  { code: "super_admin", name: "超级管理员", canViewFull: true },
  { code: "school_admin", name: "校级管理员", canViewFull: false },
  { code: "dept_admin", name: "院系管理员", canViewFull: false },
  { code: "counselor", name: "辅导员", canViewFull: false },
  { code: "student", name: "学生", canViewFull: false },
  { code: "bank_staff", name: "银行工作人员", canViewFull: false },
  { code: "auditor", name: "教育厅监管员", canViewFull: false },
];

// 默认脱敏规则
const defaultRules: MaskingRule[] = [
  {
    id: "1",
    fieldName: "idCard",
    fieldLabel: "身份证号",
    pattern: "前6后4",
    description: "显示前6位和后4位，中间用星号代替",
    enabled: true,
    roles: ["school_admin", "dept_admin", "counselor", "bank_staff", "auditor"],
  },
  {
    id: "2",
    fieldName: "phone",
    fieldLabel: "手机号",
    pattern: "前3后4",
    description: "显示前3位和后4位，中间4位用星号代替",
    enabled: true,
    roles: ["school_admin", "dept_admin", "counselor", "bank_staff", "auditor"],
  },
  {
    id: "3",
    fieldName: "bankAccount",
    fieldLabel: "银行账号",
    pattern: "后4",
    description: "仅显示后4位，其余用星号代替",
    enabled: true,
    roles: ["school_admin", "dept_admin", "counselor", "auditor"],
  },
  {
    id: "4",
    fieldName: "familyIncome",
    fieldLabel: "家庭收入",
    pattern: "区间",
    description: "显示收入区间而非精确数值",
    enabled: true,
    roles: ["dept_admin", "counselor", "auditor"],
  },
  {
    id: "5",
    fieldName: "address",
    fieldLabel: "家庭住址",
    pattern: "省市区",
    description: "仅显示省市区，隐藏详细地址",
    enabled: true,
    roles: ["dept_admin", "counselor", "auditor"],
  },
];

export default function DataMaskingPage() {
  const [rules, setRules] = useState<MaskingRule[]>(defaultRules);
  const [selectedRule, setSelectedRule] = useState<MaskingRule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 切换规则启用状态
  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
    showToast("规则状态已更新", "success");
  };

  // 更新规则角色
  const updateRuleRoles = (ruleId: string, roleCode: string, enabled: boolean) => {
    setRules(rules.map(r => {
      if (r.id === ruleId) {
        const newRoles = enabled 
          ? [...r.roles, roleCode]
          : r.roles.filter(role => role !== roleCode);
        return { ...r, roles: newRoles };
      }
      return r;
    }));
  };

  // 删除规则
  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    showToast("规则已删除", "success");
  };

  // 应用脱敏
  const applyMasking = (value: string, pattern: string): string => {
    switch (pattern) {
      case "前6后4":
        if (value.length >= 10) {
          return value.slice(0, 6) + "****" + value.slice(-4);
        }
        return value;
      case "前3后4":
        if (value.length >= 7) {
          return value.slice(0, 3) + "****" + value.slice(-4);
        }
        return value;
      case "后4":
        if (value.length >= 4) {
          return "*".repeat(value.length - 4) + value.slice(-4);
        }
        return value;
      case "区间":
        const num = parseInt(value);
        if (isNaN(num)) return value;
        if (num < 10000) return "1万以下";
        if (num < 30000) return "1-3万";
        if (num < 50000) return "3-5万";
        if (num < 100000) return "5-10万";
        return "10万以上";
      case "省市区":
        // 简化处理，只显示前两级行政区
        const parts = value.split(/[省市县区]/);
        if (parts.length >= 2) {
          return parts[0] + "市" + (parts[1] ? parts[1] + "区" : "");
        }
        return value;
      default:
        return value;
    }
  };

  // 保存配置
  const handleSave = () => {
    showToast("脱敏规则配置已保存", "success");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            数据脱敏规则
          </h1>
          <p className="text-sm text-gray-500 mt-1">配置各角色可见字段的脱敏样式，保护敏感数据安全</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            预览效果
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4AD4]"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>

      {/* 说明卡片 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">数据脱敏说明</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>超级管理员默认可查看所有原始数据，不受脱敏规则限制</li>
              <li>脱敏规则可热更新，修改后立即生效，无需重启服务</li>
              <li>所有数据访问行为都会被记录到审计日志</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 脱敏规则列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">脱敏规则配置</h2>
          <button className="flex items-center gap-2 px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            新增规则
          </button>
        </div>
        
        <div className="divide-y">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.enabled ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Shield className={`w-5 h-5 ${rule.enabled ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{rule.fieldLabel}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{rule.fieldName}</code>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${rule.enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                        {rule.enabled ? "已启用" : "未启用"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3 py-1 rounded text-sm ${rule.enabled ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                  >
                    {rule.enabled ? "禁用" : "启用"}
                  </button>
                  <button
                    onClick={() => { setSelectedRule(rule); setShowEditModal(true); }}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 脱敏模式 */}
              <div className="flex items-center gap-4 mb-3 p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-500">脱敏模式：</span>
                <span className="text-sm font-medium text-gray-700">{rule.pattern}</span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">示例：</span>
                <code className="text-sm bg-white px-2 py-0.5 rounded border">
                  {rule.fieldName === "idCard" && applyMasking("130102199001011234", rule.pattern)}
                  {rule.fieldName === "phone" && applyMasking("13812345678", rule.pattern)}
                  {rule.fieldName === "bankAccount" && applyMasking("6222021234567890123", rule.pattern)}
                  {rule.fieldName === "familyIncome" && applyMasking("25000", rule.pattern)}
                  {rule.fieldName === "address" && applyMasking("河北省石家庄市长安区建设大街123号", rule.pattern)}
                </code>
              </div>

              {/* 应用角色 */}
              <div>
                <span className="text-sm text-gray-500">应用角色：</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLES.filter(r => r.code !== "super_admin").map((role) => (
                    <label 
                      key={role.code} 
                      className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm ${
                        rule.roles.includes(role.code) 
                          ? "bg-blue-100 text-blue-700 border border-blue-300" 
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={rule.roles.includes(role.code)}
                        onChange={(e) => updateRuleRoles(rule.id, role.code, e.target.checked)}
                        className="sr-only"
                      />
                      {rule.roles.includes(role.code) ? <CheckCircle className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 角色权限矩阵 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            角色权限矩阵
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">字段</th>
                {ROLES.map(role => (
                  <th key={role.code} className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.filter(r => r.enabled).map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{rule.fieldLabel}</td>
                  {ROLES.map(role => (
                    <td key={role.code} className="px-4 py-3 text-center">
                      {role.canViewFull ? (
                        <span className="text-green-600 text-xs font-medium">完整可见</span>
                      ) : rule.roles.includes(role.code) ? (
                        <span className="text-orange-600 text-xs font-medium">脱敏可见</span>
                      ) : (
                        <span className="text-gray-400 text-xs">不可见</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑规则弹窗 */}
      {showEditModal && selectedRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">编辑脱敏规则</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">字段名称</label>
                <input
                  type="text"
                  value={selectedRule.fieldLabel}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">脱敏模式</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option value="前6后4">前6后4（身份证）</option>
                  <option value="前3后4">前3后4（手机号）</option>
                  <option value="后4">仅后4位</option>
                  <option value="区间">区间显示</option>
                  <option value="省市区">仅省市区</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  defaultValue={selectedRule.description}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button
                  onClick={() => { showToast("规则已更新", "success"); setShowEditModal(false); }}
                  className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4AD4]"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预览效果弹窗 */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">脱敏效果预览</h2>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">原始数据</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>身份证号: <code className="bg-white px-2 py-0.5 rounded">130102199001011234</code></div>
                  <div>手机号: <code className="bg-white px-2 py-0.5 rounded">13812345678</code></div>
                  <div>银行账号: <code className="bg-white px-2 py-0.5 rounded">6222021234567890123</code></div>
                  <div>家庭收入: <code className="bg-white px-2 py-0.5 rounded">25000元</code></div>
                </div>
              </div>

              {ROLES.filter(r => r.code !== "super_admin").map((role) => (
                <div key={role.code} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">{role.name} 视角</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {rules.filter(r => r.enabled).map(rule => (
                      <div key={rule.id}>
                        {rule.fieldLabel}: 
                        <code className="bg-white px-2 py-0.5 rounded ml-1">
                          {rule.roles.includes(role.code) 
                            ? applyMasking(
                                rule.fieldName === "idCard" ? "130102199001011234" :
                                rule.fieldName === "phone" ? "13812345678" :
                                rule.fieldName === "bankAccount" ? "6222021234567890123" :
                                rule.fieldName === "familyIncome" ? "25000" : "",
                                rule.pattern
                              )
                            : "******"
                          }
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
