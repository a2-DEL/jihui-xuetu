# 架构速览（演示原型，非生产拓扑）

冀慧学途是 Next.js App Router 模块化单体。浏览器页面位于 src/app/(app)，Route Handlers 位于 src/app/api，业务权限与演示 Store 位于 src/lib/platform，Agent/知识/模型网关位于 src/lib/ai；Drizzle 表设计位于 src/storage/database/shared。页面菜单不是安全边界，API 的 Actor、九维权限、数据范围与状态机必须在服务端完成。

    浏览器（React 页面）
             ↓
    Next.js 同一进程（proxy 粗拦截 → Route Handler）
             ├── 身份解析 / 九维授权 / 业务状态机
             ├── Agent 编排 / 模型网关 / 白名单工具
             ├── 审计证据与本地演示运行文件
             └── 外部依赖预留：IdP、PostgreSQL、模型、对象存储、银行

现阶段生产 proxy 仍拒绝业务 API，演示身份不可在 NODE_ENV=production 使用。本地会话/部分业务 Store 与 .runtime 只适合隔离开发；数据库表定义并不代表业务主数据已完成 PostgreSQL 迁移。DeepSeek 模型只做语义处理，不拥有直接业务写权限。资金、银行和 Studio MCP 的模拟结果必须显式理解为假数据、假交易。

本仓库不应伪造 frontend/backend/ai-service/MySQL/Redis 多容器结构。Docker release-locked 是**安全锁闭的打包验证**；local-demo 是开发演示，不是公网入口。真实生产架构、身份、事务、数据备份、外部 MCP/银行和可用性需在独立项目验收后另行设计。

更多内容请见仓库外的项目分析与独立测试报告；公开仓库是否纳入这些材料，须先做隐私、凭证与著作权审核。
