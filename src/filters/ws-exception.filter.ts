import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsAllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Default Error Structure
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    };

    if (exception instanceof WsException) {
      errorResponse.message = exception.message;
      errorResponse.code = 'WS_ERROR';
    } else if (exception instanceof Error) {
      // General Error (e.g. from services)
      errorResponse.message = exception.message;
      errorResponse.code = 'SERVER_ERROR';
    } else if ((exception as any)?.response) {
      // Http/Validation Exceptions thrown in Guard/Pipe
      const res = (exception as any).response;
      errorResponse.message = Array.isArray(res.message)
        ? res.message[0]
        : res.message;
      errorResponse.code = 'VALIDATION_ERROR';
    }

    // A. For Request-Response (Ack), we can return the error directly
    const callback = host.getArgByIndex(2); // Socket.IO callback is usually the 3rd arg
    if (callback && typeof callback === 'function') {
      callback(errorResponse);
    } else {
      // B. If no Ack callback, emit an 'exception' event
      client.emit('exception', errorResponse);
    }
  }
}
