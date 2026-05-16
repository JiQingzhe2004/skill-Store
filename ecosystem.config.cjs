/**
 * PM2 配置（1Panel "Node.js 项目" 也兼容）
 * 启动：pm2 start ecosystem.config.cjs
 * 重启：pm2 restart ecosystem.config.cjs
 * 查看：pm2 status / pm2 logs
 *
 * 第一次部署时，API 在没有 apps/api/data/runtime.json 的情况下会进入 SETUP 模式，
 * 用浏览器访问 web 即可看到安装向导。提交后 API 会自动 exit(0)，PM2 自动重启进入正常模式。
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
