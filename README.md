# Skill Store

Skill Store 是一个面向中文用户的 AI 技能市场平台，支持技能发布、浏览、安装、互动（星标/点赞）和管理员后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 App Router + Tailwind CSS + shadcn/ui |
| 后端 | NestJS 11 + Prisma + MySQL |
| 邮件 | nodemailer（HTML 模板，注册验证码 / 忘记密码）|
| 头像 | sharp 服务端压缩，文件存储到 `apps/api/data/avatars/` |
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
│   ├── package.mjs         # 打 release 包（含前后端 + 安装/建库脚本）
│   ├── prisma-runner.mjs   # Prisma 命令包装
│   └── promote-admin.mjs   # 命令行提升管理员
├── ecosystem.config.cjs    # 仓库内 PM2 配置（release 包另带一份）
└── README.md
```

## 环境要求

- Node.js 22+（LTS Jod）
- pnpm 10+
- MySQL 8+（推荐）/ 5.7+ 也可
- 本地开发邮件可用 [Mailpit](https://github.com/axllent/mailpit)（host=localhost port=1025，无需账号）

## 本地开发

```bash
pnpm install
cp .env.example .env          # 改 DATABASE_URL / SHADOW_DATABASE_URL / SMTP_*
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm dev                      # 同时拉起前后端，带热重载
```

启动后：
- 前端：http://localhost:3000
- 后端：http://localhost:3001

> 本地开发时根目录 `.env` 里有 `DATABASE_URL` 等变量，API 直接读取，不会进入 setup 向导。

## 生产部署（推荐：一键打包 + 一键建库 + 一键安装）

### 第 1 步：在开发机器上打包

```bash
pnpm release
```

会做的事：
1. 构建 API（`nest build`）和 Web（`next build` standalone 模式）
2. 把所有产物组装到 `release/skill-store/app/`
3. 在 `release/skill-store/` 根目录写入 `install.sh` / `install.ps1` / `create-db.sh` / `create-db.ps1` / `README.md`
4. 打成 `release/skill-store-<version>.tar.gz`

解压后的目录布局：

```
skill-store/
├── app/                          # 部署内容（api + web + ecosystem.config.cjs）
├── install.sh / install.ps1      # 一键部署
├── create-db.sh / create-db.ps1  # 一键建库（root 密码即可）
├── scripts/promote-admin.mjs
└── README.md
```

### 第 2 步：在服务器上上传 + 一键建库 + 一键安装

```bash
tar -xzf skill-store-*.tar.gz
cd skill-store

./create-db.sh                  # 输入 MySQL root 密码，建主库 + 影子库 + 应用账号
./install.sh                    # 装 Node 22 + pm2，启动 app/
# Windows：powershell -ExecutionPolicy Bypass -File create-db.ps1 && powershell -ExecutionPolicy Bypass -File install.ps1
```

`install.sh` 会自动：
- 检测并安装 Node.js 22+（apt / yum / dnf / pacman / brew 都支持）
- 全局装 pm2
- 在 `app/api` 跑 `npm install --omit=dev` 拉运行时依赖（含 Prisma 引擎 + sharp 原生二进制）
- 用 pm2 启动 `skill-store-api`（3001）和 `skill-store-web`（3000）
- 调 `pm2 startup` 注册开机自启

反向代理（Nginx / Caddy / 1Panel）请自行配置，把域名反代到 `localhost:3000` 即可。

### 第 3 步：浏览器完成首次配置

浏览器打开 `http://<服务器 IP>:3000` 会自动跳到 `/setup` 向导：
1. **数据库**：填入 `create-db.sh` 输出的连接信息 → 测试连接
2. **SMTP**：填入邮件服务器（用于注册验证码 / 忘记密码） → 可发测试邮件
3. **站点信息**：APP_URL（前端访问地址）+ 管理员初始化密钥（自动生成，请保存）
4. **完成安装** — 后端写入 `app/api/data/runtime.json`，跑 `prisma migrate deploy`，自动重启进入正常模式

向导后注册首个账号 → 邮箱验证 → 访问 `/setup-admin` 输入初始化密钥成为管理员。

> **重新初始化**：删掉 `app/api/data/runtime.json` 然后 `pm2 restart skill-store-api`，浏览器再次进入向导。

## 常用命令

```bash
pnpm dev                      # 同时启动前后端（开发，热重载）
pnpm dev:web                  # 只启动前端
pnpm dev:api                  # 只启动后端
pnpm build                    # 构建前后端
pnpm release                  # 构建并打 release/skill-store-<version>.tar.gz
pnpm release:fast             # 跳过构建（用现有 dist 直接打包）
pnpm prisma:generate          # 生成 Prisma Client
pnpm prisma:migrate:dev       # 开发迁移
pnpm prisma:migrate:deploy    # 生产迁移
pnpm admin:promote <邮箱>      # 命令行提升管理员
```

## API 文档

- **Swagger UI**：`http://localhost:3001/api/docs`（或前端代理 `/api/docs`）
- **OpenAPI JSON**：`/api/docs-json`
- 关闭：环境变量 `SWAGGER_ENABLED=false`

## 主要功能

- **用户系统**：注册（邮箱验证码激活）、登录、忘记密码、个人资料
- **头像**：单独上传接口，超过 2MB 自动用 sharp 压缩到 1MB 内，存为 `/api/avatars/<id>.<ext>`
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
- Prisma shadow database 必须预先创建（`create-db.sh` 会一起建好）
- `release/` 目录不进 git（已在 .gitignore）
- 密码做了 NFKC 标准化，处理输入法把数字打成全角字符（`１２３` vs `123`）等场景
