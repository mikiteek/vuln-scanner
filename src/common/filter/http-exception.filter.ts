import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request as HttpRequest, Response as HttpResponse } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const exception =
      error instanceof HttpException
        ? error
        : new InternalServerErrorException('Something went wrong');

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<HttpRequest>();
    const status = exception.getStatus();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const messages: string[] | string = (exception as any)?.response?.message;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: exception.message,
      path: request.url,
      ...(messages && { messages }),
    });
  }
}
