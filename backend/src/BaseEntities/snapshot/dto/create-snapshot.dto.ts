import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateSnapshotDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  hash: string;

  @ApiProperty()
  @IsNumber()
  creatorId?: number;

  @ApiProperty()
  @IsNumber()
  projectId: number;
}
