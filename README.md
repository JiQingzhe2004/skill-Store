# Skill Store

一个从零搭建的 Skill Marketplace 骨架仓库。当前第一轮实现只覆盖：

- monorepo 基础结构
- `NestJS + Prisma + MySQL` 后端骨架
- `Next.js App Router` 前端骨架
- 邮箱注册、验证、登录、续期、登出、找回密码、重置密码
- 本地 `MailHog` 邮件调试

## 目录结构

- `apps/web`：前端站点
- `apps/api`：后端服务
- `packages/shared`：共享类型和表单 schema

## 本地启动

1. 复制 `.env.example` 为 `.env`
2. 启动基础服务：`pnpm db:up`
3. 安装依赖：`pnpm install`
4. 生成 Prisma Client：`pnpm prisma:generate`
5. 执行迁移：`pnpm prisma:migrate:dev`
6. 启动开发环境：`pnpm dev`

说明：`Prisma` 命令会自动读取仓库根目录的 `.env`，不需要再额外复制一份到 `apps/api`。

如果你之前已经启动过 MySQL 容器，新增的 shadow database 初始化脚本不会自动补跑。此时需要二选一：

- 重建本地 MySQL 数据卷：`docker compose down -v` 后再执行 `pnpm db:up`
- 或手动执行一次建库和授权，把 `skill_store_shadow` 建出来

## 默认端口

- Web：`3000`
- API：`3001`
- MySQL：`3306`
- MailHog SMTP：`1025`
- MailHog UI：`8025`

## 当前范围

本轮不包含技能市场、API Key、管理后台、OAuth、多设备会话撤销。
