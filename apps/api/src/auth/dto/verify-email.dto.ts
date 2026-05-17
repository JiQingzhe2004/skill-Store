import { Transform } from 'class-transformer'
import { IsEmail, IsString, Matches } from 'class-validator'

import { normalizeEmail } from '../../common/utils/request'

export class VerifyEmailDto {
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
  code!: string
}
