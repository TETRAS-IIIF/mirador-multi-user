import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EmailServerService } from '../email/email.service';
import { UsersService } from '../../BaseEntities/users/users.service';

interface AuthenticatedRequest extends Request {
  user?: any;
}

@Catch(InternalServerErrorException)
export class InternalServerErrorFilter implements ExceptionFilter {
  constructor(
    private readonly emailService: EmailServerService,
    private readonly userService: UsersService,
  ) {}

  async catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();
    const status = exception.getStatus ? exception.getStatus() : 500;

    console.error('Internal server error:', exception.message);

    try {
      const user = await this.userService.findOne(request.user);
      await this.emailService.sendInternalServerErrorNotification({
        message: exception.message,
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        body: request.body,
        user: {
          id: user.id,
          email: user.mail,
          name: user.name,
        },
        stack: exception.stack,
      });
    } catch (error) {
      console.error('Failed to send error notification email:', error.message);
      throw new InternalServerErrorException(error.message);
    }
    // Send email using your email service

    // Send the response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
