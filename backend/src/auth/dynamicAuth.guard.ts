import { isObservable, lastValueFrom, Observable } from 'rxjs';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwtauth.guard';
import { OidcAuthGuard } from '../OidcAuthGuard';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY, isKeycloakToken } from './utils';
import { CustomLogger } from '../utils/Logger/CustomLogger.service';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

function isPromise<T = any>(val: unknown): val is Promise<T> {
  return !!val && typeof (val as any).then === 'function';
}

@Injectable()
export class DynamicPassportGuard implements CanActivate {
  logger = new CustomLogger();

  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly oidcGuard: OidcAuthGuard,
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.get<boolean>(
        IS_PUBLIC_KEY,
        context.getHandler(),
      );
      if (isPublic) return true;

      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('No bearer token provided');
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.decode(token) as any;

      const guardToUse = isKeycloakToken(decoded)
        ? this.oidcGuard
        : this.jwtGuard;

      const result: boolean | Promise<boolean> | Observable<boolean> =
        guardToUse.canActivate(context);

      if (isObservable(result)) {
        return await lastValueFrom(result);
      } else if (isPromise(result)) {
        return await result;
      }

      return result;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error instanceof Error
        ? error
        : new UnauthorizedException('Unexpected error');
    }
  }
}
