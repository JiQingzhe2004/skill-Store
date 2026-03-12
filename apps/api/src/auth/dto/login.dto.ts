import { Transform } from 'class-transformer'
import { IsEmail, IsString, MinLength } from 'class-validator'

import { normalizeEmail } from '../../common/utils/request'

export class LoginDto {
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string

  @IsString()
  @MinLength(1, { message: '密码不能为空' })
  password!: string
}
