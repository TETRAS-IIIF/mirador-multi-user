import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateManifestDto } from './dto/create-manifest.dto';
import { UpdateManifestDto } from './dto/update-manifest.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Manifest } from './entities/manifest.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';

@Injectable()
export class ManifestService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Manifest)
    private readonly manifestRepository: Repository<Manifest>,
  ) {}

  async create(createManifestDto: CreateManifestDto) {
    try {
      const manifest = this.manifestRepository.create({ ...createManifestDto });
      return await this.manifestRepository.save(manifest);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating manifest, ${error.message}`,
      );
    }
  }

  findAll() {
    return `This action returns all manifest`;
  }

  async findOne(manifestId: number) {
    try {
      return await this.manifestRepository.findOneBy({ id: manifestId });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding manifest with id ${manifestId}`,
        error.message,
      );
    }
  }

  async update(id: number, updateManifestDto: UpdateManifestDto) {
    try {
      const done = await this.manifestRepository.update(id, updateManifestDto);
      if (done.affected != 1) throw new NotFoundException(id);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while updating the manifest with id ${id}`,
        error.message,
      );
    }
  }

  async remove(id: number) {
    try {
      const done = await this.manifestRepository.delete(id);
      if (done.affected != 1) throw new NotFoundException(id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occured while removing manifest with id : ${id}`,
        error.message,
      );
    }
  }

  async findOwnedManifests(userId) {
    try {
      return await this.manifestRepository.find({
        where: { idCreator: userId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(`an error occurred`, error);
    }
  }

  async findManifestsByPartialStringAndUserGroup(
    partialString: string,
    userGroupId: number,
  ) {
    try {
      const partialStringLength = partialString.length;
      return await this.manifestRepository
        .createQueryBuilder('manifest')
        .innerJoin('manifest.linkManifestGroup', 'linkManifestGroup')
        .innerJoin('linkManifestGroup.user_group', 'userGroup')
        .where('userGroup.id = :id', { id: userGroupId })
        .andWhere('LEFT(manifest.title, :length) = :partialString', {
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
}
