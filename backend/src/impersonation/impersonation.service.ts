import { Injectable, InternalServerErrorException, UnauthorizedException, } from '@nestjs/common';
import { Impersonation } from './entities/impersonation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../BaseEntities/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from '../utils/Logger/CustomLogger.service';
import { JwtService } from '@nestjs/jwt';
import { ImpersonateDto } from './dto/impersonateDto';

@Injectable()
export class ImpersonationService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Impersonation)
    private readonly impersonationRepository: Repository<Impersonation>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private buildOidcLogoutUrl(token: string, targetUserId: number): string {
    const clientId = process.env.OIDC_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL;
    const callbackUrl = `${frontendUrl}/impersonate?token=${token}&userId=${targetUserId}`;
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return `${process.env.OIDC_ISSUER}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodedCallbackUrl}`;
  }
  async initiateImpersonation(
    adminUserId: number,
    userId: number,
  ): Promise<{ oidcLogoutUrl: string }> {
    try {
      const adminUser = await this.userService.findAdminUser(adminUserId);
      if (!adminUser) {
        throw new Error('Only admin users can create impersonation tokens');
      }

      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const token = uuidv4();
      const exchangeBefore = new Date(Date.now() + 20 * 60 * 1000);

      const impersonation = this.impersonationRepository.create({
        adminUser,
        user,
        token,
        exchangeBefore,
        used: false,
      });

      await this.impersonationRepository.save(impersonation);

      const oidcLogoutUrl = this.buildOidcLogoutUrl(token, userId);

      return { oidcLogoutUrl };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating impersonation',
      );
    }
  }

  async validateToken(token: string): Promise<Impersonation> {
    const impersonation = await this.impersonationRepository.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!impersonation) {
      throw new Error(`Token not found: ${token}`);
    }
    if (impersonation.used) {
      throw new Error(`Token already used: ${token}`);
    }
    if (new Date() > impersonation.exchangeBefore) {
      throw new Error(`Token expired: ${token}`);
    }

    return impersonation;
  }

  async impersonateUserData(
    impersonateDto: ImpersonateDto,
  ): Promise<{ access_token: string }> {
    try {
      const impersonation = await this.validateToken(impersonateDto.token);
      if (!impersonation) {
        throw new UnauthorizedException(
          'You are not allowed to impersonate user',
        );
      }
      impersonation.used = true;
      await this.impersonationRepository.save(impersonation);

      const user = impersonation.user;
      const payload = {
        sub: user.id,
        user: user.name,
        isEmailConfirmed: user.isEmailConfirmed,
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while impersonating the user',
      );
    }
  }

  // async revokeToken(impersonationId: string): Promise<void> {
  //   const impersonation = await this.impersonationRepository.findOne({
  //     where: { id: impersonationId },
  //   });
  //   if (!impersonation) {
  //     throw new Error('Impersonation record not found');
  //   }
  //
  //   impersonation.used = true;
  //   await this.impersonationRepository.save(impersonation);
  // }
}
