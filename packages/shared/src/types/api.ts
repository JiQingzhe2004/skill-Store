export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: ApiError | null
}

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'success' in value && 'data' in value && 'error' in value
}
