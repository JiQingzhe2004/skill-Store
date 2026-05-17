import { HttpStatus, Injectable } from '@nestjs/common'
import { EmailCodePurpose } from '@prisma/client'

import { AppException } from '../common/exceptions/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { EMAIL_CODE_TTL_MS } from './auth.constants'

@Injectable()
export class EmailCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async createCode(userId: string, purpose: EmailCodePurpose) {
    await this.prisma.emailCode.updateMany({
      where: {
        userId,
        purpose,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    const code = this.generateCode()

    await this.prisma.emailCode.create({
      data: {
        userId,
        purpose,
        code,
        expiresAt: new Date(Date.now() + EMAIL_CODE_TTL_MS),
      },
    })

    return code
  }

  async consumeCode(userId: string, purpose: EmailCodePurpose, code: string) {
    const record = await this.prisma.emailCode.findFirst({
      where: {
        userId,
        purpose,
        code,
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!record) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'CODE_INVALID', '验证码无效')
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'CODE_EXPIRED', '验证码已过期')
    }

    await this.prisma.emailCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })

    return record
  }

  private generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
  }
}
