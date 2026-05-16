import { of } from 'rxjs'
import { describe, expect, it } from 'vitest'

import { ApiResponseInterceptor } from './interceptors/api-response.interceptor'

describe('ApiResponseInterceptor', () => {
  const interceptor = new ApiResponseInterceptor()

  it('wraps plain objects in success envelope', async () => {
    const result = interceptor.intercept(
      {} as never,
      { handle: () => of({ id: 1 }) },
    )

    await expect(result.toPromise()).resolves.toEqual({
      success: true,
      data: { id: 1 },
      error: null,
    })
  })

  it('passes through already-wrapped responses', async () => {
    const wrapped = { success: true, data: { ok: true }, error: null }
    const result = interceptor.intercept(
      {} as never,
      { handle: () => of(wrapped) },
    )

    await expect(result.toPromise()).resolves.toBe(wrapped)
  })
})
