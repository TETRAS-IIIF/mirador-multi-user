import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateLinkMetadataFormatGroupDto } from './dto/create-link-metadata-format-group.dto';
import { MetadataFormatService } from '../../BaseEntities/metadata-format/metadata-format.service';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkMetadataFormatGroup } from './entities/link-metadata-format-group.entity';
import { Repository } from 'typeorm';
import { MetadataFormat } from '../../BaseEntities/metadata-format/entities/metadata-format.entity';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';

@Injectable()
export class LinkMetadataFormatGroupService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(LinkMetadataFormatGroup)
    private readonly linkMetadataFormatGroupRepository: Repository<LinkMetadataFormatGroup>,
    private readonly metadataFormat: MetadataFormatService,
    private readonly groupService: UserGroupService,
  ) {}

  async create(metadataFormat: MetadataFormat, userPersonalGroup: UserGroup) {
    try {
      const linkMetadataGroup = this.linkMetadataFormatGroupRepository.create({
        metadataFormat: metadataFormat,
        user_group: userPersonalGroup,
      });
      return await this.linkMetadataFormatGroupRepository.save(
        linkMetadataGroup,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the link metadata format to group.',
        error,
      );
    }
  }

  async createMetadataFormat(
    createLinkMetadataFormatGroupDto: CreateLinkMetadataFormatGroupDto,
  ) {
    try {
      const userGroup = await this.groupService.findUserPersonalGroup(
        createLinkMetadataFormatGroupDto.creatorId,
      );
      const metadataFormat = await this.metadataFormat.create(
        createLinkMetadataFormatGroupDto,
      );
      return await this.create(metadataFormat, userGroup);
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictException(
          'metadata format with the given title and creatorId already exists.',
        );
      }
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the metadata format.',
        error,
      );
    }
  }

  async findMetadataFormatWithTitle(
    metadataFormatTitle: string,
    userId: number,
  ) {
    try {
      // Retrieve user's personal group
      const userPersonalGroup =
        await this.groupService.findUserPersonalGroup(userId);
      if (!userPersonalGroup) {
        throw new NotFoundException(
          `User personal group not found for user ID ${userId}`,
        );
      }

      const result = await this.linkMetadataFormatGroupRepository
        .createQueryBuilder('linkMetadataFormatGroup')
        .leftJoinAndSelect(
          'linkMetadataFormatGroup.metadataFormat',
          'metadataFormat',
        )
        .where('linkMetadataFormatGroup.userGroupId = :userGroupId', {
          userGroupId: userPersonalGroup.id,
        })
        .andWhere('metadataFormat.title = :metadataFormatTitle', {
          metadataFormatTitle,
        })
        .getOne();
      if (!result) {
        this.logger.warn(
          `No metadata formats found with title "${metadataFormatTitle}" for user ID ${userId}`,
        );
        throw new NotFoundException(
          `No metadata formats found with title "${metadataFormatTitle}"`,
        );
      }
      return result.metadataFormat;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while finding the metadata format.',
        error,
      );
    }
  }

  async getMetadataFormatForUser(userId: number) {
    try {
      const format = await this.linkMetadataFormatGroupRepository.find({
        where: {
          user_group: {
            ownerId: userId,
          },
        },
      });

      return format.map((item) => item.metadataFormat);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while finding the metadata format.',
        error,
      );
    }
  }
}
