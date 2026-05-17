# Skill Store

Skill Store 是一个面向中文用户的 AI 技能市场平台，支持技能发布、浏览、安装、互动（星标/点赞）和管理员后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 App Router + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + Prisma + MySQL |
| 认证 | JWT + HttpOnly Cookie（Access + Refresh Token）|
| 包管理 | pnpm workspace（monorepo）|

## 目录结构

```
skill-Store/
├── apps/
│   ├── web/                # Next.js 前端
│   └── api/                # NestJS 后端
├── packages/
│   └── shared/             # 共享类型与表单 schema
├── scripts/
│   ├── package.mjs         # 打 release 包（含前后端 + 安装脚本）
│   ├── prisma-runner.mjs   # Prisma 命令包装
│   └── promote-admin.mjs   # 命令行提升管理员
├── ecosystem.config.cjs    # 仓库内 PM2 配置（release 包另带一份）
└── todo.md
```

## 环境要求

- Node.js 20+
- pnpm 9+
- MySQL 8+（生产）/ MySQL 5.7+ 也可

## 本地开发

```bash
pnpm install
cp .env.example .env          # 改 DATABASE_URL / SHADOW_DATABASE_URL
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm dev                      # 同时拉起前后端，带热重载
```

启动后：
- 前端：http://localhost:3000
- 后端：http://localhost:3001

> 本地开发时根目录 `.env` 里有 `DATABASE_URL` 等变量，API 直接读取，不会进入 setup 向导。

## 生产部署（推荐：一键打包 + 一键安装）

### 第 1 步：在开发机器上打包

```bash
pnpm release
```

会做的事：
1. 构建 API（`nest build`）和 Web（`next build` standalone 模式）
2. 把所有产物 + 安装脚本组装到 `release/skill-store/`
3. 打成 `release/skill-store-<version>.tar.gz`（约 60 MB）

### 第 2 步：在服务器上准备 MySQL

在 1Panel 或外部建好 MySQL，创建两个库 + 一个用户：

```sql
CREATE DATABASE skill_store CHARACTER SET utf8mb4;
CREATE DATABASE skill_store_shadow CHARACTER SET utf8mb4;
CREATE USER 'skill_store'@'%' IDENTIFIED BY '你的密码';
GRANT ALL ON skill_store.* TO 'skill_store'@'%';
GRANT ALL ON skill_store_shadow.* TO 'skill_store'@'%';
FLUSH PRIVILEGES;
```

### 第 3 步：上传并一键安装

把 `skill-store-<version>.tar.gz` 上传到服务器，然后：

```bash
tar -xzf skill-store-*.tar.gz
cd skill-store
./install.sh                    # Linux / macOS
# Windows：powershell -ExecutionPolicy Bypass -File install.ps1
```

`install.sh` 会自动：
- 检测并安装 Node.js 20+（系统没装时，apt / yum / dnf / pacman / brew 都支持）
- 全局装 pm2（没装时）
- 在 `api/` 跑 `npm install --omit=dev` 拉运行时依赖（含 Prisma 引擎，自动匹配目标平台）
- 用 pm2 启动 `skill-store-api`（3001）和 `skill-store-web`（3000）
- 调 `pm2 startup` 注册开机自启

### 第 4 步：浏览器完成首次配置

把域名反代到 `localhost:3000`，浏览器打开后会自动跳到 `/setup` 向导：
1. **数据库**：填上一步创建的 MySQL 信息 → 点 "测试连接"
2. **站点信息**：APP_URL（前端访问地址）+ 管理员初始化密钥（自动生成，请保存）
3. 点 "确认并开始安装" — 后端写入 `api/data/runtime.json`，跑 `prisma migrate deploy`，自动重启进入正常模式

向导后自动重新加载，注册首个账号 → 访问 `/setup-admin` → 输入密钥即可成为管理员。

> **重新初始化**：删掉 `api/data/runtime.json` 然后 `pm2 restart skill-store-api`，浏览器再次进入向导。

## 常用命令

```bash
pnpm dev                      # 同时启动前后端（开发，热重载）
pnpm dev:web                  # 只启动前端
pnpm dev:api                  # 只启动后端
pnpm build                    # 构建前后端
pnpm release                  # 构建并打 release/skill-store-<version>.tar.gz
pnpm release:fast             # 跳过构建（用现有 dist 直接打包）
pnpm prisma:generate          # 生成 Prisma Client
pnpm prisma:migrate:dev       # 开发迁移（需 .env 里有 DATABASE_URL）
pnpm prisma:migrate:deploy    # 生产迁移
pnpm admin:promote <邮箱>      # 命令行提升管理员（不走向导也可以用）
```

## API 文档

- **Swagger UI**：`http://localhost:3001/api/docs`（或前端代理 `/api/docs`）
- **OpenAPI JSON**：`/api/docs-json`
- 关闭：环境变量 `SWAGGER_ENABLED=false`

## 主要功能

- **用户系统**：注册（无需邮箱验证，注册即登录）、登录、个人资料
- **技能管理**：创建/编辑、版本管理（强制递增）、发布/下架
- **技能市场**：浏览、搜索、标签筛选、下载/星标/点赞数
- **平台内安装**：登录用户一键安装
- **外部 API**：API Key + `/api/v1/skills` 只读接口
- **互动**：星标、点赞、评论
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
- `release/` 目录不进 git（已在 .gitignore）
