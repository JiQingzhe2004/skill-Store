import { ApiResponse } from '@skill-store/shared'

import { buildServerApiUrl } from './server-api-url'

type ServerApiOptions = RequestInit & {
  host: string
  cookieHeader?: string
}

export async function serverApiRequest<T>(
  path: string,
  { host, cookieHeader, ...init }: ServerApiOptions,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(buildServerApiUrl(host, path), {
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
  } catch {
    // fall through to network error
  }

  return {
    success: false,
    data: null,
    error: { code: 'NETWORK_ERROR', message: '请求失败，请稍后再试' },
  }
}
