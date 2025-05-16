import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../BaseEntities/users/users.service';

@Injectable()
export class EmailConfirmationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  public async confirmEmail(email: string) {
    try {
      const user = await this.usersService.getByEmail(email);
      if (user.isEmailConfirmed && user.termsValidatedAt) {
        throw new BadRequestException('Email and terms already confirmed');
      }
      await this.usersService.validTermsForUser(email);
      await this.usersService.markEmailAsConfirmed(email);
      const payload = {
        sub: user.id,
        user: user.name,
        isEmailConfirmed: user.isEmailConfirmed,
        termsValidatedAt: Date.now(),
      };

      const jwt = await this.jwtService.signAsync(payload);
      return {
        access_token: jwt,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      });
      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }
}
