import { IsString } from 'class-validator';

export class loginDto {
  @IsString()
  mail: string;

  @IsString()
  password: string;

  isImpersonate?: string;
}
