import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'

import { EmailCodePurpose } from '@prisma/client'

type CodeEmailParams = {
  to: string
  code: string
  purpose: EmailCodePurpose
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)

  constructor(private readonly configService: ConfigService) {}

  async sendCodeEmail(params: CodeEmailParams) {
    // 未配置 SMTP_HOST 时，把验证码打到控制台，便于本地开发
    if (!this.configService.get<boolean>('smtpEnabled')) {
      this.logger.warn(
        `\n` +
        `╭─────────────────────────────────────────────╮\n` +
        `│  📮 [DEV] SMTP 未配置，验证码仅打印到控制台  │\n` +
        `├─────────────────────────────────────────────┤\n` +
        `│  收件人: ${params.to.padEnd(33, ' ')}│\n` +
        `│  用途:   ${String(params.purpose).padEnd(33, ' ')}│\n` +
        `│  验证码: ${params.code.padEnd(33, ' ')}│\n` +
        `╰─────────────────────────────────────────────╯`,
      )
      return
    }

    const transporter = this.createTransporter()

    const isRegister = params.purpose === EmailCodePurpose.REGISTER
    const subject = isRegister ? 'Skill Store 注册验证码' : 'Skill Store 重置密码验证码'
    const headline = isRegister ? '完成 Skill Store 账号注册' : '重置你的 Skill Store 密码'
    const intro = isRegister
      ? '感谢注册 Skill Store。请使用下面的验证码完成邮箱激活：'
      : '我们收到了为你的账号重置密码的请求。请使用下面的验证码继续操作：'

    const html = renderCodeEmailHtml({
      headline,
      intro,
      code: params.code,
      ttlMinutes: 10,
    })

    const text = [
      '你好，',
      '',
      intro,
      '',
      `验证码：${params.code}`,
      '验证码 10 分钟内有效，请尽快完成操作。',
      '',
      '如果这不是你的操作，请忽略此邮件。',
      '',
      '— Skill Store',
    ].join('\n')

    await transporter.sendMail({
      from: this.configService.getOrThrow<string>('smtpFrom'),
      to: params.to,
      subject,
      text,
      html,
    })
    this.logger.log(`Sent ${params.purpose} code email to ${params.to}`)
  }

  private createTransporter() {
    const host = this.configService.getOrThrow<string>('smtpHost')
    const port = this.configService.getOrThrow<number>('smtpPort')
    const user = this.configService.get<string>('smtpUser')
    const pass = this.configService.get<string>('smtpPass')

    return nodemailer.createTransport({
      host,
      port,
      // Port 465 is implicit TLS; STARTTLS for other common submission ports.
      secure: Number(port) === 465,
      auth: user
        ? {
            user,
            pass: pass ?? '',
          }
        : undefined,
    })
  }
}

function renderCodeEmailHtml(params: {
  headline: string
  intro: string
  code: string
  ttlMinutes: number
}): string {
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]!))

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(params.headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f5f7;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 4px 16px rgba(15,23,42,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 32px;color:#ffffff;">
              <div style="font-size:13px;letter-spacing:2px;opacity:0.85;">SKILL STORE</div>
              <div style="font-size:22px;font-weight:600;margin-top:6px;">${escape(params.headline)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#1f2937;">你好，</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#1f2937;">${escape(params.intro)}</p>
              <div style="text-align:center;margin:32px 0;">
                <div style="display:inline-block;padding:18px 28px;background:#f3f4f6;border-radius:12px;font-family:'SF Mono',Consolas,Menlo,monospace;font-size:36px;letter-spacing:10px;font-weight:600;color:#111827;">
                  ${escape(params.code)}
                </div>
              </div>
              <p style="margin:0 0 8px 0;font-size:14px;line-height:1.65;color:#4b5563;">
                验证码 <strong>${params.ttlMinutes} 分钟内</strong>有效，请尽快完成操作。
              </p>
              <p style="margin:0 0 0 0;font-size:13px;line-height:1.65;color:#6b7280;">
                如果这不是你的操作，请直接忽略此邮件，你的账号仍然安全。
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;line-height:1.6;">
              此邮件由 Skill Store 系统自动发送，请勿直接回复。
            </td>
          </tr>
        </table>
        <div style="max-width:560px;margin:16px auto 0 auto;text-align:center;font-size:12px;color:#9ca3af;">
          © Skill Store
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`
}
