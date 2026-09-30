<div align="center">

# 冀慧学途 · JIHUI Student Aid OS

### 校园资助数智化协同护航平台

**面向学校 · 院系 · 学生 · 银行 · 监管机构的企业级资助业务操作系统**

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

<br/>

[快速开始](#-快速开始) · [功能架构](#-功能架构) · [技术栈](#-技术栈) · [部署方式](#-部署方式) · [项目结构](#-项目结构)

</div>

---

## 📖 项目简介

冀慧学途是一套覆盖**学生资助全生命周期**的数智化业务操作系统。平台以"人工决策 + AI 协同 + 全程可审计"为核心理念，将资助申请、资格认定、审批流转、资金发放、银行对账、监管报送、信用评价等核心业务统一到一个工作台，让每一次判断、每一笔流转、每一次资金操作都**有权限、有依据、可回溯**。

> 本项目为挑战杯 / 创新创业竞赛演示版本，内置脱敏模拟数据与完整业务状态机，开箱即可体验完整流程。

---

## ✨ 核心亮点

| 维度 | 能力 |
|------|------|
| 🎭 **17 类岗位角色** | 学生、辅导员、院系审核、学校资助中心、银行专员、监管部门、审计人员等全角色协作 |
| 🔐 **九维授权模型** | 基于角色、部门、数据分级、时间、场景等九维度的细粒度访问控制 |
| 🤖 **AI Agent 协同** | 内置 AI 助手、审批建议、政策问答、材料预审等智能体工作流 |
| 📊 **L0-L5 风险分级** | 对资助申请进行六维风险评级，辅助人工决策 |
| 🗄️ **P0-P5 数据分级** | 学生敏感数据按级别脱敏、遮罩、审计访问 |
| 📝 **全链路审计** | 每一步操作留痕，支持完整性校验与审计追溯 |
| 🏦 **银校协同模拟** | 模拟银行放款、对账、冲突检测等银校对接流程 |
| 📈 **监管驾驶舱** | CIAC 实时大屏、排名监控、困难生预警、舆情监测 |

---

## 🏗 功能架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        冀慧学途 · 业务层                         │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│ 学生门户  │ 审核审批  │ 资金管理  │ 银行协同  │ 监管驾驶舱 / 审计    │
│ 申请提交  │ 院系初审  │ 发放批次  │ 视频放款  │ CIAC实时监控        │
│ 进度查询  │ 学校复审  │ 对账核销  │ 冲突检测  │ 信用评价体系        │
│ 困难认定  │ 异常干预  │ 困难补助  │ 接口配置  │ 不可抵赖审计        │
├──────────┴──────────┴──────────┴──────────┴─────────────────────┤
│                     AI Agent 协同层                              │
│   政策问答 · 材料预审 · 审批建议 · 智能分单 · 风险预警 · 知识库检索  │
├─────────────────────────────────────────────────────────────────┤
│                     安全与治理层                                  │
│   九维授权 · MFA · 数据分级 · 操作审计 · 隐私请求 · 合规护栏        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + React 19 |
| 开发语言 | TypeScript 5 |
| 样式方案 | Tailwind CSS 4 + shadcn/ui |
| 状态管理 | React Server Components + Server Actions |
| 构建工具 | Webpack / Turbopack |
| 包管理 | pnpm 11 |
| 容器化 | Docker (多阶段构建) + GHCR |
| 部署模式 | Next.js Standalone 输出 |

---

## 🚀 快速开始

### 方式一：Docker 一键运行（推荐）

```bash
# 拉取镜像
docker pull ghcr.io/a2-del/jhxt:latest

# 启动容器
docker run -d -p 3000:3000 ghcr.io/a2-del/jhxt:latest

# 浏览器访问
# http://localhost:3000
```

**演示账号**：在登录页选择任意演示岗位，密码统一为 `Demo@123`

### 方式二：从源码运行

```bash
# 克隆仓库
git clone https://github.com/a2-DEL/jihui-xuetu.git
cd jihui-xuetu

# 安装依赖
pnpm install --frozen-lockfile

# 开发模式启动
pnpm dev

# 生产构建
pnpm build && pnpm start
```

---

## 📦 部署方式

### Docker 镜像

| 项目 | 地址 |
|------|------|
| 镜像仓库 | `ghcr.io/a2-del/jhxt:latest` |
| 镜像大小 | ~108 MB (精简运行时) |
| 暴露端口 | `3000` |

```bash
docker run -d \
  --name jihui-xuetu \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/a2-del/jhxt:latest
```

---

## 📁 项目结构

```
jihui-xuetu/
├── src/
│   ├── app/                    # Next.js App Router 页面与 API
│   │   ├── (app)/              # 业务工作台路由组
│   │   ├── api/                # RESTful API 接口
│   │   └── login/              # 登录页
│   ├── components/              # UI 组件库 (shadcn/ui)
│   ├── lib/
│   │   ├── platform/           # 业务领域模型
│   │   ├── identity/           # 身份认证与授权
│   │   └── platform/           # 模拟数据存储
│   └── proxy.ts                # Middleware 路由守卫
├── public/                     # 静态资源
├── docs/                       # 架构文档
├── Dockerfile                  # 多阶段构建
├── compose.yaml                # Docker Compose 配置
└── next.config.ts             # Next.js 配置
```

---

## 🎯 核心业务模块

- **申请管理**：学生在线申请、材料提交、进度跟踪、紧急通道
- **审批流转**：多级审核、转办委托、AI 审批建议、异常干预
- **资金发放**：发放批次、银行对接、对账核销、困难补助
- **银行协同**：视频放款、冲突检测、接口配置、同步监控
- **监管驾驶舱**：CIAC 排名、实时大屏、遗漏学生追踪
- **信用体系**：信用评分、黑名单、奖惩记录、权益联动
- **AI 中心**：智能对话、协作编排、模型管理、训练评估
- **审计中心**：事件追溯、完整性校验、监管报送
- **知识库**：政策文档、FAQ、语义检索、版本管理

---

## 📄 License

MIT License

---

<div align="center">

**冀慧学途 · 让资助更智能，让教育更公平**

</div>
