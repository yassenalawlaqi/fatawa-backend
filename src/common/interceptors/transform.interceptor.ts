import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/response.dto';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((result) => {
        // If the result is already wrapped (e.g. has pagination), just return it with success: true
        if (result && typeof result === 'object' && ('data' in result || 'pagination' in result)) {
          return {
            success: true,
            data: result.data,
            pagination: result.pagination,
            message: result.message || null,
          };
        }
        
        // Otherwise wrap the raw result
        return {
          success: true,
          data: result as T,
          pagination: undefined,
          message: null,
        };
      }),
    );
  }
}
