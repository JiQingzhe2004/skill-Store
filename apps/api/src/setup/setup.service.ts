import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import path from 'node:path'

import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

import {
  RuntimeConfig,
  applyRuntimeConfigToEnv,
  isSetupComplete,
  loadRuntimeConfig,
  saveRuntimeConfig,
} from '../config/runtime-config'

export interface DbConnection {
  host: string
  port: number
  user: string
  password: string
  database: string
  shadowDatabase?: string
}

export interface SubmitSetupPayload {
  db: DbConnection
  appUrl: string
  smtp: {
    host: string
    port: number
    user?: string
    pass?: string
    from: string
  }
  adminSetupSecret: string
  jwtAccessSecret?: string
  jwtRefreshSecret?: string
}

function buildMysqlUrl(db: DbConnection, useShadow = false): string {
  const dbName = useShadow ? db.shadowDatabase ?? `${db.database}_shadow` : db.database
  const user = encodeURIComponent(db.user)
  const pass = encodeURIComponent(db.password)
  return `mysql://${user}:${pass}@${db.host}:${db.port}/${dbName}`
}

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name)

  getStatus() {
    const config = loadRuntimeConfig()
    return {
      setupComplete: isSetupComplete(),
      hasConfig: !!config,
    }
  }

  async testConnection(db: DbConnection): Promise<{ ok: true } | { ok: false; error: string }> {
    const url = buildMysqlUrl(db)
    const client = new PrismaClient({ datasources: { db: { url } } })
    try {
      await client.$connect()
      await client.$queryRaw`SELECT 1`
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, error: message }
    } finally {
      await client.$disconnect().catch(() => undefined)
    }
  }

  async submit(payload: SubmitSetupPayload): Promise<{ ok: true }> {
    if (isSetupComplete()) {
      throw new BadRequestException('Setup has already been completed')
    }

    const databaseUrl = buildMysqlUrl(payload.db)
    const shadowDatabaseUrl = buildMysqlUrl(payload.db, true)

    const test = await this.testConnection(payload.db)
    if (!test.ok) {
      throw new BadRequestException(`Database connection failed: ${test.error}`)
    }

    const config: RuntimeConfig = {
      setupComplete: false,
      databaseUrl,
      shadowDatabaseUrl,
      appUrl: payload.appUrl,
      jwtAccessSecret: payload.jwtAccessSecret || randomBytes(48).toString('hex'),
      jwtRefreshSecret: payload.jwtRefreshSecret || randomBytes(48).toString('hex'),
      smtpHost: payload.smtp.host,
      smtpPort: payload.smtp.port,
      smtpUser: payload.smtp.user,
      smtpPass: payload.smtp.pass,
      smtpFrom: payload.smtp.from,
      adminSetupSecret: payload.adminSetupSecret,
    }

    saveRuntimeConfig(config)
    applyRuntimeConfigToEnv(config)

    try {
      await this.runMigrateDeploy(databaseUrl, shadowDatabaseUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(`Database migration failed: ${message}`)
    }

    const final: RuntimeConfig = { ...config, setupComplete: true }
    saveRuntimeConfig(final)

    setTimeout(() => {
      this.logger.warn('Setup complete — exiting so the process manager can restart API in full mode')
      process.exit(0)
    }, 800)

    return { ok: true }
  }

  private runMigrateDeploy(databaseUrl: string, shadowDatabaseUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiRoot = path.resolve(__dirname, '..', '..')
      const args = ['exec', 'prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma']
      const child = spawn('pnpm', args, {
        cwd: apiRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          SHADOW_DATABASE_URL: shadowDatabaseUrl,
        },
      })
      child.on('error', reject)
      child.on('exit', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`prisma migrate deploy exited with code ${code}`))
      })
    })
  }
}
