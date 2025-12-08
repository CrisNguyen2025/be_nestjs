import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { IResponse } from 'src/common/dto/response.dto';
import { handleHttpException } from './exception-handlers/http.handler';
import { handleUnknownException } from './exception-handlers/unknown.handler';
import { handleValidationException } from './exception-handlers/validation.handler';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let result: { status: number; errors: any[] };

    if (exception instanceof BadRequestException) {
      const res = exception.getResponse() as any;
      const status = exception.getStatus();
      result = handleValidationException(res, status);
    } else if (exception instanceof HttpException) {
      result = handleHttpException(exception);
    } else {
      result = handleUnknownException(exception);
    }

    const responseBody: IResponse<null> = {
      success: false,
      errors: result.errors,
    };

    response.status(result.status).json(responseBody);
  }
}
