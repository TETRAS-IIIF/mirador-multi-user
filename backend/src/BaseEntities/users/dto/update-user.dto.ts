import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Language } from '../../../utils/email/utils';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  resetToken?: string;
  lastConnectedAt?: Date;
  preferredLanguage?: Language;
}
