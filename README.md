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

首次部署后，用已注册的账号调用以下接口将自己设为管理员：

```bash
curl -X POST http://localhost:3001/api/admin/setup \
  -H 'Content-Type: application/json' \
  -b 'your-cookie' \
  -d '{"secret": "your-ADMIN_SETUP_SECRET"}'
```

设置完成后建议将 `ADMIN_SETUP_SECRET` 改为其他随机字符串。

## 常用命令

```bash
pnpm dev                    # 同时启动前后端
pnpm dev:web                # 只启动前端
pnpm dev:api                # 只启动后端
pnpm db:up                  # 启动 MySQL + Mailpit
pnpm db:down                # 停止本地服务
pnpm prisma:generate        # 生成 Prisma Client
pnpm prisma:migrate:dev     # 执行开发迁移
```

## 主要功能

- **用户系统**：注册（邮箱验证）、登录、忘记密码、个人资料（头像/昵称/简介）
- **技能管理**：创建/编辑技能、版本管理（版本号强制递增）、发布/下架
- **技能市场**：公开浏览、搜索、作者信息、下载/星标/点赞数展示
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
