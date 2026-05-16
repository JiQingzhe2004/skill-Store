import { fetchCurrentUser } from './server-auth'

describe('fetchCurrentUser', () => {
  it('returns null on non-success response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: '登录状态已失效' },
      }),
    })

    const result = await fetchCurrentUser({
      host: 'localhost:3000',
      cookieHeader: '',
      fetchImpl: fetchImpl as never,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/me',
      expect.any(Object),
    )
    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    const result = await fetchCurrentUser({
      host: 'localhost:4520',
      fetchImpl: fetchImpl as never,
    })

    expect(result).toBeNull()
  })
})
