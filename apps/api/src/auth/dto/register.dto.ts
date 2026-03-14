import { Transform } from 'class-transformer'
import { IsEmail, IsString, Length, Matches } from 'class-validator'

import { normalizeEmail } from '../../common/utils/request'

export class RegisterDto {
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Length(2, 32, { message: '昵称长度需在 2 到 32 个字符之间' })
  username!: string

  @IsString()
  @Length(8, 64, { message: '密码长度需在 8 到 64 位之间' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: '密码至少包含 1 个字母和 1 个数字' })
  password!: string
}
