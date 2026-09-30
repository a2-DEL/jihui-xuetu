# 冀慧学途｜Docker 部署说明

校园资助数智化协同护航平台 —— 基于 Next.js 16 的容器化部署。

## 前置要求

只要一台装了 Docker 的机器（Windows / macOS / Linux 均可），不需要装 Node.js、不需要装数据库。

检查 Docker 是否就绪：

```bash
docker --version
```

## 一键运行

```bash
docker run -d --name jihui-xuetu -p 3000:3000 ghcr.io/a2-del/jhxt:latest
```

启动后，浏览器访问：

```
http://localhost:3000
```

（如果部署在服务器上，把 `localhost` 换成服务器 IP 或域名。）

## 常用操作

| 操作 | 命令 |
|------|------|
| 查看是否在运行 | `docker ps` |
| 查看启动日志 | `docker logs jihui-xuetu` |
| 停止系统 | `docker stop jihui-xuetu` |
| 重新启动 | `docker start jihui-xuetu` |
| 删除容器 | `docker rm -f jihui-xuetu` |
| 拉取最新镜像 | `docker pull ghcr.io/a2-del/jhxt:latest` |

## 镜像信息

- **镜像地址**：`ghcr.io/a2-del/jhxt:latest`
- **镜像大小**：约 108 MB
- **基础镜像**：node:22-bookworm-slim
- **监听端口**：容器内 3000（映射到宿主机 3000）
- **架构**：linux/amd64

## 如果要换端口

比如想让别人通过 8080 端口访问：

```bash
docker run -d --name jihui-xuetu -p 8080:3000 ghcr.io/a2-del/jhxt:latest
```

然后访问 `http://localhost:8080`。

## 说明

- 该镜像为 Next.js standalone 生产构建，启动约 200ms 即可就绪。
- 演示数据内置在镜像中，无需额外配置数据库。
- 如需连接真实 PostgreSQL 或外部大模型 API，需要通过 `-e` 传入环境变量，请联系项目维护者。
