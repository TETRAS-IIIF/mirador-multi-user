import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
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
    private impersonationRepository: Repository<Impersonation>,
    private readonly userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async initiateImpersonation(
    adminUserId: number,
    userId: number,
  ): Promise<Impersonation> {
    try {
      // Check if admin user exists and is an admin
      const adminUser = await this.userService.findAdminUser(adminUserId);
      if (!adminUser) {
        throw new Error('Only admin users can create impersonation tokens');
      }

      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create a new impersonation record
      const token = uuidv4();
      const exchangeBefore = new Date(Date.now() + 20 * 60 * 1000);

      const impersonation = this.impersonationRepository.create({
        adminUser,
        user,
        token,
        exchangeBefore,
        used: false,
      });

      return this.impersonationRepository.save(impersonation);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while creating impersonation',
      );
    }
  }

  async validateToken(token: string): Promise<Impersonation> {
    console.log(token);
    const impersonation = await this.impersonationRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });
    if (!impersonation || new Date() > impersonation.exchangeBefore) {
      throw new Error('Invalid or expired token');
    }
    return impersonation;
  }

  async impersonateUserData(
    impersonateDto: ImpersonateDto,
  ): Promise<{ access_token: string }> {
    try {
      const isTokenValid = await this.validateToken(impersonateDto.token);
      if (!isTokenValid) {
        throw new UnauthorizedException(
          'You are not allowed to impersonate user',
        );
      }
      const user = await this.userService.findOne(impersonateDto.userId);
      const payload = {
        sub: user.id,
        user: user.name,
        isEmailConfirmed: user.isEmailConfirmed,
      };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'an error occurred while impersonating the user',
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
