// auth/oidc-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OidcAuthGuard extends AuthGuard('openidconnect') {}
