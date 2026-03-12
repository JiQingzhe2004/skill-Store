import { Injectable } from '@nestjs/common'
import { Response } from 'express'

import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants'

@Injectable()
export class CookieService {
  setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
    const secure = process.env.NODE_ENV === 'production'

    response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: ACCESS_TOKEN_TTL_MS,
      path: '/',
    })

    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: '/',
    })
  }

  clearAuthCookies(response: Response) {
    const secure = process.env.NODE_ENV === 'production'

    response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    })

    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    })
  }
}
