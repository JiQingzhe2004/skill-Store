/**
 * PM2 配置（开发 / 直接从仓库部署用）
 *
 * 生产部署推荐用打包后的 release/skill-store/ecosystem.config.cjs：
 *   pnpm release            构建并打 release/skill-store-<version>.tar.gz
 *   上传 tar.gz 到服务器
 *   tar -xzf skill-store-<version>.tar.gz && cd skill-store
 *   ./install.sh            （Linux/macOS；Windows 用 install.ps1）
 *
 * 第一次启动 API 会进入 SETUP 模式，浏览器访问完成安装向导即可。
 */
module.exports = {
  apps: [
    {
      name: 'skill-store-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'skill-store-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
        API_BASE_URL: 'http://localhost:3001',
      },
    },
  ],
}
