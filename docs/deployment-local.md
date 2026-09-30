# 本地 Docker 部署说明（非公网发布指南）

更新于 2026-09-30。当前只交付本地复现骨架；正式业务和公网评委体验仍受 P0 安全闸门阻断。

## 镜像目标与端口

| 服务 | Dockerfile target | 绑定 | 能力 |
|---|---|---|---|
| release-locked | release-locked | 127.0.0.1:8080 | NODE_ENV=production；API 与演示身份保持关闭，只验证构建/部署边界 |
| local-demo（需显式 profile） | local-demo | 127.0.0.1:8081 | Next 开发模式与假数据；仅本机隔离使用，绝不能内网穿透 |

没有数据库、Redis 或独立 AI 容器。DeepSeek 外部调用默认关闭；不挂载 .env.local，不把密钥构建进镜像。Dockerfile 使用锁文件安装依赖，构建 Next standalone 镜像；镜像里只复制 standalone、静态资源及 public。源文件进入构建上下文时由 .dockerignore 白名单限制，仍需人工检查新依赖是否引用仓库外文件。

## 运行/验证步骤

1. Docker Desktop 启用 Linux Engine。执行 docker version 与 docker compose version；检查 docker info 可连到服务端。
2. 在 projects 目录执行 docker compose config --quiet 与 docker compose --profile local-demo config --quiet。
3. 执行 docker compose up --build -d release-locked；检查 docker compose ps、docker compose logs --no-color release-locked（勿把日志上传公共仓库）。浏览器只访问 127.0.0.1:8080。匿名业务 API 必须失败，演示账号在生产必须拒绝。
4. 如确需本地交互，执行 docker compose --profile local-demo up --build -d local-demo；只从本机 127.0.0.1:8081 验证使用纯模拟数据的页面。确认水印、越权拒绝、高风险指令阻断、审计故障安全停止；不得用真实学生信息。
5. 断开后 docker compose down；卷不会删除。若确认允许清除演示记录，才使用 docker compose down -v。

> 本次制作时 Docker Desktop Linux Engine 不在线，步骤 3–5 仍为待执行验收。隔离无 .env.local/.runtime 的 Next standalone 构建已成功，直启产物测试：/login 200、匿名 /api/applications 503、旧 /api/system/init 403、演示登录 POST 503；但这**不是 Docker 镜像或 Compose 服务的运行证据**。

## 公网接入前的硬门槛

- 不能把 local-demo 或 Next 开发服务器通过花生壳映射出去，即使容器端口只绑定回环地址；同机隧道客户端仍可能转发回环服务。
- release-locked 的生产拒绝分支不得为了演示而解除。未来在线 Demo 应为单独经安全评审的只读/低风险环境：可信身份、最小权限、模拟数据、禁用真实资金、审计可靠、限时账号、限流、访问日志及独立网络隔离；完成渗透和功能回归后才允许发布。
- 公网只开放经过 TLS/访问控制的 Web 入口。PostgreSQL、存储、MCP/模型凭证和内部容器端口不得发布到互联网。
- 不应公开静态管理员账号。账号/域名/证书/花生壳映射由所有者管理，不写入仓库。

## 故障与状态说明

- 8080 能显示登录页而 API 为 503 是**预期的安全锁闭状态**，不是“可用 Demo”。
- 若 Docker 构建失败，先检查容器引擎、Node/pnpm 版本、冻结锁文件、源文件跟踪、网络可达性，不要自动运行不受控的安装命令或禁用安全闸门。
- 若本机 local-demo 的数据重启后变化，检查 demo-runtime 本地卷，不可把该卷作为生产数据库或上传到 GitHub。
- 不应把敏感信息放进 Compose environment、build args、Dockerfile 层或日志；未来接真实服务前须设计经过审计的密钥读取和会话机制。
