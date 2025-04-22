import { isObservable, lastValueFrom } from 'rxjs';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwtauth.guard';
import { OidcAuthGuard } from '../OidcAuthGuard';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

function isPromise<T = any>(val: unknown): val is Promise<T> {
  return !!val && typeof (val as any).then === 'function';
}

@Injectable()
export class DynamicPassportGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly oidcGuard: OidcAuthGuard,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    const guard =
      process.env.AUTH_CONFIGURATION === 'OpenIdConnect'
        ? this.oidcGuard
        : this.jwtGuard;

    const result = guard.canActivate(context);

    if (isObservable(result)) {
      return await lastValueFrom(result);
    } else if (isPromise(result)) {
      return await result;
    }

    return result;
  }
}
