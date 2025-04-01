import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkUserGroup } from './entities/link-user-group.entity';
import { Brackets, Repository } from 'typeorm';
import { CreateLinkUserGroupDto } from './dto/create-link-user-group.dto';
import { UserGroupTypes } from '../../enum/user-group-types';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { ITEM_RIGHTS_PRIORITY, User_UserGroupRights } from '../../enum/rights';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { UsersService } from '../../BaseEntities/users/users.service';
import { CreateUserGroupDto } from '../../BaseEntities/user-group/dto/create-user-group.dto';
import { CreateUserDto } from '../../BaseEntities/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ActionType } from '../../enum/actions';
import { EmailServerService } from '../../utils/email/email.service';
import * as process from 'process';
import { LinkMetadataFormatGroupService } from '../link-metadata-format-group/link-metadata-format-group.service';
import { dublinCoreSample } from '../../utils/metadataSample/dublinCoreSample';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { Language } from '../../utils/email/utils';

@Injectable()
export class LinkUserGroupService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(LinkUserGroup)
    private readonly linkUserGroupRepository: Repository<LinkUserGroup>,
    private readonly groupService: UserGroupService,
    private readonly userService: UsersService,
    private readonly emailService: EmailServerService,
    private readonly metadataFormatGroupService: LinkMetadataFormatGroupService,
  ) {}

  async create(linkUserGroupDto: CreateLinkUserGroupDto) {
    try {
      const userToLink = await this.userService.findOne(
        linkUserGroupDto.userId,
      );
      const groupToLink = await this.groupService.findOne(
        linkUserGroupDto.user_groupId,
      );
      const linkGroup = this.linkUserGroupRepository.create({
        user: userToLink,
        user_group: groupToLink,
        rights: linkUserGroupDto.rights
          ? linkUserGroupDto.rights
          : User_UserGroupRights.READER,
      });
      return await this.linkUserGroupRepository.upsert(linkGroup, {
        conflictPaths: ['user_group', 'user'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the linkUserGroup',
        error,
      );
    }
  }

  async findOne(LinkUserGroupId: number) {
    try {
      return await this.linkUserGroupRepository.findOneBy({
        id: LinkUserGroupId,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `error while looking for linkUserGroupRepository ${LinkUserGroupId}`,
        error,
      );
    }
  }

  async getUserNameWithId(userId: number) {
    try {
      const user = await this.userService.findOne(userId);
      return user.name;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `error while looking for user with id : ${userId}`,
        error,
      );
    }
  }

  async removeGroupFromLinkEntity(groupId: number) {
    try {
      const linkUserGroups = await this.findAllUsersForGroup(groupId);
      for (const linkUserGroup of linkUserGroups) {
        await this.RemoveAccessToUserGroup(groupId, linkUserGroup.user.id);
      }
      return await this.groupService.remove(groupId);
    } catch (error) {
      this.logger.error(error.message, error.stack);

      throw new InternalServerErrorException(error);
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const userToSave = createUserDto;
      const salt = await bcrypt.genSalt();
      userToSave.password = await bcrypt.hash(createUserDto.password, salt);
      const savedUser = await this.userService.create(userToSave);

      const userPersonalGroup = await this.groupService.create({
        title: savedUser.name,
        ownerId: savedUser.id,
        user: savedUser,
        type: UserGroupTypes.PERSONAL,
      });

      await this.create({
        rights: User_UserGroupRights.ADMIN,
        userId: savedUser.id,
        user_groupId: userPersonalGroup.id,
      });

      if (!Boolean(process.env.SMTP_DOMAIN)) {
        return savedUser;
      }
      await this.metadataFormatGroupService.createMetadataFormat({
        title: 'Dublin Core',
        creatorId: savedUser.id,
        metadata: dublinCoreSample,
      });

      await this.sendConfirmationLink(
        savedUser.mail,
        savedUser.preferredLanguage,
      );

      return savedUser;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      if (error.status === 409) {
        this.logger.warn(error.message);
        throw new ConflictException('User creation failed', error.message);
      } else {
        this.logger.error(error.message, error.stack);
        throw new InternalServerErrorException(
          'An error occurred while creating the user',
        );
      }
    }
  }

  public async sendConfirmationLink(email: string, language: string) {
    try {
      const user = await this.userService.findOneByMail(email);
      if (user.isEmailConfirmed && user.termsValidatedAt) {
        throw new BadRequestException('Email and terms already confirmed');
      }
      await this.emailService.sendConfirmationEmail({
        to: user.mail,
        subject: 'Account creation',
        userName: user.name,
        language: language,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while resending the user mail',
      );
    }
  }

  async createUserGroup(
    createUserGroupDto: CreateUserGroupDto,
  ): Promise<UserGroup> {
    try {
      const userGroup = await this.groupService.create({
        ...createUserGroupDto,
        type: UserGroupTypes.MULTI_USER,
      });
      await this.create({
        rights: User_UserGroupRights.ADMIN,
        userId: createUserGroupDto.user.id,
        user_groupId: userGroup.id,
      });

      return userGroup;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating userGroup',
        error,
      );
    }
  }

  async createUserPersonalGroup(
    createUserGroupDto: CreateUserGroupDto,
  ): Promise<UserGroup> {
    try {
      const groupToCreate = {
        ...createUserGroupDto,
        type: UserGroupTypes.PERSONAL,
      };

      const userPersonalGroup = await this.groupService.create(groupToCreate);

      await this.create({
        rights: User_UserGroupRights.ADMIN,
        userId: createUserGroupDto.user.id,
        user_groupId: userPersonalGroup.id,
      });

      return userPersonalGroup;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating userGroup',
        error,
      );
    }
  }

  async getAccessForUserToGroup(userId: number, groupId: number) {
    try {
      return await this.linkUserGroupRepository.findOne({
        where: { user: { id: userId }, user_group: { id: groupId } },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred when trying to get Access for user id : ${userId} to group id : ${groupId}`,
        error,
      );
    }
  }

  async GrantAccessToUserGroup(createUserGroupDto: CreateLinkUserGroupDto) {
    try {
      const userToLink = await this.userService.findOne(
        createUserGroupDto.userId,
      );
      const groupToLink = await this.groupService.findOne(
        createUserGroupDto.user_groupId,
      );
      const linkUserToUserGroup = this.linkUserGroupRepository.create({
        user: userToLink,
        user_group: groupToLink,
        rights: createUserGroupDto.rights
          ? createUserGroupDto.rights
          : User_UserGroupRights.READER,
      });
      await this.linkUserGroupRepository.upsert(linkUserToUserGroup, {
        conflictPaths: ['rights', 'user', 'user_group'],
      });
      return linkUserToUserGroup;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `Granting access to userId : ${createUserGroupDto.user_groupId} to group with id ${createUserGroupDto.user_groupId} failed`,
        error,
      );
    }
  }

  async updateGroup(updateUserGroupDto: UpdateUserGroupDto) {
    try {
      return await this.groupService.updateGroup(updateUserGroupDto);
    } catch (error) {
      console.error(
        `Error updating group with id : ${updateUserGroupDto.id}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error updating group with id : ${updateUserGroupDto.id}.`,
        error,
      );
    }
  }

  async ChangeAccessToUserGroup(
    groupId: number,
    userId: number,
    rights: User_UserGroupRights,
    requestUserId: number,
  ) {
    try {
      const userRightOnGroup = await this.getHighestRightForGroup(
        groupId,
        requestUserId,
      );

      const userToUpdateRights = await this.getHighestRightForGroup(
        groupId,
        userId,
      );

      if (
        ITEM_RIGHTS_PRIORITY[userRightOnGroup.rights] <
        ITEM_RIGHTS_PRIORITY[userToUpdateRights.rights]
      ) {
        throw new ForbiddenException(
          'You cannot modify a user with higher privileges.',
        );
      }
      const linkGroup = await this.linkUserGroupRepository.findOne({
        where: {
          user_group: { type: UserGroupTypes.MULTI_USER, id: groupId },
          user: { id: userId },
        },
        relations: ['user', 'user_group'],
      });

      if (linkGroup.user_group.ownerId === userId) {
        throw new ForbiddenException("You can't change owner rights");
      }
      if (!linkGroup) {
        throw new NotFoundException(`User group with id ${groupId} not found.`);
      }

      linkGroup.rights = rights;

      await this.linkUserGroupRepository.upsert(linkGroup, {
        conflictPaths: ['user', 'user_group'],
      });

      return linkGroup;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          'You cannot modify a user with higher privileges.',
        );
      }
      throw new InternalServerErrorException(
        `Updating access for userId ${userId} to group ${groupId} failed.`,
        error,
      );
    }
  }

  async RemoveAccessToUserGroup(groupId: number, userId: number) {
    try {
      const linkGroupToDelete = await this.linkUserGroupRepository.findOne({
        where: { user: { id: userId }, user_group: { id: groupId } },
      });

      if (!linkGroupToDelete) {
        throw new NotFoundException(
          `No link found between user id: ${userId} and group id: ${groupId}`,
        );
      }

      return await this.linkUserGroupRepository.delete(linkGroupToDelete.id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `Error while removing link between user id: ${userId} and group id: ${groupId}`,
      );
    }
  }

  async findAllUsersForGroup(groupId: number) {
    try {
      const usersInGroup = await this.linkUserGroupRepository.find({
        where: { user_group: { id: groupId } },
        relations: ['user', 'user_group'],
      });

      return await Promise.all(
        usersInGroup.map(async (userGroup) => {
          const personalOwnerGroup =
            await this.groupService.findUserPersonalGroup(userGroup.user.id);
          return { ...userGroup, personalOwnerGroupId: personalOwnerGroup.id };
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `an error occurred while trying to find users for this group ${groupId}`,
        error,
      );
    }
  }

  async findALlGroupsForUser(userId) {
    try {
      const allUserGroups = await this.linkUserGroupRepository.find({
        where: { user: { id: userId } },
        relations: ['user_group'],
      });

      const groupsToReturn = [];

      for (const group of allUserGroups) {
        groupsToReturn.push({
          ...group.user_group,
          rights: group.rights,
          shared: Number(group.user_group.ownerId) !== Number(userId),
        });
      }
      return groupsToReturn;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while trying to find groups for this user id : ${userId}`,
        error,
      );
    }
  }

  async searchForUserGroup(userPartialString: string) {
    try {
      const toReturn = await this.linkUserGroupRepository
        .createQueryBuilder('linkUserGroup')
        .innerJoinAndSelect('linkUserGroup.user', 'user')
        .innerJoinAndSelect('linkUserGroup.user_group', 'userGroup')
        .select([
          'linkUserGroup.id',
          'linkUserGroup.rights',
          'userGroup.id',
          'user.id',
          'user.name',
        ])
        .where('userGroup.type = :type', { type: UserGroupTypes.PERSONAL })
        .andWhere(
          new Brackets((qb) => {
            qb.where('user.name LIKE :userPartialString', {
              userPartialString: `%${userPartialString}%`,
            });
          }),
        )
        .limit(3)
        .getMany();

      return toReturn;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while trying to search for user group with partial title',
        error,
      );
    }
  }

  async searchForGroups(partialGroupName: string) {
    try {
      const query = this.linkUserGroupRepository
        .createQueryBuilder('linkUserGroup')
        .leftJoinAndSelect('linkUserGroup.user_group', 'userGroup')
        .select([
          'linkUserGroup.id',
          'linkUserGroup.rights',
          'userGroup.id',
          'userGroup.title',
          'userGroup.type',
        ])
        .where('LOWER(userGroup.title) LIKE LOWER(:partialString)', {
          partialString: `%${partialGroupName.toLowerCase()}%`,
        })
        .take(3);

      return await query.getMany();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while searching for : ${partialGroupName}`,
        error,
      );
    }
  }

  async findUserPersonalGroup(userId: number): Promise<UserGroup> {
    try {
      const personnalLinkUserGroup = await this.linkUserGroupRepository
        .createQueryBuilder('linkUserGroup')
        .innerJoinAndSelect('linkUserGroup.user', 'user')
        .innerJoinAndSelect('linkUserGroup.user_group', 'group')
        .where('user.id = :userId', { userId })
        .andWhere('group.type = :type', { type: UserGroupTypes.PERSONAL })
        .getOne();
      if (!personnalLinkUserGroup) {
        throw new Error(`No personal group found for user id: ${userId}`);
      }

      return personnalLinkUserGroup.user_group;
    } catch (error) {
      throw new InternalServerErrorException(
        `An error occurred while trying to find the personal group for user id: ${userId}. Error: ${error.message}`,
      );
    }
  }

  async deleteLinkUserGroup(linkUserGroupId: number) {
    try {
      return await this.linkUserGroupRepository.delete(linkUserGroupId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while removing linkUserGroup with id ${linkUserGroupId}`,
        error,
      );
    }
  }

  async getHighestRightForGroup(groupId: number, userId: number) {
    const linkEntities = await this.linkUserGroupRepository.find({
      where: {
        user_group: { id: groupId },
        user: { id: userId },
      },
      relations: ['user', 'user_group'],
    });

    if (linkEntities.length === 0) {
      return;
    }
    const rightsPriority = { Admin: 3, Editor: 2, Reader: 1 };
    return linkEntities.reduce((prev, current) => {
      const prevRight = rightsPriority[prev.rights] || 0;
      const currentRight = rightsPriority[current.rights] || 0;
      return currentRight > prevRight ? current : prev;
    });
  }

  async getAllUsers() {
    try {
      return await this.userService.findAllUsers();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while retrieving all users',
      );
    }
  }

  async checkPolicies(
    action: string,
    userId: number,
    groupId: number,
    callback: (linkEntity: LinkUserGroup) => any,
  ) {
    try {
      const linkEntity = await this.getHighestRightForGroup(groupId, userId);
      if (!linkEntity) {
        return new ForbiddenException(
          'User does not have access to this userGroup or the userGroup does not exist',
        );
      }
      switch (action) {
        case ActionType.READ:
          if (
            [
              User_UserGroupRights.READER,
              User_UserGroupRights.ADMIN,
              User_UserGroupRights.EDITOR,
            ].includes(linkEntity.rights)
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.UPDATE:
          if (
            [User_UserGroupRights.ADMIN, User_UserGroupRights.EDITOR].includes(
              linkEntity.rights,
            )
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.DELETE:
          if (linkEntity.rights === User_UserGroupRights.ADMIN) {
            return callback(linkEntity);
          }
          break;
        case ActionType.ADMIN:
          if (linkEntity.user._isAdmin) {
            return callback(linkEntity);
          }
          break;
        default:
          throw new InternalServerErrorException('Invalid action');
      }
      return new ForbiddenException('User is not allowed to do this action');
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(`an error occurred`, error);
    }
  }

  async updateUserLanguage(userId: number, preferredLanguage: Language) {
    try {
      return await this.userService.updatePreferredLanguage(
        userId,
        preferredLanguage,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException();
    }
  }
}
