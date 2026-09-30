# 冀慧学途｜校园资助数智化协同护航平台

> 本仓库目前是**模块化单体演示原型**，不是已上线的学生资助业务系统。Agent 辅助政策问答、申请与审核流程演示；资格认定、审批及资金操作必须由业务系统与责任人员管控。演示数据和银行/MCP模拟结果均不代表真实交易。

## 安全状态（先读）

- **生产环境故意 fail-closed**：生产 API/身份/模型尚未完成外部 IdP、PostgreSQL 事务与全链路审计验收，不能通过改环境变量绕过。默认容器只验证“锁闭部署”。
- **严禁把 local-demo、Next 开发服务器或 8081 端口映射到花生壳/公网。**演示身份是本地测试机制，不能当作公网身份认证。
- 不接入真实学生敏感信息、真实资金或真实银行。模型密钥只能由所有者通过独立密钥管理提供；本地容器默认不调用外部模型。
- 在线评委体验需要独立的安全验收和受控预览方案，当前尚未开放。不要公开共享的管理员演示账号/密码。

## 当前技术架构

- Next.js 16 + React 19 + TypeScript：同一个应用承载页面及 App Router API，不是 Vue/Spring/MySQL/Redis 微服务。
- 九维授权、人工闸门、业务状态机、Agent 编排及审计设计存在，但演示 Store/本地 .runtime 和真实数据库事务之间仍有验收差距。
- DeepSeek 是可选的外部依赖；本地交付配置明确禁用外部调用。Studio 的部分 Skill/MCP/工作流为模拟，未接真实银行。

[架构速览](docs/architecture.md)和[仓库目录与候选交付范围](docs/repository-map.md)。详细系统说明见工作区的《项目全景分析报告》；该文件位于仓库外，不自动纳入可公开交付包。上线缺口见仓库外的 Agent 验收报告，不能用页面 GET 200 代替业务验收。

## 本机运行（仅开发验证）

前置：Node.js 22、pnpm 11.9.0。**不要复制任何私有 .env.local 到交付包。**先人工审查 .env.example，真实配置通过本地私有文件或密钥管理注入。


a. 安装并检查：

    pnpm install --frozen-lockfile
    pnpm run validate

b. 在受控开发机启动：

    pnpm run dev

此模式使用开发身份和模拟数据，**只允许本机访问**；绝不可直接加公网映射。

## Docker Compose（本地交付骨架）

前置：Docker Desktop 的 Linux Engine 已启动。默认服务是 **release-locked**（生产禁用演示身份），不会提供可操作的评委 Demo：

    docker compose up --build -d release-locked
    docker compose ps

本机访问 http://127.0.0.1:8080/login；业务 API 应保持拒绝。停止：

    docker compose down

仅供本机开发验证的可选 Profile（端口只绑定 127.0.0.1，模型禁用）：

    docker compose --profile local-demo up --build -d local-demo

本机地址 http://127.0.0.1:8081。它使用演示身份与 Docker 本地卷 demo-runtime；**不得通过花生壳、代理、端口转发或公网发布**。停止不会自动删除卷；仅在确认没有要保留的演示记录后，手动执行 docker compose down -v。部署细节和验收闸门见 [本地部署说明](docs/deployment-local.md)。

> 隔离目录中的 Next standalone 构建及锁闭服务 HTTP 复测已通过；但本次 Docker Linux Engine 未运行，**Docker 镜像构建与 Compose 启动尚未实测**，不能宣称“Docker 一键部署通过”。

## 验证与交付边界

- 质量检查：pnpm run validate；隔离测试应从新建空目录运行，并禁用模型真实网络调用。
- 离线候选密钥定位：python scripts/scan-secrets.py --output <仓库外隔离路径>/secret-scan.json。**工具只定位，不回显密钥**；目前扫描范围不等同完整历史/二进制交付包扫描。
- [发布前清单](docs/release-checklist.md)涵盖模拟数据、凭证所有者操作、GitHub 发布审核和公网访问闸门。
- 当前尚未配置 GitHub Remote；建立私有仓库与对外发布应分别取得仓库所有者确认。请只从受审查的项目子目录制作交付内容，勿把父目录中的提交材料、视频、备份、私有配置、.runtime 或评估输出一起发布。

## 功能入口与能力边界

| 板块 | 当前定位 |
|---|---|
| 学生申请与资助项目 | 演示流程，生产持久化/事务尚待验收 |
| 审核、公示、发放与对账 | 角色和状态机演示；资金为模拟，不能用于真实拨款 |
| 小海豚智能助手 | 基础对话、有限只读知识检索与固定场景协作；生产入口关闭 |
| 权限、审计、Agent Studio | 演示与局部回归可运行；真实 IdP、多实例审计及外部 MCP 未验收 |

**开源/发布许可**：尚未确定。不要在未经项目所有者、业务数据责任人和第三方素材权利人审查前添加 LICENSE 或将仓库设置为公开。
