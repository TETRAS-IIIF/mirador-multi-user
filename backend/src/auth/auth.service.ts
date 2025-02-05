import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../BaseEntities/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { CustomLogger } from '../utils/Logger/CustomLogger.service';

@Injectable()
export class AuthService {
  private readonly logger = new CustomLogger();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailServerService,
    private readonly impersonationService: ImpersonationService,
  ) {}

  async signIn(
    mail: string,
    pass: string,
    isImpersonate: string,
  ): Promise<{ access_token: string }> {
    try {
      if (isImpersonate != undefined) {
        const impersonation =
          await this.impersonationService.validateToken(isImpersonate);
        if (!impersonation) {
          throw new UnauthorizedException('token is invalid');
        }
        const user = await this.usersService.findOneByMail(
          impersonation.user.mail,
        );
        if (!user) {
          throw new ForbiddenException();
        }
        const payload = {
          sub: user.id,
          user: user.name,
          isEmailConfirmed: user.isEmailConfirmed,
        };

        return {
          access_token: await this.jwtService.signAsync(payload),
        };
      }
      const user = await this.usersService.findOneByMail(mail);
      if (!user) {
        throw new ForbiddenException();
      }
      const isMatch = await bcrypt.compare(pass, user.password);

      if (!isMatch) {
        throw new UnauthorizedException();
      }
      await this.usersService.updateUser(user.id, {
        lastConnectedAt: new Date(),
      });
      const payload = {
        sub: user.id,
        user: user.name,
        isEmailConfirmed: user.isEmailConfirmed,
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred`,
        error.message,
      );
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.usersService.findOneByMail(email);
      const { mail, name } = user;
      if (!user) {
        throw new NotFoundException(`No user found for email: ${email}`);
      }

      const payload = { mail, name };

      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
        expiresIn: `900s`,
      });
      await this.usersService.updateUser(user.id, { resetToken: token });

      await this.emailService.sendResetPasswordLink({
        to: user.mail,
        userName: user.name,
        token: token,
        language: user.preferredLanguage,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred`,
        error.message,
      );
    }
  }

  async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      });
      if (
        typeof payload === 'object' &&
        'mail' in payload &&
        'name' in payload
      ) {
        return { mail: payload.mail, name: payload.name };
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        this.logger.error(error.message, error.stack);
        throw new BadRequestException('Email confirmation token expired');
      }
      this.logger.error(error.message, error.stack);
      throw new BadRequestException('Bad confirmation token');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const decodeData = await this.decodeConfirmationToken(token);

      const user = await this.usersService.findOneByMail(decodeData.mail);
      if (!user) {
        throw new NotFoundException(
          `No user found for email: ${decodeData.mail}`,
        );
      }

      if (token === user.resetToken) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        await this.usersService.updateUser(user.id, {
          password: hashedPassword,
          resetToken: null,
        });
      } else {
        throw new UnauthorizedException('invalid token');
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findProfile(id: number) {
    try {
      const user = await this.usersService.findOne(id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        mail: user.mail,
        name: user.name,
        _isAdmin: user._isAdmin,
        preferredLanguage: user.preferredLanguage,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }
}
