import {
  ForbiddenException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateLinkMediaGroupDto } from './dto/create-link-media-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkMediaGroup } from './entities/link-media-group.entity';
import { Repository } from 'typeorm';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { MediaService } from '../../BaseEntities/media/media.service';
import { MediaGroupRights, ITEM_RIGHTS_PRIORITY } from '../../enum/rights';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { CreateMediaDto } from '../../BaseEntities/media/dto/create-media.dto';
import { AddMediaToGroupDto } from './dto/addMediaToGroupDto';
import { join } from 'path';
import * as fs from 'fs';
import { ActionType } from '../../enum/actions';
import { mediaOrigin } from '../../enum/origins';
import { LinkUserGroupService } from '../link-user-group/link-user-group.service';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { UserGroupTypes } from '../../enum/user-group-types';
import { Project } from '../../BaseEntities/project/entities/project.entity';
import { Media } from '../../BaseEntities/media/entities/media.entity';

@Injectable()
export class LinkMediaGroupService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(LinkMediaGroup)
    private readonly linkMediaGroupRepository: Repository<LinkMediaGroup>,
    private readonly groupService: UserGroupService,
    private readonly linkUserGroupService: LinkUserGroupService,
    @Inject(forwardRef(() => MediaService))
    private readonly mediaService: MediaService,
  ) {}

  async create(createLinkMediaGroupDto: CreateLinkMediaGroupDto) {
    try {
      const linkMediaGroup: LinkMediaGroup =
        this.linkMediaGroupRepository.create({ ...createLinkMediaGroupDto });
      return await this.linkMediaGroupRepository.upsert(linkMediaGroup, {
        conflictPaths: ['rights', 'media', 'user_group'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the linkMediaGroup',
        error,
      );
    }
  }

  async createMedia(mediaDto: CreateMediaDto) {
    try {
      const { idCreator, path, user_group } = mediaDto;
      const media = await this.mediaService.create(mediaDto);
      await this.addMediaToGroup({
        userGroupId: user_group.id,
        mediasId: [media.id],
        rights: MediaGroupRights.ADMIN,
      });
      const toReturn = await this.getMediaRightsForUser(
        user_group.id,
        media.id,
      );
      return toReturn;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the media',
        error,
      );
    }
  }

  async addMediaToGroup(dto: AddMediaToGroupDto) {
    const { mediasId, userGroupId } = dto;
    try {
      const mediasForGroup = [];
      for (const mediaId of mediasId) {
        const media = await this.mediaService.findOne(mediaId);
        if (!media) {
          throw new InternalServerErrorException(
            `Project with id ${mediaId} not found`,
          );
        }

        const group = await this.groupService.findUserGroupById(userGroupId);
        await this.create({
          rights: dto.rights ? dto.rights : MediaGroupRights.READER,
          user_group: group,
          media: media,
        });
        const groupsForMedia = await this.getAllMediaGroup(mediaId);
        mediasForGroup.push(groupsForMedia);
      }
      return mediasForGroup;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while adding media to Group',
        error,
      );
    }
  }

  async getMediaRightsForUser(userGroupId: number, mediaId: number) {
    try {
      const media = await this.findAllMediaGroupByUserGroupId(userGroupId);
      return media.find((linkMediaGroup) => linkMediaGroup.media.id == mediaId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while getting media rights for user',
        error,
      );
    }
  }

  async getAllMediaGroup(mediaId: number) {
    try {
      const toReturn = await this.findAllUserGroupByMediaId(mediaId);
      return toReturn;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while getting all group for media : ${mediaId}`,
        error,
      );
    }
  }

  async getAllMediasForUser(userId: number) {
    try {
      const usersGroups =
        await this.linkUserGroupService.findALlGroupsForUser(userId);
      const mediasMap: Map<number, Media & { rights: string; share?: string }> =
        new Map();

      for (const userGroup of usersGroups) {
        const linkMediaGroups: LinkMediaGroup[] =
          await this.findAllMediaByUserGroupId(userGroup.id);
        for (const linkMediaGroup of linkMediaGroups) {
          const media = linkMediaGroup.media;
          const mediaId = media.id;
          const currentRights = ITEM_RIGHTS_PRIORITY[linkMediaGroup.rights];
          const existingMedia = mediasMap.get(mediaId);
          const personalOwnerGroup =
            await this.groupService.findUserPersonalGroup(media.idCreator);
          const mediaData = {
            ...media,
            rights: linkMediaGroup.rights,
            shared: Number(media.idCreator) !== Number(userId),
            ...(linkMediaGroup.user_group.type ===
              UserGroupTypes.MULTI_USER && { share: 'group' }),
            personalOwnerGroupId: personalOwnerGroup.id,
          };

          if (
            !existingMedia ||
            currentRights > ITEM_RIGHTS_PRIORITY[existingMedia.rights]
          ) {
            mediasMap.set(mediaId, mediaData);
          }
        }
      }
      return Array.from(mediasMap.values());
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while getting all medias for user',
        error,
      );
    }
  }

  async removeMedia(mediaId: number) {
    try {
      const mediaToRemove = await this.mediaService.findOne(mediaId);
      if (!mediaToRemove) {
        throw new HttpException('Media not found', HttpStatus.NOT_FOUND);
      }
      if (mediaToRemove.origin === mediaOrigin.UPLOAD) {
        const filePath = join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'upload',
          mediaToRemove.hash,
          mediaToRemove.path,
        );
        const thumbnailPath = join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'upload',
          mediaToRemove.hash,
          'thumbnail.webp',
        );
        if (fs.existsSync(filePath) && fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(filePath);
          fs.unlinkSync(thumbnailPath);
          const dirPath = join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'upload',
            mediaToRemove.hash,
          );
          if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
            fs.rmdirSync(dirPath);
          }
        }
      }
      if (mediaToRemove.origin === mediaOrigin.LINK && mediaToRemove.hash) {
        const thumbnailPath = join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'upload',
          mediaToRemove.hash,
          'thumbnail.webp',
        );
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          const dirPath = join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'upload',
            mediaToRemove.hash,
          );
          if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
            fs.rmdirSync(dirPath);
          }
        }
      }
      await this.mediaService.remove(mediaId);
      return {
        status: HttpStatus.OK,
        message: 'File and associated records deleted successfully',
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(
        `An error occurred while removing media with id: ${mediaId}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateMedia(updateGroupMediaDto) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rights, ...mediaUpdateData } = updateGroupMediaDto;

      return await this.mediaService.update(
        updateGroupMediaDto.id,
        mediaUpdateData,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(
        `An error occurred while updating media with id: ${updateGroupMediaDto.id}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeAccessToMedia(mediaId: number, userGroupId: number) {
    try {
      const userGroupMedias = await this.findAllMediaByUserGroupId(userGroupId);
      const mediaToRemove = userGroupMedias.find(
        (userGroupMedia) => userGroupMedia.media.id == mediaId,
      );
      if (!mediaToRemove) {
        throw new NotFoundException(
          `No association between Media with ID ${mediaId} and group with ID ${userGroupId}`,
        );
      }
      return await this.removeMediaGroupRelation(mediaToRemove.id, userGroupId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while removing link between media and group : ${error.message}`,
      );
    }
  }

  async findAllMediaByUserGroupId(id: number) {
    try {
      const request = await this.linkMediaGroupRepository.find({
        where: { user_group: { id } },
        relations: ['user_group'],
      });
      return request.map((linkGroup: LinkMediaGroup) => ({
        ...linkGroup,
      }));
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while finding all Project for this Group id : ${id}`,
        error,
      );
    }
  }

  async findAllUserGroupByMediaId(mediaId: number) {
    try {
      const request = await this.linkMediaGroupRepository.find({
        where: { media: { id: mediaId } },
        relations: ['user_group', 'media'],
      });
      return request.map((linkGroup: LinkMediaGroup) => linkGroup);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while finding all Group for this media id : ${mediaId}`,
        error,
      );
    }
  }

  async findAllMediaGroupByUserGroupId(userGroupId: number) {
    try {
      return await this.linkMediaGroupRepository.find({
        where: { user_group: { id: userGroupId } },
        relations: ['media'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `an error occurred whild finding all MediaGroup for this userGroup : ${userGroupId}`,
        error,
      );
    }
  }

  async updateMediaGroupRelation(
    mediaId: number,
    groupId: number,
    rights: MediaGroupRights,
    userId: number,
  ) {
    try {
      const userRightOnMedia = await this.getHighestRightForMedia(
        userId,
        mediaId,
      );
      const userToUpdateRights = await this.getHighestRightForMedia(
        groupId,
        mediaId,
      );
      if (
        ITEM_RIGHTS_PRIORITY[userRightOnMedia.rights] <
        ITEM_RIGHTS_PRIORITY[userToUpdateRights.rights]
      ) {
        throw new ForbiddenException(
          'You cannot modify a user with higher privileges.',
        );
      }
      const linkMediaGroupToUpdate =
        await this.linkMediaGroupRepository.findOne({
          where: {
            media: { id: mediaId },
            user_group: { id: groupId },
          },
        });

      if (!linkMediaGroupToUpdate) {
        throw new NotFoundException('no matching LinkMediaGroup found');
      }

      linkMediaGroupToUpdate.rights = rights;

      return await this.linkMediaGroupRepository.save(linkMediaGroupToUpdate);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          'You cannot modify a user with higher privileges.',
        );
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the linkMediaGroup',
        error,
      );
    }
  }

  async removeMediaGroupRelation(mediaId: number, groupId: number) {
    try {
      const done = await this.linkMediaGroupRepository.delete({
        media: { id: mediaId },
        user_group: { id: groupId },
      });
      if (done.affected != 1) throw new NotFoundException(mediaId);
      return done;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while removing the linkMediaGroup',
        error,
      );
    }
  }

  async getHighestRightForMedia(userId: number, mediaId: number) {
    const userPersonalGroup: UserGroup =
      await this.groupService.findUserPersonalGroup(userId);

    const userGroups: UserGroup[] =
      await this.linkUserGroupService.findALlGroupsForUser(userId);

    const allGroups = [...userGroups, userPersonalGroup];

    if (allGroups.length === 0) {
      return;
    }

    let linkEntities = [];
    for (const group of allGroups) {
      const linkGroups = await this.linkMediaGroupRepository.find({
        where: {
          user_group: { id: group.id },
          media: { id: mediaId },
        },
        relations: ['media', 'user_group'],
      });

      linkEntities = linkEntities.concat(linkGroups);
    }

    if (linkEntities.length === 0) {
      return null;
    }

    return linkEntities.reduce((prev, current) => {
      const prevRight = ITEM_RIGHTS_PRIORITY[prev.rights] || 0;
      const currentRight = ITEM_RIGHTS_PRIORITY[current.rights] || 0;
      return currentRight > prevRight ? current : prev;
    });
  }

  async checkPolicies(
    action: string,
    userId: number,
    manifestId: number,
    callback: (linkEntity: LinkMediaGroup) => any,
  ) {
    try {
      const linkEntity = await this.getHighestRightForMedia(userId, manifestId);

      if (!linkEntity) {
        throw new ForbiddenException(
          'User does not have access to this media or the media does not exist',
        );
      }
      switch (action) {
        case ActionType.READ:
          if (
            [
              MediaGroupRights.READER,
              MediaGroupRights.ADMIN,
              MediaGroupRights.EDITOR,
            ].includes(linkEntity.rights)
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.UPDATE:
          if (
            [MediaGroupRights.ADMIN, MediaGroupRights.EDITOR].includes(
              linkEntity.rights,
            )
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.DELETE:
          if (linkEntity.rights === MediaGroupRights.ADMIN) {
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

  async removeMediaFromUser(mediaId: number, userId: number) {
    try {
      const personalGroup =
        await this.groupService.findUserPersonalGroup(userId);
      return await this.removeAccessToMedia(mediaId, personalGroup.id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }
}
