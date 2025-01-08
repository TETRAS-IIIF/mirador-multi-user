import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyFactory } from './policy.factory';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyFactory: PolicyFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = request.resource;
    const action = this.reflector.get<string>('action', context.getHandler());

    const policy = this.policyFactory.createPolicy(action, user, resource);
    return policy.actionAllowed();
  }
}
