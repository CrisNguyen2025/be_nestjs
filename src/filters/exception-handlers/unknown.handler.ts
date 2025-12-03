import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/dto/response.dto';

interface ExceptionResponse {
  status: HttpStatus;
  errors: ApiError[];
}

export function handleUnknownException(exception: unknown): ExceptionResponse {
  if (exception instanceof Error) {
    console.error('Unknown Exception:', exception.message);
    console.error(exception.stack);
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    errors: [
      {
        message: 'Internal Server Error',
        field: undefined,
        key: 'internal',
      },
    ],
  };
}
