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
        metadataFormat: item.metadataFormat,
      }));
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while looking for metadata with id: ${objectId} and type : ${objectType}, ${error.message}`,
      );
    }
  }

  async duplicateMetadata(
    objectType: ObjectTypes,
    objectToDuplicateId: number,
    newObjectId: number,
  ) {
    try {
      const metadataToDuplicate = await this.getMetadataForObjectId(
        objectType,
        objectToDuplicateId,
      );
      console.log('--------metadataToDuplicate--------');
      console.log(metadataToDuplicate[0]);

      const metadata = this.metadataRepository.create({
        objectType: objectType,
        objectId: newObjectId,
        metadataFormat: metadataToDuplicate[0].metadataFormat,
        metadata: metadataToDuplicate[0].metadata,
      });
      const duplicatedMetadata = await this.metadataRepository.upsert(
        metadata,
        {
          conflictPaths: ['objectType', 'objectId', 'metadataFormat'],
        },
      );

      console.log("--------duplicatedMetadata--------")
      console.log(duplicatedMetadata)
      return this.metadataRepository.findOne({
        where: { id: duplicatedMetadata.identifiers[0].id },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while duplicating for metadata with id: ${objectToDuplicateId} and type : ${objectType} for new objectId : ${newObjectId}, ${error.message}`,
      );
    }
  }
}
