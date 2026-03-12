import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

type ExistingResponse = {
  success?: boolean
  data?: unknown
  error?: unknown
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: ExistingResponse) => {
        if (data && typeof data === 'object' && 'success' in data && 'data' in data && 'error' in data) {
          return data
        }

        return {
          success: true,
          data,
          error: null,
        }
      }),
    )
  }
}
