import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';

@Injectable()
export class MediaService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDto) {
    try {
      const media = this.mediaRepository.create({
        ...createMediaDto,
        metadata: { creator: createMediaDto.user_group.title },
      });
      return await this.mediaRepository.save(media);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the media',
        error,
      );
    }
  }

  async findAll() {
    try {
      return await this.mediaRepository.find();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while finding all medias',
        error,
      );
    }
  }

  async findOne(id: number) {
    try {
      return await this.mediaRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while finding the media',
        error,
      );
    }
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    try {
      const media = await this.mediaRepository.findOne({ where: { id } });

      if (!media) {
        throw new NotFoundException(`Media with ID ${id} not found`);
      }

      Object.assign(media, updateMediaDto);

      await this.mediaRepository.save(media);

      return this.findOne(id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while updating the media',
        error,
      );
    }
  }

  async remove(id: number) {
    try {
      const done = await this.mediaRepository.delete(id);
      if (done.affected != 1) throw new NotFoundException(id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while removing the media',
        error,
      );
    }
  }

  async findMediasByPartialStringAndUserGroup(
    partialString: string,
    userGroupId: number,
  ) {
    try {
      const partialStringLength = partialString.length;
      return await this.mediaRepository
        .createQueryBuilder('media')
        .innerJoin('media.linkMediaGroup', 'linkMediaGroup')
        .innerJoin('linkMediaGroup.user_group', 'userGroup')
        .where('userGroup.id = :id', { id: userGroupId })
        .andWhere('LEFT(media.title, :length) = :partialString', {
          length: partialStringLength,
          partialString,
        })
        .distinct(true)
        .limit(3)
        .getMany();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred: ${error.message}`,
      );
    }
  }

  async findOwnedMedia(userId) {
    try {
      return await this.mediaRepository.find({
        where: { idCreator: userId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(`an error occurred`, error);
    }
  }
}
