import { z, ZodType } from 'zod';
import { UserGroup } from '../../user-group/types/types.ts';
import { PASSWORD_MINIMUM_LENGTH } from '../../../utils/utils.ts';

export type User = {
  access_token: string;
  id: number;
  mail: string;
  name: string;
  userGroups: UserGroup[];
  _isAdmin: boolean;
  isEmailConfirmed: boolean;
  createdAt: Date;
  preferredLanguage: string;
  termsValidatedAt: Date;
};

export type UpdateUserDto = {
  mail?: string;
  name?: string;
  password?: string;
  newPassword?: string;
};

export type UserResponse = {
  access_token: string;
  user: User;
};

export type RegisterFormData = {
  name: string;
  mail: string;
  password: string;
  confirmPassword: string;
};

export type LoginFormData = {
  mail: string;
  password: string;
};

export const UserSchema: ZodType<RegisterFormData> = z
  .object({
    mail: z
      .string({
        required_error: 'email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email(),
    name: z.string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    }),
    password: z.string().min(PASSWORD_MINIMUM_LENGTH, { message: 'Password is too short' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const LoginSchema: ZodType<LoginFormData> = z.object({
  mail: z
    .string({
      required_error: 'email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email(),
  password: z.string().min(PASSWORD_MINIMUM_LENGTH, { message: 'Password is too short' }),
});
