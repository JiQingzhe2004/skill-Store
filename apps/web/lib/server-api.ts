import { ApiResponse } from '@skill-store/shared'

type ServerApiOptions = RequestInit & {
  host: string
  cookieHeader?: string
}

export async function serverApiRequest<T>(
  path: string,
  { host, cookieHeader, ...init }: ServerApiOptions,
): Promise<ApiResponse<T>> {
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const response = await fetch(`${protocol}://${host}/api${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (payload) return payload

  return {
    success: false,
    data: null,
    error: { code: 'NETWORK_ERROR', message: '请求失败，请稍后再试' },
  }
}
