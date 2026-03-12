# Skill Store

Skill Store 是一个面向中文用户的技能市场项目。当前第一轮实现聚焦在“项目骨架 + 认证系统”，用于打通从注册到登录、找回密码、进入受保护页面的完整闭环。

## 当前范围

- Monorepo：`apps/web`、`apps/api`、`packages/shared`
- 前端：`Next.js App Router + Tailwind CSS + shadcn/ui`
- 后端：`NestJS + Prisma + MySQL`
- 认证：`JWT + HttpOnly Cookie`
- 邮件：`SMTP 抽象 + MailHog`

本轮暂不包含技能市场、技能安装流程、API Key 管理、管理后台、OAuth、多设备会话管理。

## 目录结构

- `apps/web`：前端应用
- `apps/api`：后端 API 与认证逻辑
- `packages/shared`：共享类型与表单校验 schema
- `docker/mysql/init`：MySQL 初始化脚本（包含 shadow database）
- `scripts/prisma-runner.mjs`：Prisma 命令包装，解决 monorepo 下 `.env` 读取问题

## 环境要求

- Node.js 20+
- `pnpm`
- Docker Desktop

## 快速开始

1. 在根目录安装全部工作区依赖：`pnpm install`
2. 复制环境变量文件：将 `.env.example` 复制为 `.env`
3. 启动本地 MySQL 和 MailHog：`pnpm db:up`
4. 生成 Prisma Client：`pnpm prisma:generate`
5. 执行开发迁移：`pnpm prisma:migrate:dev`
6. 启动前后端开发服务：`pnpm dev`

启动后默认端口：

- Web：`http://localhost:3000`
- API：`http://localhost:3001`
- MailHog UI：`http://localhost:8025`

## 环境变量

项目使用以下环境变量：

- `APP_URL`
- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

开发默认值可参考 `.env.example`。

## Prisma 说明

`pnpm prisma:migrate:dev` 会通过 `apps/api/package.json` 中的脚本调用 `scripts/prisma-runner.mjs`，从根目录加载 `.env`。

MySQL 迁移依赖 shadow database，因此还需要：

- `.env` 中配置 `SHADOW_DATABASE_URL`
- Docker 初始化脚本提前创建并授权 `skill_store_shadow`

如果你之前用错误配置启动过数据库，建议重建本地数据卷后再迁移：

- `docker compose down -v`
- `pnpm db:up`

## 当前页面

- `/register`
- `/verify-email`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`

其中 `/dashboard` 是当前最小受保护页面，用于确认登录态和用户信息链路已经打通。

## 默认语言

- 前端默认语言固定为 `zh-CN`
- 消息字典位于 `apps/web/messages`
- 当前已预留最小国际化结构，但默认直接加载中文文案
- 新页面和新组件不要直接硬编码英文文案

## 常用命令

- `pnpm dev`：同时启动前后端开发服务
- `pnpm dev:web`：只启动前端
- `pnpm dev:api`：只启动后端
- `pnpm db:up`：启动 MySQL 和 MailHog
- `pnpm db:down`：停止本地依赖服务
- `pnpm prisma:generate`：生成 Prisma Client
- `pnpm prisma:migrate:dev`：执行开发迁移
- `pnpm --filter @skill-store/web test`：运行前端测试
- `pnpm --filter @skill-store/api test`：运行后端测试
