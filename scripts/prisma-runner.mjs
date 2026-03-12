import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const apiRoot = path.join(repoRoot, 'apps', 'api')
const rootEnvPath = path.join(repoRoot, '.env')

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) {
    return
  }

  const content = readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(rootEnvPath)

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Expected it in the repo root `.env` file.')
  process.exit(1)
}

const userArgs = process.argv.slice(2)

if (userArgs.length === 0) {
  console.error('No Prisma command provided.')
  process.exit(1)
}

const prismaArgs = ['exec', 'prisma', ...userArgs, '--schema', 'prisma/schema.prisma']
const child = spawn('pnpm', prismaArgs, {
  cwd: apiRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
