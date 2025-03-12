import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMetadataDto } from './dto/create-metadata.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Metadata } from './entities/metadata.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { LinkMetadataFormatGroupService } from '../../LinkModules/link-metadata-format-group/link-metadata-format-group.service';
import { ObjectTypes } from '../../enum/ObjectTypes';

@Injectable()
export class MetadataService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Metadata)
    private readonly metadataRepository: Repository<Metadata>,
    private readonly linkMetadataFormatGroup: LinkMetadataFormatGroupService,
  ) {}

  async create(createMetadataDto: CreateMetadataDto) {
    try {
      const format =
        await this.linkMetadataFormatGroup.findMetadataFormatWithTitle(
          createMetadataDto.metadataFormatTitle,
          createMetadataDto.ownerId,
        );
      if (!format) {
        throw new NotFoundException(
          `Metadata format with title '${createMetadataDto.metadataFormatTitle}' not found for user ID ${createMetadataDto.ownerId}.`,
        );
      }

      const metadata = this.metadataRepository.create({
        objectType: createMetadataDto.objectTypes,
        objectId: createMetadataDto.objectId,
        metadataFormat: format,
        metadata: createMetadataDto.metadata,
      });
      return await this.metadataRepository.upsert(metadata, {
        conflictPaths: ['objectType', 'objectId', 'metadataFormat'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating metadata, ${error.message}`,
      );
    }
  }

  async getMetadataForObjectId(objectType: ObjectTypes, objectId: number) {
    try {
      const metadatas = await this.metadataRepository.find({
        where: { objectType: objectType, objectId: objectId },
        relations: ['metadataFormat'],
      });
      return metadatas.map((item) => ({
        metadata: item.metadata,
        title: item.metadataFormat.title,
      }));
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while looking for metadata with id: ${objectId} and type : ${objectType}, ${error.message}`,
      );
    }
  }
}
