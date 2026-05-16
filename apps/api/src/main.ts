import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'

import { AppModule } from './app.module'
import { SetupAppModule } from './setup-app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor'
import { applyRuntimeConfigToEnv, isSetupComplete, loadRuntimeConfig } from './config/runtime-config'
import { setupSwagger } from './swagger.setup'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const runtime = loadRuntimeConfig()
  if (runtime) {
    applyRuntimeConfigToEnv(runtime)
  }

  const setupComplete = isSetupComplete()
  const moduleClass = setupComplete ? AppModule : SetupAppModule
  if (!setupComplete) {
    logger.warn('Runtime config missing — booting in SETUP mode. Visit the web UI to finish setup.')
  }

  const app = await NestFactory.create(moduleClass)

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

  if (setupComplete && process.env.SWAGGER_ENABLED !== 'false') {
    setupSwagger(app)
  }

  await app.listen(Number(process.env.PORT ?? 3001))
  logger.log(`API listening on :${process.env.PORT ?? 3001} (${setupComplete ? 'NORMAL' : 'SETUP'} mode)`)
}

void bootstrap()
