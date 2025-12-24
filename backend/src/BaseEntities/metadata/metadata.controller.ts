import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { CreateMetadataDto } from './dto/create-metadata.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { ObjectTypes } from '../../enum/ObjectTypes';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @ApiOperation({ summary: 'InitMetadataForObject' })
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createMetadataDto: CreateMetadataDto) {
    return this.metadataService.create(createMetadataDto);
  }

  @ApiOperation({ summary: 'GetMetadataForObject' })
  @UseGuards(AuthGuard)
  @Get('/:objectType/:objectId')
  async getMetadataForObject(
    @Param('objectType') objectType: ObjectTypes,
    @Param('objectId') objectId: number,
  ) {
    return await this.metadataService.getMetadataForObjectId(
      objectType,
      objectId,
    );
  }
}
