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

  const errors = Array.isArray(res.message) ? res.message : [];

  const mappedErrors = errors.map((e: any) => ({
    message: e.message,
    field: e.field || null,
    key: e.key || null,
  }));

  return {
    status,
    errors: mappedErrors,
  };
}
