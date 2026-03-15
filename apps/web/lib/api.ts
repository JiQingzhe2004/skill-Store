import { ApiResponse } from '@skill-store/shared'

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const body = init?.body
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(isFormData ? {} : { 'content-type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (payload) {
    return payload
  }

  return {
    success: false,
    data: null,
    error: {
      code: 'NETWORK_ERROR',
      message: '请求失败，请稍后再试',
    },
  }
}

export function getErrorMessage(payload: ApiResponse<unknown>) {
  return payload.error?.message ?? '请求失败，请稍后再试'
}
