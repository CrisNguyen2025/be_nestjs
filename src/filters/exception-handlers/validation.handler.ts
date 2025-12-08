import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/dto/response.dto';

interface ExceptionResponse {
  status: HttpStatus;
  errors: ApiError[];
}

export function handleValidationException(
  res: any,
  exceptionStatus: number,
): ExceptionResponse {
  const status = exceptionStatus;

  let errors: ApiError[] = [];

  if (Array.isArray(res.message)) {
    errors = res.message.map((e: any) => ({
      message: e.message,
      field: e.field || null,
      key: e.key || null,
    }));
  } else if (typeof res.message === 'string') {
    errors = [
      {
        message: res.message,
        field: res.field || null,
        key: 'bad_request',
      },
    ];
  }

  return {
    status,
    errors,
  };
}
