import { Transform } from 'class-transformer'
import { IsEmail, IsString, Length, Matches } from 'class-validator'

import { normalizeEmail, normalizePassword } from '../../common/utils/request'

export class ResetPasswordDto {
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
  code!: string

  @Transform(({ value }) => normalizePassword(String(value)))
  @IsString()
  @Length(8, 64, { message: '密码长度需在 8 到 64 位之间' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: '密码至少包含 1 个字母和 1 个数字' })
  password!: string
}
