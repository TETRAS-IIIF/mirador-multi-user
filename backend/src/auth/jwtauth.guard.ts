import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ActionType } from '../enum/actions';

export interface AuthenticatedRequest extends Request {
  metadata?: {
    action?: ActionType;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const action = this.reflector.get<ActionType>(
      'action',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.metadata = { action };
    return super.canActivate(context);
  }
}
