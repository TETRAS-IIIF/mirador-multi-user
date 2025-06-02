import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../BaseEntities/users/users.service';
import { CustomLogger } from '../utils/Logger/CustomLogger.service';

@Injectable()
export class EmailConfirmationService {
  private readonly logger = new CustomLogger();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  public async confirmEmail(email: string) {
    const user = await this.usersService.getByEmail(email);
    if (user.isEmailConfirmed && user.termsValidatedAt) {
      throw new BadRequestException('Email and terms already confirmed');
    }
    await this.usersService.validTermsForUser(email);
    await this.usersService.markEmailAsConfirmed(email);
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
      this.logger.error('An error occured', error);
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }
}
