import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    let code = 'INTERNAL_SERVER_ERROR'
    let message = '服务器内部错误'

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse()

      if (typeof errorResponse === 'string') {
        message = errorResponse
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const responseObject = errorResponse as {
          code?: string
          message?: string | string[]
        }

        code = responseObject.code ?? (status === HttpStatus.BAD_REQUEST ? 'VALIDATION_ERROR' : code)

        if (Array.isArray(responseObject.message)) {
          message = responseObject.message[0] ?? message
        } else if (responseObject.message) {
          message = responseObject.message
        }
      }
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
      },
    })
  }
}
