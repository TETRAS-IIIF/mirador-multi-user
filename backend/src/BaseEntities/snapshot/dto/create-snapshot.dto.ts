import { ApiProperty } from '@nestjs/swagger';

export class CreateSnapshotDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  hash: string;

  @ApiProperty()
  creator?: string;

  @ApiProperty()
  creatorId?: number;

  @ApiProperty()
  projectId: number;
}
