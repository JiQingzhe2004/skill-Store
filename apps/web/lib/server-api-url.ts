/**
 * Server Components 请求 API 的 URL。
 * SSR 走 API_BASE_URL（默认 http://localhost:3001），优先用于服务器内部直连。
 */
export function buildServerApiUrl(host: string, path: string): string {
  const apiPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`

  const internalBase = process.env.API_BASE_URL?.replace(/\/$/, '')
  if (internalBase) {
    return `${internalBase}${apiPath}`
  }

  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}${apiPath}`
}
