import { HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AppException } from '../common/exceptions/app.exception'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    })
    if (!user) throw new AppException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', '用户不存在')
    return user
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    // 校验 base64 图片大小（5MB 限制）
    if (dto.avatar) {
      // data:image/xxx;base64,<data> — base64 部分每3字节原始 = 4字节编码
      const base64Data = dto.avatar.replace(/^data:image\/\w+;base64,/, '')
      const sizeBytes = Math.ceil((base64Data.length * 3) / 4)
      if (sizeBytes > 5 * 1024 * 1024) {
        throw new AppException(HttpStatus.BAD_REQUEST, 'AVATAR_TOO_LARGE', '头像不能超过 5MB')
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    })
  }
}
