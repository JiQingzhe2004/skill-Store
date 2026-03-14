# Docker 完整容器化方案

## 目标

将整个应用（前端 + 后端 + 数据库 + 邮件）全部容器化，支持开发热重载和生产构建两种模式。

## 文件结构规划

```
skill-Store/
├── docker-compose.yml          # 生产模式
├── docker-compose.dev.yml      # 开发模式（热重载）
├── docker-compose.base.yml     # 公共服务（mysql + mailpit）
├── apps/
│   ├── api/
│   │   └── Dockerfile          # NestJS 多阶段构建
│   └── web/
│       └── Dockerfile          # Next.js standalone 模式
└── .dockerignore
```

## 开发模式（docker-compose.dev.yml）

命令：`pnpm docker:dev`

- **api** 容器：
  - 挂载 `apps/api/src` 和 `apps/api/prisma` 为 volume
  - 启动命令：`nest start --watch`
  - 端口：3001
  - 启动前自动跑 `prisma migrate dev`

- **web** 容器：
  - 挂载 `apps/web` 为 volume
  - 启动命令：`next dev`
  - 端口：3000
  - 热重载依赖 Next.js 自带机制

- **mysql**：端口 3306，数据持久化到 volume
- **mailpit**：端口 1025（SMTP）+ 8025（UI）

## 生产模式（docker-compose.yml）

命令：`pnpm docker:prod`

- **api** 多阶段 Dockerfile：
  1. `builder` 阶段：安装依赖 + `nest build`
  2. `runner` 阶段：只复制 `dist/` + `node_modules`（生产依赖）
  - 启动前自动跑 `prisma migrate deploy`
  - 端口：3001

- **web** Dockerfile：
  1. `builder` 阶段：`next build`（开启 `output: standalone`）
  2. `runner` 阶段：只复制 `.next/standalone/`
  - 端口：3000

- **mysql**：数据持久化
- 不含 mailpit（生产用真实 SMTP）

## 数据持久化

```yaml
volumes:
  mysql_data:      # MySQL 数据
  mysql_logs:      # MySQL 日志
  api_logs:        # NestJS 应用日志（规划中）
```

## 网络

所有服务在同一 Docker network（`skill-store-network`），容器间通过服务名通信：
- web → api：`http://api:3001`
- api → mysql：`mysql:3306`
- api → mailpit：`mailpit:1025`

## 环境变量

开发：读取 `apps/api/.env`
生产：通过 `docker-compose.yml` 的 `env_file` 或 `-e` 注入

## next.config.ts 需要修改

```ts
const nextConfig: NextConfig = {
  output: 'standalone',  // 生产 Docker 必须
  ...
}
```

## package.json 需要新增脚本

```json
"docker:dev": "docker compose -f docker-compose.dev.yml up --build",
"docker:prod": "docker compose up --build",
"docker:down": "docker compose down",
"docker:down:dev": "docker compose -f docker-compose.dev.yml down"
```

## 实施顺序

1. 修改 `apps/web/next.config.ts`，加 `output: 'standalone'`
2. 写 `apps/api/Dockerfile`
3. 写 `apps/web/Dockerfile`
4. 写 `.dockerignore`
5. 重构 `docker-compose.yml`（加 api + web）
6. 新建 `docker-compose.dev.yml`
7. 更新根目录 `package.json` 脚本
8. 测试开发模式
9. 测试生产模式
10. 更新 README

## 注意事项

- pnpm workspace 在 Docker 中需要特殊处理（需要复制 `pnpm-workspace.yaml` 和 `pnpm-lock.yaml`）
- NestJS 生产构建需要 `@nestjs/cli` 在 devDependencies
- Next.js standalone 模式下静态文件需要手动复制 `public/` 目录
- Prisma Client 需要在容器内重新生成（`prisma generate`）
- 开发模式挂载 node_modules 时要用匿名 volume 避免覆盖容器内安装的依赖
