# Skill Store 开发任务清单

> 说明：
>
> - `P0`：必须优先完成，直接影响主链路。
> - `P1`：v1 重要能力，建议在主链路完成后立即补齐。
> - `P2`：可延后，不阻塞 v1 上线。
> - 任务状态：`[ ]` 未开始、`[~]` 进行中、`[x]` 已完成
> - 最后更新：2026-03-15

---

## 0. 项目前置确认

- [x] `P0` 确认 Skill 的 `content` 格式：SKILL.md 格式纯文本
- [x] `P1` 确认平台内安装后默认跟随最新版本
- [x] `P1` 确认公开发布无需管理员审核（v1 直接发布）

---

## 1. 项目骨架

### 1.1 仓库结构初始化

- [x] `P0` 规划目录结构：`apps/web`、`apps/api`、`packages/shared`
- [x] `P0` 初始化前端项目（Next.js 15 + shadcn/ui）
- [x] `P0` 初始化后端项目（NestJS）
- [x] `P0` 配置根目录包管理和基础脚本（pnpm workspace）
- [x] `P1` 建立共享类型目录（`packages/shared`）

### 1.2 基础工程配置

- [x] `P0` 配置环境变量文件模板（`.env.example`）
- [x] `P0` 配置统一响应结构（ApiResponseInterceptor）
- [x] `P0` 配置统一错误处理（AllExceptionsFilter）
- [ ] `P0` 配置统一代码风格（ESLint/Prettier）
- [ ] `P1` 配置基础日志方案

### 1.3 数据库基础能力

- [x] `P0` 接入 Prisma
- [x] `P0` 配置 MySQL 连接
- [x] `P0` 建立首个 migration 流程

---

## 2. 用户认证系统

### 2.1 数据模型

- [x] `P0` 建立 `users` 表（含 avatar、bio、isBanned、bannedUntil 字段）
- [x] `P0` 建立 `email_codes` 表
- [x] `P1` 用户角色字段 `role`（USER / ADMIN）

### 2.2 后端认证接口

- [x] `P0` 注册接口
- [x] `P0` 邮箱验证码发送
- [x] `P0` 邮箱验证
- [x] `P0` 登录接口（含封禁检查）
- [x] `P0` 忘记密码
- [x] `P0` 重置密码
- [x] `P0` JWT 鉴权守卫（AccessTokenGuard，含实时封禁检查）
- [x] `P0` Refresh Token 机制
- [x] `P0` 登出接口
- [x] `P0` 获取当前用户接口（/auth/me，含 avatar 字段）

### 2.3 前端认证页面

- [x] `P0` 登录弹窗
- [x] `P0` 注册弹窗
- [x] `P0` 邮箱验证弹窗
- [x] `P0` 忘记密码弹窗
- [x] `P0` 重置密码弹窗
- [x] `P1` URL 参数驱动弹窗（`?auth=login` 等）

---

## 3. 用户个人资料

- [x] `P1` GET /users/me 接口
- [x] `P1` PATCH /users/me 接口（昵称、简介、头像）
- [x] `P1` 头像 base64 存储，5MB 限制
- [x] `P1` GET /users/me/stars 接口（我的星标列表）
- [x] `P1` 账号设置页（/dashboard/settings）
- [x] `P1` 我的星标页（/dashboard/stars）

---

## 4. 技能数据模型与后端 API

### 4.1 数据模型

- [x] `P0` `skills` 表（含 downloadCount、starCount、likeCount）
- [x] `P0` `skill_versions` 表（含 content 字段）
- [x] `P0` `user_installed_skills` 表
- [x] `P1` `skill_stars` 表
- [x] `P1` `skill_likes` 表

### 4.2 技能管理接口（需登录）

- [x] `P0` POST /skills（创建技能）
- [x] `P0` GET /skills/mine（我的技能列表，含统计字段）
- [x] `P0` GET /skills/:id（技能详情，仅作者）
- [x] `P0` PATCH /skills/:id（更新技能信息）
- [x] `P0` DELETE /skills/:id（删除技能）
- [x] `P0` POST /skills/:id/versions（创建版本，含递增校验）
- [x] `P0` GET /skills/:id/versions（版本列表，含 content）
- [x] `P0` POST /skills/:id/versions/:versionId/publish（发布版本）

### 4.3 公开技能接口

- [x] `P0` GET /skills/public（公开技能列表，含统计字段）
- [x] `P0` GET /skills/public/:slug（技能详情，含统计字段）
- [x] `P1` POST /skills/public/:slug/star（星标切换，防自赞）
- [x] `P1` POST /skills/public/:slug/like（点赞切换，防自赞）

---

## 5. 前端技能管理页面

- [x] `P0` /dashboard/skills（我的技能列表）
- [x] `P0` /dashboard/skills/new（新建技能表单）
- [x] `P0` /dashboard/skills/[id]（技能编辑器，三 Tab：基本信息/技能内容/版本历史）
- [x] `P0` 版本内容编辑器（首次预填模板，有版本时显示最新内容）
- [x] `P0` 保存成功/失败反馈（3秒自动消失）

---

## 6. 公开市场

- [x] `P0` /skills 技能市场页（卡片网格，含作者头像/统计数）
- [x] `P0` /skills/[slug] 技能详情页
- [x] `P1` 星标/点赞交互按钮（SkillActions 组件）
- [ ] `P1` 关键词搜索
- [ ] `P1` 标签筛选
- [ ] `P0` 平台内安装按钮（接口已有表结构，前端待接）
- [ ] `P1` 我的安装记录页

---

## 7. 控制台

- [x] `P0` /dashboard 控制台（统计概览 + 技能列表 + 快捷入口）
- [x] `P1` 5格数据统计：总技能/已发布/总下载/星标/点赞
- [x] `P1` 快捷入口：创建技能/技能市场/我的星标/账号设置

---

## 8. 管理后台

- [x] `P0` RolesGuard + @Roles() 装饰器
- [x] `P0` POST /admin/setup（首个管理员初始化，需 ADMIN_SETUP_SECRET）
- [x] `P1` GET /admin/stats（平台统计）
- [x] `P1` GET /admin/users（用户列表，含封禁状态）
- [x] `P1` PATCH /admin/users/:id/role（角色切换）
- [x] `P1` PATCH /admin/users/:id/ban（封禁，可控时长）
- [x] `P1` PATCH /admin/users/:id/unban（解封）
- [x] `P1` GET /admin/skills（技能列表，含状态筛选）
- [x] `P1` PATCH /admin/skills/:id/archive（强制下架）
- [x] `P1` PATCH /admin/skills/:id/restore（恢复）
- [x] `P1` DELETE /admin/skills/:id（删除技能）
- [x] `P1` /admin 管理后台页面（概览+用户管理+技能管理）
- [ ] `P2` 操作日志记录与查看

---

## 9. UI/UX 优化

- [x] `P1` 深色/浅色主题（localStorage 持久化，防 FOUC）
- [x] `P1` 固定导航栏（backdrop-blur 磨砂玻璃）
- [x] `P1` 下拉菜单磨砂玻璃效果（DropdownMenu + Select）
- [x] `P1` 所有数据页骨架屏（loading.tsx）
- [x] `P1` Nav 高亮当前路由
- [x] `P1` 技能市场右下角技能总数悬浮气泡
- [x] `P1` 关闭 Next.js devIndicators
- [x] `P1` 用户头像显示（Nav + 市场页作者 + 管理后台）

---

## 10. API Key 与第三方集成（待做）

- [ ] `P0` 建立 `api_clients` 表
- [ ] `P0` 创建/列出/禁用 API Key 接口
- [ ] `P0` API Key 仅明文展示一次，数据库存哈希
- [ ] `P0` GET /api/v1/skills（x-api-key 鉴权）
- [ ] `P0` GET /api/v1/skills/:slug
- [ ] `P1` 限流
- [ ] `P0` API Key 管理页面

---

## 11. 安全与质量（待做）

- [x] `P0` 统一输入校验（class-validator）
- [x] `P0` 统一权限校验
- [x] `P0` 响应不泄露敏感字段
- [ ] `P1` 常见安全头配置（helmet）
- [ ] `P1` CSRF 防护
- [ ] `P0` 核心链路单元测试
- [ ] `P0` API 文档（Swagger）

---

## 12. v1 最小上线清单

- [x] 用户注册、邮箱验证、登录、找回密码
- [x] 技能创建、编辑、版本管理、发布
- [x] 公开技能列表页、详情页
- [x] 星标、点赞互动
- [x] 管理后台（用户管理、技能管理、封禁）
- [ ] 平台内安装能力
- [ ] API Key 管理与第三方读取接口
- [ ] 限流与安全头
- [ ] 核心链路测试
- [ ] API 文档
