import { HttpException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminService } from './admin.service'

describe('AdminService.setupAdmin', () => {
  const prisma = {
    user: {
      count: vi.fn(),
      update: vi.fn(),
    },
  }

  const service = new AdminService(prisma as never)

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_SETUP_SECRET = 'test-secret'
  })

  it('rejects when an admin already exists', async () => {
    prisma.user.count.mockResolvedValue(1)

    await expect(service.setupAdmin('user-1', 'test-secret')).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof HttpException)) return false
      const body = err.getResponse() as { code?: string }
      return body.code === 'ADMIN_ALREADY_EXISTS'
    })
  })

  it('promotes user when no admin exists and secret matches', async () => {
    prisma.user.count.mockResolvedValue(0)
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      email: 'a@example.com',
      role: 'ADMIN',
    })

    const result = await service.setupAdmin('user-1', 'test-secret')

    expect(result.role).toBe('ADMIN')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'ADMIN' },
      select: { id: true, username: true, email: true, role: true },
    })
  })
})
