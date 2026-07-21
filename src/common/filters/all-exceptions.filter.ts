import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '../dto/response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      
      message = 
        typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : exceptionResponse.message || exception.message;
          
      code = 
        typeof exceptionResponse === 'object' && exceptionResponse.error
          ? exceptionResponse.error.replace(/\s+/g, '_').toUpperCase()
          : `HTTP_${status}_ERROR`;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error('========================================');
    this.logger.error(`Exception Name: ${exception instanceof Error ? exception.name : 'Unknown'}`);
    this.logger.error(`Message: ${message}`);
    if (exception instanceof Error) {
      this.logger.error(`Stack Trace:\n${exception.stack}`);
      if ((exception as any).code) {
        this.logger.error(`Prisma Code: ${(exception as any).code}`);
      }
      if ((exception as any).meta) {
        this.logger.error(`Prisma Meta: ${JSON.stringify((exception as any).meta)}`);
      }
    } else {
      this.logger.error(`Exception Object:\n${JSON.stringify(exception)}`);
    }
    this.logger.error('========================================');

    const errorBody: ApiResponseDto<null> = {
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : message,
      },
    };

    response.status(status).json(errorBody);
  }
}
