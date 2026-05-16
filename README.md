# Skill Store

Skill Store 是一个面向中文用户的 AI 技能市场平台，支持技能发布、浏览、安装、互动（星标/点赞）和管理员后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 App Router + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + Prisma + MySQL |
| 认证 | JWT + HttpOnly Cookie（Access + Refresh Token）|
| 邮件 | SMTP（自带 nodemailer）|
| 包管理 | pnpm workspace（monorepo）|

## 目录结构

```
skill-Store/
├── apps/
│   ├── web/          # Next.js 前端
│   └── api/          # NestJS 后端
├── packages/
│   └── shared/       # 共享类型与表单 schema
├── scripts/
│   └── prisma-runner.mjs  # Prisma 命令包装
├── ecosystem.config.cjs   # PM2 配置
└── todo.md
```

## 环境要求

- Node.js 20+
- pnpm 9+
- MySQL 8+（生产）/ MySQL 5.7+ 也可

## 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 准备 MySQL（用本地或远程都行），创建两个库：
#    skill_store, skill_store_shadow

# 3. 写本地开发用的 .env（仓库根目录）
cp .env.example .env
# 改 DATABASE_URL / SHADOW_DATABASE_URL 指向你的 MySQL

# 4. 生成 Prisma Client
pnpm prisma:generate

# 5. 跑迁移
pnpm prisma:migrate:dev

# 6. 启动前后端（带热重载）
pnpm dev
```

启动后：
- 前端：http://localhost:3000
- 后端：http://localhost:3001

> 本地开发时，根目录 `.env` 里有 `DATABASE_URL` 等变量，API 直接读取，不需要走 setup 向导。

## 生产部署（推荐：PM2 + 1Panel）

部署目标：**不用 Docker、不手改 `.env`**。第一次访问会跳安装向导，浏览器里点几下就配好。

### 1. 准备 MySQL

在 1Panel 或外部建好 MySQL 实例，创建两个数据库 + 一个用户（同时拥有两个库的权限）：

```sql
CREATE DATABASE skill_store CHARACTER SET utf8mb4;
CREATE DATABASE skill_store_shadow CHARACTER SET utf8mb4;
CREATE USER 'skill_store'@'%' IDENTIFIED BY '你的密码';
GRANT ALL ON skill_store.* TO 'skill_store'@'%';
GRANT ALL ON skill_store_shadow.* TO 'skill_store'@'%';
FLUSH PRIVILEGES;
```

### 2. 部署代码

```bash
git clone <repo> skill-store
cd skill-store
pnpm install
pnpm prisma:generate
pnpm build
```

### 3. 启动

```bash
# 全局装 PM2（如果没装过）
npm i -g pm2

# 启动两个进程
pm2 start ecosystem.config.cjs

# 保存进程列表 + 设置开机自启
pm2 save
pm2 startup
```

> **1Panel 用户**：1Panel 的 "Node.js 项目" 功能内置 PM2，可以直接在面板里点 "添加项目" 指向仓库根目录，启动命令选 `pm2 start ecosystem.config.cjs`。或者添加两个站点分别指向 `apps/api/dist/main.js`（端口 3001）和 `apps/web`（执行 `next start -p 3000`）。

### 4. 浏览器完成安装

在 nginx / 1Panel 反向代理上把域名指到 `localhost:3000`，然后浏览器访问。

未初始化时所有路径自动跳到 `/setup`，按向导填写：
1. **数据库**：上一步创建好的 MySQL 连接信息（地址、端口、用户、密码、库名）→ 点 "测试连接"
2. **SMTP**：邮件服务器（注册验证邮件、找回密码会用），暂时没有可填占位
3. **站点信息**：APP_URL（前端访问地址）+ 管理员初始化密钥（自动生成，请保存）

点 "确认并开始安装"：
- 配置写入 `apps/api/data/runtime.json`（已在 .gitignore）
- 自动执行 `prisma migrate deploy`
- API 进程 `exit(0)` 触发 PM2 重启，进入正常模式
- 向导界面会自动检测重启完成，提示注册首个账号

### 5. 创建管理员

注册首个账号后，访问 `/setup-admin`，输入安装向导里那个密钥即可成为管理员。

## 安装向导背后做了什么

- 写 `apps/api/data/runtime.json`（包含 DATABASE_URL、JWT 密钥、SMTP、APP_URL、ADMIN_SETUP_SECRET）
- API 启动时优先读取此文件并注入 `process.env`，再启动 Nest 应用
- 文件不存在时进入 **SETUP 模式**：只暴露 `/api/setup/*`，不挂载 Prisma 等模块
- 文件存在且 `setupComplete: true` 时进入 **正常模式**：完整 AppModule 启动

如果想重新走一遍向导，删掉 `apps/api/data/runtime.json` 然后 `pm2 restart skill-store-api` 即可。

## 常用命令

```bash
pnpm dev                      # 同时启动前后端（开发）
pnpm dev:web                  # 只启动前端
pnpm dev:api                  # 只启动后端
pnpm build                    # 构建前后端生产产物
pnpm start                    # 同时跑构建好的前后端（前台）
pnpm prisma:generate          # 生成 Prisma Client
pnpm prisma:migrate:dev       # 开发迁移（需 .env 里有 DATABASE_URL）
pnpm prisma:migrate:deploy    # 生产迁移
pnpm admin:promote <email>    # 命令行提升管理员（不走向导也可以用）
```

## API 文档

- **Swagger UI**：`http://localhost:3001/api/docs`（或前端代理 `/api/docs`）
- **OpenAPI JSON**：`/api/docs-json`
- 关闭：环境变量 `SWAGGER_ENABLED=false`

## 主要功能

- **用户系统**：注册（邮箱验证）、登录、忘记密码、个人资料
- **技能管理**：创建/编辑、版本管理（强制递增）、发布/下架
- **技能市场**：浏览、搜索、标签筛选、下载/星标/点赞数
- **平台内安装**：登录用户一键安装
- **外部 API**：API Key + `/api/v1/skills` 只读接口
- **互动**：星标、点赞
- **管理后台**：用户/角色/封禁/技能管理

## Commit 规范

中文 commit message：

```
<类型>: <简短描述>

<详细说明（可选）>
```

类型：`feat` / `fix` / `refactor` / `chore` / `style` / `perf`

## 开发注意事项

- `.env` 只用于本地开发，不提交
- 生产环境用 `apps/api/data/runtime.json`（由安装向导生成，不提交）
- Prisma shadow database 必须预先创建
