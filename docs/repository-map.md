# 仓库目录与候选交付范围

更新：2026-09-30。本文件解释**源码怎样组织**，不代表已批准公开或具备生产能力。

## 运行时结构

- src/app：Next.js 页面、布局与 Route Handler；页面只展示，认证/数据范围在服务端校验。
- src/components、src/hooks：React 组件与前端交互。
- src/lib/platform：身份、九维权限、业务状态机、演示 Store、审计适配。
- src/lib/ai：智能体编排、意图、会话、模型网关、白名单工具、固定协作流程。
- src/storage：Drizzle 表设计；**不意味着生产业务已改用 PostgreSQL**。
- public：静态文件。
- docs/role-function-baseline-v6.json：src/lib/platform/feature-coverage.ts 的构建时依赖，需随代码候选一起复制。
- migrations：保留在工作目录，尚不作为可运行生产迁移承诺；提交前另行审查。

## 文件分类（绝不自动 git add -A）

| 类型 | 候选处理 | 说明 |
|---|---|---|
| 核心 src、public、Next/TS/pnpm 配置 | 白名单候选 | 仍需人工隐私、许可和凭证复核 |
| README、架构、仅本地部署、发布检查单 | 白名单候选 | 必须明确 fail-closed 和 Mock 边界 |
| 9 个隔离验证/扫描脚本、prepare-release.py | 白名单候选 | 不包含线上初始化或真实资金执行器 |
| 其他 scripts（约百个）、历史 docs、DESIGN.md、migrations | 待人工审查 | 原文件不删改；可能依赖旧材料、导出工具、环境或未验收方案 |
| .env.local、.runtime、.next、node_modules、logs、assets、artifacts | 必须排除 | 私有凭证、运行数据或构建/素材产物 |
| 父目录“项目提交材料”“转型前项目材料”、视频、_review_tmp | 不在项目仓库 | 不得整目录打包或顺手上传 |

## 可复现的候选导出（不提交、不发布）

在项目目录运行 python scripts/prepare-release.py：默认只列数量、敏感候选路径，不复制。确需制作离线候选时运行 python scripts/prepare-release.py --copy --output <仓库外的新目录>。目标必须不存在，工具不会覆盖、删除源文件、初始化 Git、提交或推送。候选目录附哈希清单，状态写为 CANDIDATE_ONLY_NOT_APPROVED。

导出工具只检查固定规则和文本文件，不做源代码版权/个人信息判定，也不检查私有 .env.local、压缩包、旧交付物、历史提交。另运行 scripts/scan-secrets.py 指向仓库外隔离报告，由凭证所有者核验、轮换；仍需人工逐项检查拟暂存文件。此工具不能被用作“安全可公开”的证明。

## 下一步仓库管理

当前本地 Git 是空仓库，尚未暂存、提交或配置 Remote。只有仓库所有者确认私有组织、版权与许可、完整敏感检查后，才能按上述候选清单逐个暂存并复核 staged diff；禁止将演示管理员身份发布为可公开登录方式。公网 Demo 要等 P0 业务安全和 IdP/审计事务验收，不可把开发模式映射出去。
