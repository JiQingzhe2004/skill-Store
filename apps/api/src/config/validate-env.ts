const requiredKeys = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'APP_URL',
]

export function validateEnv(env: Record<string, unknown>) {
  for (const key of requiredKeys) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }

  return env
}
