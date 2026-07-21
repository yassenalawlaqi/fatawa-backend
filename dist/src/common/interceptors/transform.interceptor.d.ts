import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiResponseDto } from '../dto/response.dto';
export interface Response<T> {
    data: T;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>>;
}
