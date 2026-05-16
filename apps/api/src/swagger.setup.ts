import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { ACCESS_TOKEN_COOKIE_NAME } from './auth/auth.constants'

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Skill Store API')
    .setDescription(
      [
        'Skill Store 后端 REST API。',
        '',
        '- **浏览器**：登录后通过 Cookie `ss_at` 访问需鉴权接口（`credentials: include`）。',
        '- **第三方**：在控制台创建 API Key，请求头携带 `x-api-key` 访问 `/api/v1/*` 只读接口。',
        '',
        '所有 JSON 响应经统一包装：`{ success, data, error }`。',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API Key（前缀 ssk_），创建时仅展示一次明文',
      },
      'api-key',
    )
    .addCookieAuth(ACCESS_TOKEN_COOKIE_NAME, {
      type: 'apiKey',
      in: 'cookie',
      name: ACCESS_TOKEN_COOKIE_NAME,
      description: '登录成功后由服务端 Set-Cookie',
    })
    .build()

  const document = SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
  })
}
