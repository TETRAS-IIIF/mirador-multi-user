import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProjectDto } from '../../project/dto/create-project.dto';
import { Language } from '../../../utils/email/utils';

export class CreateUserDto {
  @IsEmail()
  mail: string;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  password: string;

  @Type(() => CreateProjectDto)
  @IsOptional()
  Projects: CreateProjectDto[];

  preferredLanguage: Language;

  @IsOptional()
  keycloakId: string;

  @IsOptional()
  isEmailConfirmed: boolean;
}
