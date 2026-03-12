import { AuthUser, ApiResponse } from '@skill-store/shared'

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
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const response = await fetchImpl(`${protocol}://${host}/api/auth/me`, {
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
}
