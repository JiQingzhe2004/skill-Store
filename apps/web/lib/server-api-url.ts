/**
 * Server Components 请求 API 的 URL。
 * Docker 内 SSR 不能用浏览器 Host（如 localhost:4520），应走 API_BASE_URL（如 http://api:3001）。
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
