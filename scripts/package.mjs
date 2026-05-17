#!/usr/bin/env node
/**
 * 打包发布制品。产出：
 *   release/skill-store/         — 自包含的部署目录（含 api / web / 启动脚本）
 *   release/skill-store-<ver>.tar.gz — 同上的压缩包，方便上传服务器
 *
 * 站长只需把 tar.gz 上传到服务器，解压后跑 `./install.sh`（Linux/macOS）
 * 或 `powershell -ExecutionPolicy Bypass -File install.ps1`（Windows）即可。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync, readdirSync, chmodSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const releaseRoot = path.join(repoRoot, 'release')
const stageRoot = path.join(releaseRoot, 'skill-store')

const log = (...args) => console.log('[package]', ...args)
const fail = (msg, err) => {
  console.error('[package] ERROR:', msg)
  if (err) console.error(err)
  process.exit(1)
}

function run(cmd, args, opts = {}) {
  log(`$ ${cmd} ${args.join(' ')}${opts.cwd ? ` (cwd: ${path.relative(repoRoot, opts.cwd) || '.'})` : ''}`)
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  })
  if (result.status !== 0) {
    fail(`command failed: ${cmd} ${args.join(' ')} (exit ${result.status})`)
  }
}

function copyDir(src, dest, { filter } = {}) {
  if (!existsSync(src)) return
  cpSync(src, dest, {
    recursive: true,
    dereference: true,
    filter: filter ?? (() => true),
  })
}

function ensureCleanStage() {
  if (existsSync(stageRoot)) {
    log('cleaning previous stage:', path.relative(repoRoot, stageRoot))
    rmSync(stageRoot, { recursive: true, force: true })
  }
  mkdirSync(stageRoot, { recursive: true })
}

function readPkgVersion() {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
  return pkg.version || '0.0.0'
}

function buildApi() {
  log('building @skill-store/api…')
  run('pnpm', ['--filter', '@skill-store/api', 'build'], { cwd: repoRoot })
}

function buildWeb() {
  log('building @skill-store/web…')
  run('pnpm', ['--filter', '@skill-store/web', 'build'], {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: 'production' },
  })
}

function deployApi() {
  const apiSrc = path.join(repoRoot, 'apps', 'api')
  const apiStage = path.join(stageRoot, 'api')
  log('staging API source →', path.relative(repoRoot, apiStage))

  mkdirSync(apiStage, { recursive: true })
  copyDir(path.join(apiSrc, 'dist'), path.join(apiStage, 'dist'))
  copyDir(path.join(apiSrc, 'prisma'), path.join(apiStage, 'prisma'))

  // 只含 runtime 依赖的 package.json（去掉 devDependencies / 大部分 scripts）
  // install.sh 会在目标机上跑 `npm install --omit=dev` 安装 prod 依赖并触发 prisma generate
  const apiPkg = JSON.parse(readFileSync(path.join(apiSrc, 'package.json'), 'utf8'))
  const prodPkg = {
    name: apiPkg.name,
    version: apiPkg.version,
    private: true,
    main: 'dist/main.js',
    scripts: {
      start: 'node dist/main.js',
    },
    dependencies: apiPkg.dependencies ?? {},
  }
  writeFileSync(path.join(apiStage, 'package.json'), JSON.stringify(prodPkg, null, 2))

  // 预创建 data/ 目录，runtime.json 会写进来
  mkdirSync(path.join(apiStage, 'data'), { recursive: true })
}

function copyWebStandalone() {
  const standaloneSrc = path.join(repoRoot, 'apps', 'web', '.next', 'standalone')
  if (!existsSync(standaloneSrc)) {
    fail('apps/web/.next/standalone 不存在；请先确认 next.config.ts 启用 output: "standalone" 并构建成功')
  }
  const webStage = path.join(stageRoot, 'web')
  log('copying web standalone bundle →', path.relative(repoRoot, webStage))
  // 把 standalone 整个目录变成 web/ —— 内部结构是 apps/web/server.js + node_modules
  copyDir(standaloneSrc, webStage)

  // standalone 不带 static 与 public，需要手动补
  copyDir(
    path.join(repoRoot, 'apps', 'web', '.next', 'static'),
    path.join(webStage, 'apps', 'web', '.next', 'static'),
  )
  copyDir(
    path.join(repoRoot, 'apps', 'web', 'public'),
    path.join(webStage, 'apps', 'web', 'public'),
  )
}

function writeReleaseFiles() {
  // 部署后用的 PM2 配置（路径相对 stageRoot）
  const ecosystem = `/**
 * PM2 配置 —— 由 scripts/package.mjs 自动生成。
 *  pm2 start ecosystem.config.cjs
 *  pm2 restart ecosystem.config.cjs
 *  pm2 logs
 */
module.exports = {
  apps: [
    {
      name: 'skill-store-api',
      cwd: './api',
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
      cwd: './web',
      script: 'apps/web/server.js',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        API_BASE_URL: 'http://localhost:3001',
      },
    },
  ],
}
`
  writeFileSync(path.join(stageRoot, 'ecosystem.config.cjs'), ecosystem)

  // 版本号
  writeFileSync(path.join(stageRoot, 'VERSION'), `${readPkgVersion()}\n`)

  // 部署说明
  const deployReadme = `# Skill Store 部署包

## 一键部署（推荐）

\`\`\`bash
# Linux / macOS
./install.sh

# Windows（PowerShell，管理员）
powershell -ExecutionPolicy Bypass -File install.ps1
\`\`\`

install 脚本会自动：
1. 检测并安装 Node.js 20+（系统未装时）
2. 全局安装 pm2（未装时）
3. 用 pm2 启动 \`skill-store-api\` 与 \`skill-store-web\`
4. 配置 pm2 开机自启
5. 提示你访问 http://server-ip:3000 完成 Web 端安装向导

## 浏览器完成首次安装

部署完成后访问 http://server-ip:3000，自动跳到 /setup 向导：
1. 填写 MySQL 连接信息（站点需提前建好两个库：主库 + shadow 库）
2. 设置 APP_URL（域名）和管理员初始化密钥
3. 点 "确认并开始安装" → 后端自动跑数据库迁移 → 自动重启

之后注册首个账号 → 访问 /setup-admin → 输入初始化密钥成为管理员。

## 目录结构

\`\`\`
.
├── api/                 # NestJS 后端（自包含 node_modules）
│   ├── dist/main.js     # 入口
│   ├── prisma/          # schema + migrations
│   └── data/            # runtime.json（向导生成）
├── web/                 # Next.js 前端 standalone 产物
│   └── apps/web/server.js
├── ecosystem.config.cjs # pm2 配置
├── install.sh / install.ps1
└── VERSION
\`\`\`

## 常用运维命令

\`\`\`bash
pm2 status                            # 进程状态
pm2 logs skill-store-api              # API 日志
pm2 logs skill-store-web              # Web 日志
pm2 restart ecosystem.config.cjs      # 重启全部
node scripts/promote-admin.mjs <邮箱>  # 命令行提升管理员
\`\`\`

## 重新初始化

删除 \`api/data/runtime.json\` 后 \`pm2 restart skill-store-api\`，浏览器会再次进入安装向导。
`
  writeFileSync(path.join(stageRoot, 'README.md'), deployReadme)

  // 拷贝 promote-admin 脚本（已支持读取 runtime.json）
  const scriptsStage = path.join(stageRoot, 'scripts')
  mkdirSync(scriptsStage, { recursive: true })
  // 部署环境下 repoRoot 即 stageRoot；apiRoot 推断为 stageRoot/api。
  // promote-admin.mjs 原本假设 apiRoot = repoRoot/apps/api，所以这里写一份适配的副本。
  const promoteAdmin = `import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const apiRoot = path.join(repoRoot, 'api')

function loadRuntimeConfig() {
  const file = path.join(apiRoot, 'data', 'runtime.json')
  if (!existsSync(file)) return
  try {
    const cfg = JSON.parse(readFileSync(file, 'utf8'))
    const map = {
      databaseUrl: 'DATABASE_URL',
      shadowDatabaseUrl: 'SHADOW_DATABASE_URL',
      jwtAccessSecret: 'JWT_ACCESS_SECRET',
      jwtRefreshSecret: 'JWT_REFRESH_SECRET',
      appUrl: 'APP_URL',
      adminSetupSecret: 'ADMIN_SETUP_SECRET',
    }
    for (const [k, env] of Object.entries(map)) {
      if (cfg[k] && !process.env[env]) process.env[env] = String(cfg[k])
    }
  } catch {}
}

loadRuntimeConfig()

const identifier = process.argv[2]
const force = process.argv.includes('--force')

if (!identifier || identifier.startsWith('-')) {
  console.log('\\n用法: node scripts/promote-admin.mjs <邮箱或用户名> [--force]\\n')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('缺少 DATABASE_URL（未完成安装向导？）')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const prismaClientPath = require.resolve('@prisma/client', { paths: [apiRoot] })
const { PrismaClient, UserRole } = await import(prismaClientPath)
const prisma = new PrismaClient()
try {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    select: { id: true, email: true, username: true, role: true },
  })
  if (!user) { console.error('未找到用户:', identifier); process.exit(1) }
  if (user.role === UserRole.ADMIN) { console.log(user.email, '已是管理员'); process.exit(0) }
  const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } })
  if (adminCount > 0 && !force) {
    console.error('平台已有管理员，需加 --force')
    process.exit(1)
  }
  await prisma.user.update({ where: { id: user.id }, data: { role: UserRole.ADMIN } })
  console.log('已将', user.email, '设为管理员')
} finally {
  await prisma.$disconnect()
}
`
  writeFileSync(path.join(scriptsStage, 'promote-admin.mjs'), promoteAdmin)
}

function writeInstallScripts() {
  const installSh = `#!/usr/bin/env bash
# Skill Store 一键部署脚本（Linux / macOS）
set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

bold() { printf '\\033[1m%s\\033[0m\\n' "$*"; }
info() { printf '\\033[36m[install]\\033[0m %s\\n' "$*"; }
ok()   { printf '\\033[32m[ ok ]\\033[0m %s\\n' "$*"; }
warn() { printf '\\033[33m[warn]\\033[0m %s\\n' "$*"; }
err()  { printf '\\033[31m[err ]\\033[0m %s\\n' "$*" >&2; }

REQUIRED_NODE_MAJOR=20

has() { command -v "$1" >/dev/null 2>&1; }

ensure_node() {
  if has node; then
    local v
    v=$(node -v | sed 's/^v//' | cut -d. -f1)
    if [ "$v" -ge "$REQUIRED_NODE_MAJOR" ]; then
      ok "Node.js $(node -v) 已安装"
      return
    fi
    warn "检测到 Node.js $(node -v)，低于要求的 \${REQUIRED_NODE_MAJOR}+，将尝试安装更高版本"
  else
    info "未检测到 Node.js，开始安装"
  fi

  local os
  os=$(uname -s)
  case "$os" in
    Linux)
      if has apt-get; then
        info "通过 NodeSource 仓库安装 Node.js \${REQUIRED_NODE_MAJOR}.x（需 sudo）"
        curl -fsSL "https://deb.nodesource.com/setup_\${REQUIRED_NODE_MAJOR}.x" | sudo -E bash -
        sudo apt-get install -y nodejs
      elif has yum; then
        info "通过 NodeSource 仓库安装 Node.js \${REQUIRED_NODE_MAJOR}.x（需 sudo）"
        curl -fsSL "https://rpm.nodesource.com/setup_\${REQUIRED_NODE_MAJOR}.x" | sudo bash -
        sudo yum install -y nodejs
      elif has dnf; then
        info "通过 NodeSource 仓库安装 Node.js \${REQUIRED_NODE_MAJOR}.x（需 sudo）"
        curl -fsSL "https://rpm.nodesource.com/setup_\${REQUIRED_NODE_MAJOR}.x" | sudo bash -
        sudo dnf install -y nodejs
      elif has pacman; then
        info "通过 pacman 安装 nodejs（需 sudo）"
        sudo pacman -Sy --noconfirm nodejs npm
      else
        err "未识别的 Linux 包管理器，请手动安装 Node.js \${REQUIRED_NODE_MAJOR}+ 后重试"
        exit 1
      fi
      ;;
    Darwin)
      if has brew; then
        info "通过 Homebrew 安装 node@\${REQUIRED_NODE_MAJOR}"
        brew install node@\${REQUIRED_NODE_MAJOR} || brew install node
      else
        err "未检测到 Homebrew，请先安装 Homebrew 或 Node.js \${REQUIRED_NODE_MAJOR}+"
        exit 1
      fi
      ;;
    *)
      err "不支持的系统: $os，请手动安装 Node.js \${REQUIRED_NODE_MAJOR}+ 后重试"
      exit 1
      ;;
  esac
  ok "Node.js 安装完成: $(node -v)"
}

ensure_pm2() {
  if has pm2; then
    ok "pm2 $(pm2 -v) 已安装"
    return
  fi
  info "全局安装 pm2"
  if has npm; then
    if [ "$EUID" -eq 0 ]; then
      npm install -g pm2
    else
      sudo npm install -g pm2 || npm install -g pm2
    fi
  else
    err "找不到 npm，无法安装 pm2"
    exit 1
  fi
  ok "pm2 安装完成: $(pm2 -v)"
}

install_api_deps() {
  info "安装后端运行时依赖（首次需要 1-3 分钟）"
  (
    cd api
    npm install --omit=dev --no-audit --no-fund
  )
  ok "后端依赖安装完成"
}

start_app() {
  info "用 pm2 启动 skill-store"
  pm2 start ecosystem.config.cjs --update-env
  pm2 save || true
  info "尝试设置 pm2 开机自启（可能需要按 pm2 提示再跑一条 sudo 命令）"
  pm2 startup || true
}

print_done() {
  bold ""
  bold "════════════════════════════════════════════════════════"
  bold "  Skill Store 已启动！"
  bold "════════════════════════════════════════════════════════"
  bold ""
  bold "  下一步："
  bold "    1. 在浏览器打开 http://<服务器 IP>:3000"
  bold "    2. 按页面提示完成安装向导（填写 MySQL 等）"
  bold "    3. 注册首个账号 → 访问 /setup-admin 设为管理员"
  bold ""
  bold "  日志: pm2 logs"
  bold "  状态: pm2 status"
  bold ""
}

bold "=== Skill Store 自动部署 ==="
ensure_node
ensure_pm2
install_api_deps
start_app
print_done
`

  const installPs1 = `# Skill Store 一键部署脚本（Windows / PowerShell）
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Write-Info($msg)  { Write-Host "[install] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)    { Write-Host "[ ok ] $msg"  -ForegroundColor Green }
function Write-Warn2($msg) { Write-Host "[warn] $msg"  -ForegroundColor Yellow }
function Write-Err2($msg)  { Write-Host "[err ] $msg"  -ForegroundColor Red }

$RequiredNodeMajor = 20

function Has-Cmd($name) {
  $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Ensure-Node {
  if (Has-Cmd 'node') {
    $ver = (& node -v) -replace '^v',''
    $major = [int]($ver.Split('.')[0])
    if ($major -ge $RequiredNodeMajor) {
      Write-Ok ("Node.js v" + $ver + " 已安装")
      return
    }
    Write-Warn2 ("检测到 Node.js v" + $ver + "，低于要求的 " + $RequiredNodeMajor + "+，将尝试升级")
  } else {
    Write-Info '未检测到 Node.js，开始安装'
  }

  if (Has-Cmd 'winget') {
    Write-Info '通过 winget 安装 Node.js LTS'
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  } elseif (Has-Cmd 'choco') {
    Write-Info '通过 Chocolatey 安装 nodejs-lts'
    choco install -y nodejs-lts
  } else {
    Write-Err2 '未检测到 winget 或 Chocolatey。请手动安装 Node.js 20+（https://nodejs.org/）后重试。'
    exit 1
  }

  # 刷新 PATH（winget/choco 装完不会立刻生效）
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
  Write-Ok ('Node.js 安装完成: ' + (& node -v))
}

function Ensure-Pm2 {
  if (Has-Cmd 'pm2') {
    Write-Ok ('pm2 ' + (& pm2 -v) + ' 已安装')
    return
  }
  Write-Info '全局安装 pm2'
  npm install -g pm2
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
  Write-Ok ('pm2 安装完成: ' + (& pm2 -v))
}

function Install-ApiDeps {
  Write-Info '安装后端运行时依赖（首次需要 1-3 分钟）'
  Push-Location api
  try {
    npm install --omit=dev --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
  } finally {
    Pop-Location
  }
  Write-Ok '后端依赖安装完成'
}

function Start-App {
  Write-Info '用 pm2 启动 skill-store'
  pm2 start ecosystem.config.cjs --update-env
  pm2 save | Out-Null
  Write-Info '如需开机自启，请单独运行: pm2-startup install （Windows 推荐用 pm2-windows-service 或 nssm）'
}

function Print-Done {
  Write-Host ''
  Write-Host '════════════════════════════════════════════════════════' -ForegroundColor Cyan
  Write-Host '  Skill Store 已启动！' -ForegroundColor Cyan
  Write-Host '════════════════════════════════════════════════════════' -ForegroundColor Cyan
  Write-Host ''
  Write-Host '  下一步：'
  Write-Host '    1. 在浏览器打开 http://<服务器 IP>:3000'
  Write-Host '    2. 按页面提示完成安装向导（填写 MySQL 等）'
  Write-Host '    3. 注册首个账号 -> 访问 /setup-admin 设为管理员'
  Write-Host ''
  Write-Host '  日志: pm2 logs'
  Write-Host '  状态: pm2 status'
  Write-Host ''
}

Write-Host '=== Skill Store 自动部署 ===' -ForegroundColor Cyan
Ensure-Node
Ensure-Pm2
Install-ApiDeps
Start-App
Print-Done
`

  const shPath = path.join(stageRoot, 'install.sh')
  writeFileSync(shPath, installSh, { mode: 0o755 })
  try { chmodSync(shPath, 0o755) } catch {}
  writeFileSync(path.join(stageRoot, 'install.ps1'), installPs1)
}

function dirSize(p) {
  let total = 0
  for (const entry of readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name)
    if (entry.isDirectory()) total += dirSize(full)
    else if (entry.isFile()) total += statSync(full).size
  }
  return total
}

async function makeTarball() {
  const version = readPkgVersion()
  const tarballName = `skill-store-${version}.tar.gz`
  const tarballPath = path.join(releaseRoot, tarballName)
  if (existsSync(tarballPath)) rmSync(tarballPath)

  log('packing tarball:', path.relative(repoRoot, tarballPath))
  // 从 releaseRoot 作为工作目录运行 tar，仅用相对路径，避免 Windows 上 D:\ 被
  // 误识别为远程主机。Windows 10+ 自带 bsdtar；Linux/macOS 自带 GNU/BSD tar。
  const tarBin = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'tar'
  const args = ['-czf', tarballName, 'skill-store']
  const result = spawnSync(tarBin, args, { stdio: 'inherit', cwd: releaseRoot })
  if (result.status !== 0) {
    fail('tar 打包失败。请确认系统已安装 tar 命令（Windows 10+ 默认自带）')
  }
  const size = statSync(tarballPath).size
  log(`tarball ready: ${(size / 1024 / 1024).toFixed(1)} MB`)
}

async function main() {
  const skipBuild = process.argv.includes('--no-build')

  if (!skipBuild) {
    buildApi()
    buildWeb()
  } else {
    log('skipping build (--no-build)')
  }

  ensureCleanStage()
  deployApi()
  copyWebStandalone()
  writeReleaseFiles()
  writeInstallScripts()

  const totalMb = (dirSize(stageRoot) / 1024 / 1024).toFixed(1)
  log(`stage size: ${totalMb} MB`)

  if (!process.argv.includes('--no-tar')) {
    await makeTarball()
  }

  log('done.')
  log('  →', path.relative(repoRoot, stageRoot))
  log('  → release/skill-store-' + readPkgVersion() + '.tar.gz')
}

main().catch((err) => fail('packaging failed', err))
