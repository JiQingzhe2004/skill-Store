import { EmailCodePurpose } from '@prisma/client'
import { vi } from 'vitest'

import { EmailCodeService } from './email-code.service'

describe('EmailCodeService', () => {
  it('invalidates previous codes and creates a new code', async () => {
    const prisma = {
      emailCode: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'code_1' }),
      },
    }

    const service = new EmailCodeService(prisma as never)
    const code = await service.createCode('user_1', EmailCodePurpose.REGISTER)

    expect(prisma.emailCode.updateMany).toHaveBeenCalledTimes(1)
    expect(prisma.emailCode.create).toHaveBeenCalledTimes(1)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('rejects expired codes', async () => {
    const prisma = {
      emailCode: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'code_1',
          expiresAt: new Date(Date.now() - 1000),
        }),
        update: vi.fn(),
      },
    }

    const service = new EmailCodeService(prisma as never)

    await expect(service.consumeCode('user_1', EmailCodePurpose.REGISTER, '123456')).rejects.toThrow(
      '验证码已过期',
    )
  })
})
