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
    console.log('CAN ACTIVATE');
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );

    console.log('isPublic');
    console.log(isPublic);
    if (isPublic) {
      return true;
    }

    console.log('process.env.AUTH_CONFIGURATION');
    console.log(process.env.AUTH_CONFIGURATION);
    console.log('process.env.KEYCLOAK_ISSUER');
    console.log(process.env.KEYCLOAK_ISSUER);
    console.log('process.env.KEYCLOAK_CLIENT_ID');
    console.log(process.env.KEYCLOAK_CLIENT_ID);
    const guard =
      process.env.AUTH_CONFIGURATION === 'openidconnect'
        ? this.oidcGuard
        : this.jwtGuard;

    console.log('guard');
    console.log(guard);
    const result = guard.canActivate(context);
    console.log('result', result);
    if (isObservable(result)) {
      return await lastValueFrom(result);
    } else if (isPromise(result)) {
      console.log('pending');
      return await result;
    }

    console.log('result');
    console.log(result);

    return result;
  }
}
