import { AuthUser, ApiResponse } from '@skill-store/shared'

import { buildServerApiUrl } from './server-api-url'

type FetchCurrentUserParams = {
  host: string
  cookieHeader?: string
  fetchImpl?: typeof fetch
}

export async function fetchCurrentUser({
  host,
  cookieHeader,
  fetchImpl = fetch,
}: FetchCurrentUserParams): Promise<AuthUser | null> {
  try {
    const response = await fetchImpl(buildServerApiUrl(host, '/auth/me'), {
      method: 'GET',
      cache: 'no-store',
      headers: cookieHeader
        ? {
            cookie: cookieHeader,
          }
        : undefined,
    })

    const payload = (await response.json().catch(() => null)) as ApiResponse<AuthUser> | null

    if (!response.ok || !payload?.success || !payload.data) {
      return null
    }

    return payload.data
  } catch {
    return null
  }
}
