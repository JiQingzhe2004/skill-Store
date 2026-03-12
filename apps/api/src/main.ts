import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')
  app.use(cookieParser())
  app.enableCors({
    origin: process.env.APP_URL ?? 'http://localhost:3000',
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalInterceptors(new ApiResponseInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(Number(process.env.PORT ?? 3001))
}

void bootstrap()
