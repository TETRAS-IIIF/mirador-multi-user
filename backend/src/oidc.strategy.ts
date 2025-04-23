import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'openidconnect') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: process.env.KEYCLOAK_ISSUER,
      audience: process.env.KEYCLOAK_CLIENT_ID,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: any) {
    console.log('✅ OIDC Token payload:', payload);

    return payload;
  }
}
