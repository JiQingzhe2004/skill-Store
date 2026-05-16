import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient, UserRole } from '@prisma/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return

  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i === -1) continue
    const key = line.slice(0, i).trim()
    const value = line.slice(i + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.join(repoRoot, '.env'))
loadEnvFile(path.join(repoRoot, 'apps', 'api', '.env'))

const identifier = process.argv[2]
const force = process.argv.includes('--force')

if (!identifier || identifier.startsWith('-')) {
  console.log(`
用法: pnpm admin:promote <邮箱或用户名> [--force]

将指定用户提升为管理员（无需 ADMIN_SETUP_SECRET，适合本地/运维）。

  pnpm admin:promote you@example.com

若平台已有管理员，需加 --force 才会继续提升。
`)
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('缺少 DATABASE_URL，请在仓库根目录 .env 或 apps/api/.env 中配置。')
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: { id: true, email: true, username: true, role: true },
  })

  if (!user) {
    console.error(`未找到用户: ${identifier}`)
    process.exit(1)
  }

  if (user.role === UserRole.ADMIN) {
    console.log(`${user.email} 已是管理员。`)
    process.exit(0)
  }

  const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } })
  if (adminCount > 0 && !force) {
    console.error('平台已有管理员。若仍要提升该用户，请加上 --force')
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
  })

  console.log(`已将 ${user.email}（${user.username}）设为管理员。`)
} finally {
  await prisma.$disconnect()
}
