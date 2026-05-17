import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export interface RuntimeConfig {
  setupComplete: boolean
  databaseUrl: string
  shadowDatabaseUrl?: string
  jwtAccessSecret: string
  jwtRefreshSecret: string
  appUrl: string
  adminSetupSecret?: string
}

const ENV_KEYS: Record<keyof Omit<RuntimeConfig, 'setupComplete'>, string> = {
  databaseUrl: 'DATABASE_URL',
  shadowDatabaseUrl: 'SHADOW_DATABASE_URL',
  jwtAccessSecret: 'JWT_ACCESS_SECRET',
  jwtRefreshSecret: 'JWT_REFRESH_SECRET',
  appUrl: 'APP_URL',
  adminSetupSecret: 'ADMIN_SETUP_SECRET',
}

export function getDataDir(): string {
  const custom = process.env.DATA_DIR
  if (custom && custom.length > 0) {
    return path.resolve(custom)
  }
  // apps/api/data
  return path.resolve(__dirname, '..', '..', 'data')
}

export function getRuntimeConfigPath(): string {
  return path.join(getDataDir(), 'runtime.json')
}

export function loadRuntimeConfig(): RuntimeConfig | null {
  const file = getRuntimeConfigPath()
  if (!existsSync(file)) return null
  try {
    const raw = readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw) as Partial<RuntimeConfig>
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as RuntimeConfig
  } catch {
    return null
  }
}

export function saveRuntimeConfig(config: RuntimeConfig): void {
  const dir = getDataDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(getRuntimeConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

export function applyRuntimeConfigToEnv(config: RuntimeConfig): void {
  for (const [key, envKey] of Object.entries(ENV_KEYS)) {
    const value = (config as unknown as Record<string, unknown>)[key]
    if (value === undefined || value === null || value === '') continue
    process.env[envKey] = String(value)
  }
}

export function isSetupComplete(): boolean {
  const config = loadRuntimeConfig()
  return !!(config && config.setupComplete && config.databaseUrl)
}
