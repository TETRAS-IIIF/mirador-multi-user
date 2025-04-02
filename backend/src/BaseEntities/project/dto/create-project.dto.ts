import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsObject()
  userWorkspace?: any;

  ownerId: number;

  @IsObject()
  metadata: any;

  description?: string;
  thumbnailUrl?: string;
}
