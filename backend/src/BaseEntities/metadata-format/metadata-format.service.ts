import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateMetadataFormatDto } from './dto/create-metadata-format.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MetadataFormat } from './entities/metadata-format.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';

@Injectable()
export class MetadataFormatService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(MetadataFormat)
    private readonly metadataFormatRepository: Repository<MetadataFormat>,
  ) {}

  async create(createMetadataFormatDto: CreateMetadataFormatDto) {
    try {
      return await this.metadataFormatRepository.save(createMetadataFormatDto);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'metadata format with the given title and creatorId already exists.',
        );
      }

      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the metadata format.',
      );
    }
  }

  async findAllMetadataFormatsForUser(
    userId: number,
  ): Promise<MetadataFormat[]> {
    try {
      return await this.metadataFormatRepository.find({
        where: { creatorId: userId },
      });
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while finding the metadata format for user with id : ${userId}.`,
      );
    }
  }
}
