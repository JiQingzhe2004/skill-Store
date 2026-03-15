# Skill Store API 文档

Base URL: `http://localhost:3001/api`

所有响应格式：
```json
{ "success": true, "data": {...} }
{ "success": false, "data": null, "error": { "code": "ERROR_CODE", "message": "描述" } }
```

需要认证的接口请在 Cookie 中携带 `access_token`（登录后自动设置）。

---

## 认证 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 注册 | 否 |
| POST | `/auth/login` | 登录 | 否 |
| POST | `/auth/logout` | 登出 | 是 |
| POST | `/auth/refresh` | 刷新 Token | 否（需 refresh_token Cookie）|
| POST | `/auth/verify-email` | 验证邮箱 | 否 |
| POST | `/auth/resend-verification-code` | 重发验证码 | 否 |
| POST | `/auth/forgot-password` | 忘记密码 | 否 |
| POST | `/auth/reset-password` | 重置密码 | 否 |

### POST /auth/register
```json
{ "username": "string", "email": "string", "password": "string" }
```

### POST /auth/login
```json
{ "email": "string", "password": "string" }
```

---

## 技能（公开）`/api/skills/public`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/skills/public` | 获取公开技能列表 | 否 |
| GET | `/skills/public/:slug` | 获取技能详情 | 否 |
| GET | `/skills/public/:slug/files` | 获取技能最新版本文件列表 | 否 |
| GET | `/skills/public/:slug/download` | 下载技能 ZIP 包 | 否 |
| POST | `/skills/public/:slug/download/count` | 记录下载计数 | 否 |
| POST | `/skills/public/:slug/star` | 收藏/取消收藏 | 是 |
| POST | `/skills/public/:slug/like` | 点赞/取消点赞 | 是 |
| GET | `/skills/public/:slug/me` | 获取当前用户与技能的交互状态 | 是 |
| POST | `/skills/public/:slug/install` | 安装技能（记录安装） | 是 |

### GET /skills/public
查询参数：`page`（默认 1）、`pageSize`（默认 20）

### GET /skills/public/:slug/download
直接返回 ZIP 文件流，`Content-Disposition: attachment; filename*=UTF-8''技能名-v版本号.zip`

---

## 技能（需登录）`/api/skills`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/skills` | 创建技能 | 是 |
| GET | `/skills/mine` | 获取我的技能列表 | 是 |
| GET | `/skills/:id` | 获取技能详情（含草稿） | 是 |
| PATCH | `/skills/:id` | 更新技能信息 | 是 |
| DELETE | `/skills/:id` | 删除技能 | 是 |
| POST | `/skills/:id/versions` | 创建新版本（富文本） | 是 |
| POST | `/skills/:id/versions/upload` | 上传 ZIP 版本 | 是 |
| GET | `/skills/:id/versions` | 获取版本列表 | 是 |
| POST | `/skills/:id/versions/:versionId/publish` | 发布版本 | 是 |
| GET | `/skills/:id/versions/:versionId/files` | 获取版本文件列表 | 是 |
| GET | `/skills/:id/versions/:versionId/files/:fileId` | 获取单个文件内容 | 是 |

### POST /skills
```json
{ "name": "string", "slug": "string", "description": "string", "tags": "string", "visibility": "PUBLIC|UNLISTED|PRIVATE" }
```

### POST /skills/:id/versions
```json
{ "version": "1.0.0", "content": "string(HTML/Markdown)", "changelog": "string(可选)" }
```

### POST /skills/:id/versions/upload
`multipart/form-data`：`file`（ZIP 文件）、`version`（版本号）、`changelog`（可选）

---

## 用户 `/api/users`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/users/me` | 获取当前用户信息 | 是 |
| PATCH | `/users/me` | 更新个人信息 | 是 |
| GET | `/users/me/stars` | 获取我收藏的技能 | 是 |

---

## 管理后台 `/api/admin`

> 需要 ADMIN 角色

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admin/setup` | 初始化管理员账号 |
| GET | `/admin/stats` | 获取统计数据 |
| GET | `/admin/users` | 获取用户列表 |
| PATCH | `/admin/users/:id/role` | 修改用户角色 |
| PATCH | `/admin/users/:id/ban` | 封禁用户 |
| PATCH | `/admin/users/:id/unban` | 解封用户 |
| GET | `/admin/skills` | 获取所有技能列表 |
| DELETE | `/admin/skills/:id` | 删除技能 |
| PATCH | `/admin/skills/:id/archive` | 归档技能 |
| PATCH | `/admin/skills/:id/restore` | 恢复技能 |

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未登录或 Token 过期 |
| `FORBIDDEN` | 无权限 |
| `NOT_FOUND` | 资源不存在 |
| `CONFLICT` | 资源冲突（如版本号重复）|
| `VERSION_MUST_INCREMENT` | 版本号必须递增 |
| `NO_PUBLISHED_VERSION` | 无已发布版本 |
| `VERSION_ALREADY_PUBLISHED` | 版本已发布 |
| `INTERNAL_SERVER_ERROR` | 服务器内部错误 |
