import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OidcAuthGuard extends AuthGuard('openidconnect') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(error: any, user: any, info: any) {
    console.log('toto');
    if (error) {
      console.error('❌ OIDC Guard Error:', error.message);
    }
    if (info) {
      console.warn('OIDC Guard Info:', info);
    }
    if (!user) {
      throw new UnauthorizedException(
        info?.message || 'Unauthorized from Keycloak',
      );
    }

    return user;
  }
}
