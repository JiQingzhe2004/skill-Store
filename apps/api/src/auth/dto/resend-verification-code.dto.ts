import { Transform } from 'class-transformer'
import { IsEmail } from 'class-validator'

import { normalizeEmail } from '../../common/utils/request'

export class ResendVerificationCodeDto {
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string
}
