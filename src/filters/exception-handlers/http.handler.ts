import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/dto/response.dto';

interface ExceptionResponse {
  status: HttpStatus;
  errors: ApiError[];
}

export function handleHttpException(
  exception: HttpException,
): ExceptionResponse {
  const status = exception.getStatus();
  const res = exception.getResponse() as any;

  let errors: ApiError[] = [];

  if (typeof res === 'string') {
    errors = [{ message: res }];
  } else if (typeof res === 'object' && res.message) {
    if (Array.isArray(res.message)) {
      errors = res.message.map((m: any) => {
        if (typeof m === 'string') return { message: m };
        if (typeof m === 'object') {
          return {
            message: m.message || 'Unknown error',
            field: m.field,
            key: m.key,
          } as ApiError;
        }
        return { message: String(m) };
      });
    } else if (typeof res.message === 'object') {
      errors = [
        {
          message: res.message.message || 'Unknown error',
          field: res.message.field,
          key: res.message.key,
        },
      ];
    } else {
      errors = [{ message: res.message }];
    }
  } else {
    errors = [{ message: 'Unknown HTTP Error' }];
  }

  return { status, errors };
}
