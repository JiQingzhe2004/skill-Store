# Skill Store

Skill Store 是一个面向中文用户的 AI 技能市场平台，支持技能发布、浏览、安装、互动（星标/点赞）和管理员后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 App Router + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + Prisma + MySQL |
| 认证 | JWT + HttpOnly Cookie（Access + Refresh Token）|
| 邮件 | SMTP 抽象（开发用 Mailpit）|
| 包管理 | pnpm workspace（monorepo）|

## 目录结构

```
skill-Store/
├── apps/
│   ├── web/          # Next.js 前端
│   └── api/          # NestJS 后端
├── packages/
│   └── shared/       # 共享类型与表单 schema
├── docker/
│   └── mysql/init/   # MySQL 初始化脚本（含 shadow database）
├── scripts/
│   └── prisma-runner.mjs  # Prisma 命令包装
└── todo.md           # 开发任务清单
```

## 环境要求

- Node.js 20+
- pnpm 9+
- Docker Desktop

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量（后端）
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env，填写数据库、JWT、SMTP 等配置

# 3. 启动本地 MySQL 和 Mailpit
pnpm db:up

# 4. 生成 Prisma Client
pnpm prisma:generate

# 5. 执行数据库迁移
pnpm prisma:migrate:dev

# 6. 启动前后端
pnpm dev
```

启动后：
- 前端：http://localhost:3000
- 后端：http://localhost:3001
- Mailpit UI（查看邮件）：http://localhost:8025

## 环境变量说明

所有配置项见 `apps/api/.env.example`，主要包括：

| 变量 | 说明 | 示例 |
|------|------|------|
| `APP_URL` | 前端访问地址 | `http://localhost:3000` |
| `DATABASE_URL` | MySQL 主库连接 | `mysql://user:pass@localhost:3306/skill_store` |
| `SHADOW_DATABASE_URL` | Prisma shadow 库 | `mysql://user:pass@localhost:3306/skill_store_shadow` |
| `JWT_ACCESS_SECRET` | Access Token 密钥（建议 64 位随机串）| — |
| `JWT_REFRESH_SECRET` | Refresh Token 密钥（须与上面不同）| — |
| `SMTP_HOST` | SMTP 服务器 | `smtp.example.com` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | — |
| `SMTP_PASS` | SMTP 密码 | — |
| `SMTP_FROM` | 发件人 | `Skill Store <no-reply@example.com>` |
| `ADMIN_SETUP_SECRET` | 初始化管理员密钥 | 自定义随机字符串 |

## 初始化管理员

平台**不会**预置管理员账号，任选一种方式即可：

### 方式一：网页（推荐）

1. 在 `apps/api/.env` 配置 `ADMIN_SETUP_SECRET`（与 `.env.example` 一致即可，部署前请改掉默认值）。
2. 注册并登录任意账号。
3. 打开控制台，点击 **「立即设置」**，或直接访问 `/zh-CN/setup-admin`。
4. 输入与 `ADMIN_SETUP_SECRET` 相同的密钥，确认后自动进入管理后台。

> 首位管理员设置成功后，该接口会自动拒绝再次使用（防止密钥泄露后被滥用）。

### 方式二：命令行（本地 / 运维）

无需密钥，直接提升指定用户（邮箱或用户名）：

```bash
pnpm admin:promote you@example.com
```

若已有管理员但仍要追加，可加 `--force`。

## Docker 容器化

所有服务（前端、后端、数据库、邮件）均已容器化，支持开发热重载和生产构建两种模式。

### 开发模式（热重载）

```bash
pnpm docker:dev
```

启动后：
- 前端：http://localhost:3000（Next.js 热重载）
- 后端：http://localhost:3001（NestJS watch 模式）
- Mailpit UI：http://localhost:8025
- MySQL：localhost:3306

源码目录（`apps/api/src`、`apps/web/src`、`packages/shared`）已挂载为 volume，修改代码后自动重载，无需重建镜像。

### 生产模式

```bash
# 复制并编辑生产环境变量
cp apps/api/.env.production apps/api/.env.production.local
# 编辑其中的 JWT secret、SMTP 等配置

pnpm docker:prod
```

生产模式使用多阶段构建：
- api：NestJS `nest build` → 只保留 `dist/` 和生产依赖
- web：Next.js standalone 模式 → 只保留 `.next/standalone/`

### 从 Docker Hub 直接运行（无需源码）

镜像已发布到 Docker Hub，任何人可以直接拉取运行，无需克隆代码。

```bash
# 1. 下载 compose 文件
curl -O https://raw.githubusercontent.com/aiqiji/skill-store/dev/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/aiqiji/skill-store/dev/apps/api/.env.production

# 2. 编辑环境变量（填写真实的 JWT secret、SMTP 等）
cp .env.production .env.production.local
vim .env.production  # 或用任意编辑器

# 3. 启动
docker compose -f docker-compose.hub.yml up -d
```

启动后：
- 前端：http://localhost:3000
- 后端：http://localhost:3001
- MySQL：localhost:3306

Docker Hub 镜像地址：
- `aiqiji/skill-store-api:latest`
- `aiqiji/skill-store-web:latest`

### 停止容器

```bash
pnpm docker:down        # 停止生产模式
pnpm docker:down:dev    # 停止开发模式
```

### 技术栈补充

| 层级 | 技术 |
|------|------|
| 容器化 | Docker + Docker Compose |
| 邮件（开发）| Mailpit（替代 Mailhog）|

## 常用命令

```bash
pnpm dev                    # 同时启动前后端（本地）
pnpm dev:web                # 只启动前端
pnpm dev:api                # 只启动后端
pnpm db:up                  # 启动本地 MySQL + Mailpit（非 Docker 全栈模式）
pnpm db:down                # 停止本地服务
pnpm prisma:generate        # 生成 Prisma Client
pnpm prisma:migrate:dev     # 执行开发迁移
pnpm docker:dev             # Docker 开发模式（全栈热重载）
pnpm docker:prod            # Docker 生产模式
```

## API 文档

- **Swagger UI**：启动 API 后访问 `http://localhost:3001/api/docs`（或通过前端的 `/api/docs` 代理）
- **OpenAPI JSON**：`/api/docs-json`
- **开发者说明页**：`/{locale}/docs`（如 `/zh-CN/docs`）
- 关闭 Swagger：设置环境变量 `SWAGGER_ENABLED=false`

## 主要功能

- **用户系统**：注册（邮箱验证）、登录、忘记密码、个人资料（头像/昵称/简介）
- **技能管理**：创建/编辑技能、版本管理（版本号强制递增）、发布/下架
- **技能市场**：公开浏览、搜索、标签筛选、作者信息、下载/星标/点赞数展示
- **平台内安装**：登录用户一键安装技能，控制台查看「我的安装」
- **外部 API**：API Key 管理 + `/api/v1/skills` 只读接口与 manifest
- **互动功能**：星标、点赞（不可自己给自己点）、我的星标列表
- **管理后台**：用户列表、角色管理、封禁用户（可控时长）、技能管理
- **骨架屏**：所有数据页面均有加载骨架屏

## Commit 规范

本项目所有 commit message 使用**中文**，格式如下：

```
<类型>: <简短描述>

<详细说明（可选）>
```

类型：
- `feat` — 新功能
- `fix` — 修复问题
- `refactor` — 重构（不改变功能）
- `chore` — 构建/配置/文档等
- `style` — UI 样式调整
- `perf` — 性能优化

示例：
```
feat: 添加技能星标功能

- 新增 SkillStar 表，防止重复点星
- POST /skills/public/:slug/star 切换星标状态
- starCount 自动增减
```

## 默认语言

- 前端默认语言固定为 `zh-CN`
- 消息字典位于 `apps/web/messages/zh-CN.ts`
- 新页面和新组件请勿直接硬编码英文文案

## 开发注意事项

- `.env` 文件不提交到 git，只提交 `.env.example`
- 前端 `apps/web/.env` 存放 `NEXT_PUBLIC_*` 变量（目前为空）
- 后端 `apps/api/.env` 存放所有敏感配置
- Prisma shadow database 用于 migrate，须提前创建
