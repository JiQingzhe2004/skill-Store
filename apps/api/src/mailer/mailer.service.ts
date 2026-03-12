import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'

import { EmailCodePurpose } from '@prisma/client'

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}

  async sendCodeEmail(params: { to: string; code: string; purpose: EmailCodePurpose }) {
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('smtpHost'),
      port: this.configService.getOrThrow<number>('smtpPort'),
      secure: false,
      auth: this.configService.get<string>('smtpUser')
        ? {
            user: this.configService.getOrThrow<string>('smtpUser'),
            pass: this.configService.get<string>('smtpPass') ?? '',
          }
        : undefined,
    })

    const subject =
      params.purpose === EmailCodePurpose.REGISTER ? 'Skill Store 注册验证码' : 'Skill Store 重置密码验证码'

    const text = [
      '你好，',
      '',
      `你的验证码是：${params.code}`,
      '验证码 10 分钟内有效，请尽快完成操作。',
      '',
      '如果这不是你的操作，请忽略此邮件。',
    ].join('\n')

    await transporter.sendMail({
      from: this.configService.getOrThrow<string>('smtpFrom'),
      to: params.to,
      subject,
      text,
    })
  }
}
