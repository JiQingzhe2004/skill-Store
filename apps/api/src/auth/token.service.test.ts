import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { UserRole } from '@prisma/client'

import { TokenService } from './token.service'

describe('TokenService', () => {
  const service = new TokenService(
    new JwtService(),
    new ConfigService({
      jwtAccessSecret: 'access-secret',
      jwtRefreshSecret: 'refresh-secret',
    }),
  )

  const user = {
    id: 'user_1',
    email: 'user@example.com',
    role: UserRole.USER,
  }

  it('signs and verifies access tokens', async () => {
    const token = await service.signAccessToken(user)
    const payload = await service.verifyAccessToken(token)

    expect(payload.sub).toBe(user.id)
    expect(payload.tokenType).toBe('access')
  })

  it('rejects refresh token in access verifier', async () => {
    const refreshToken = await service.signRefreshToken(user)

    await expect(service.verifyAccessToken(refreshToken)).rejects.toThrow('登录状态已失效')
  })
})
