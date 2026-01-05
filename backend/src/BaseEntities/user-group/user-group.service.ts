import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { UserGroupTypes } from '../../enum/user-group-types';

@Injectable()
export class UserGroupService {
  private readonly logger = new CustomLogger();

  //Importing function from LinkTable there cause circular dependencies error, this is described into the wiki there : https://github.com/SCENE-CE/mirador-multi-user/wiki/Backend
  constructor(
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
  ) {}

  async create(createUserGroupDto: CreateUserGroupDto): Promise<UserGroup> {
    try {
      const groupToCreate = {
        ...createUserGroupDto,
        description: 'group description here',
      };
      return await this.userGroupRepository.save(groupToCreate);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating userGroup',
        error,
      );
    }
  }

  async findUserGroupById(userGroupId: number) {
    try {
      return await this.userGroupRepository.findOne({
        where: { id: userGroupId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while find userGroup with ID: ${userGroupId}`,
        error,
      );
    }
  }

  findAll() {
    try {
      return this.userGroupRepository.find();
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  async findOne(id: number) {
    try {
      return await this.userGroupRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  async updateGroup(updateData: UpdateUserGroupDto) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rights, ...data } = updateData;

      const userGroup = await this.userGroupRepository.findOne({
        where: { id: updateData.id },
      });

      if (!userGroup)
        throw new NotFoundException(
          `User group with ID ${updateData.id} not found`,
        );

      Object.assign(userGroup, data);

      await this.userGroupRepository.save(userGroup);

      return this.userGroupRepository.find({
        where: { id: updateData.id },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while updating group with id: ${updateData.id}`,
      );
    }
  }

  async remove(groupId: number) {
    try {
      const deleteData = await this.userGroupRepository.delete(groupId);
      if (deleteData.affected != 1) throw new NotFoundException(groupId);
      return deleteData;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async findUserPersonalGroup(userId: number) {
    try {
      const toreturn = await this.userGroupRepository.findOne({
        where: { ownerId: userId, type: UserGroupTypes.PERSONAL },
      });
      return toreturn;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async findAllOwnedGroups(userId: number) {
    try {
      return await this.userGroupRepository.find({
        where: { ownerId: userId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }
}
