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

@Injectable()
export class AuthService {
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
    console.log(user);
    if (!user) {
      throw new ForbiddenException();
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(isMatch);

    if (!isMatch) {
      throw new UnauthorizedException();
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

  async forgotPassword(email: string): Promise<void> {
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
    });
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
        throw new BadRequestException('Email confirmation token expired');
      }
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
      throw new InternalServerErrorException(error.message);
    }
  }

  async findProfile(id: number) {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      mail: user.mail,
      name: user.name,
      _isAdmin: user._isAdmin,
      preferredLanguage: user.preferredLanguage,
    };
  }
}
