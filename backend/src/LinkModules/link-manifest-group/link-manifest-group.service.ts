import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkManifestGroup } from './entities/link-manifest-group.entity';
import { Repository } from 'typeorm';
import { ManifestGroupRights, ITEM_RIGHTS_PRIORITY } from '../../enum/rights';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { Manifest } from '../../BaseEntities/manifest/entities/manifest.entity';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { ManifestService } from '../../BaseEntities/manifest/manifest.service';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { AddManifestToGroupDto } from './dto/add-manifest-to-group.dto';
import { join } from 'path';
import * as fs from 'fs';
import { UpdateManifestGroupRelation } from './dto/update-manifest-group-Relation';
import { UpdateManifestDto } from '../../BaseEntities/manifest/dto/update-manifest.dto';
import { ActionType } from '../../enum/actions';
import { UpdateManifestJsonDto } from './dto/UpdateManifestJsonDto';
import * as path from 'node:path';
import { manifestOrigin } from '../../enum/origins';
import { UPLOAD_FOLDER } from '../../utils/constants';
import { LinkUserGroupService } from '../link-user-group/link-user-group.service';
import { UserGroupTypes } from '../../enum/user-group-types';

@Injectable()
export class LinkManifestGroupService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(LinkManifestGroup)
    private readonly linkManifestGroupRepository: Repository<LinkManifestGroup>,
    private readonly manifestService: ManifestService,
    private readonly groupService: UserGroupService,
    private readonly linkUserGroupService: LinkUserGroupService,
  ) {}

  async createManifest(createManifestDto) {
    try {
      const userGroup = await this.groupService.findUserPersonalGroup(
        createManifestDto.idCreator,
      );
      const manifestCreation = await this.manifestService.create({
        origin: createManifestDto.origin,
        description: createManifestDto.description,
        title: createManifestDto.title,
        idCreator: createManifestDto.idCreator,
        url: createManifestDto.url ? createManifestDto.url : null,
        path: createManifestDto.path ? createManifestDto.path : null,
        hash: createManifestDto.hash ? createManifestDto.hash : null,
        metadata: {},
      });
      return this.create({
        ...createManifestDto,
        manifest: manifestCreation,
        user_group: userGroup,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating linkGroupManifest, ${error.message}`,
      );
    }
  }

  async create(createLinkGroupManifestDto) {
    try {
      const linkGroupManifest: LinkManifestGroup =
        this.linkManifestGroupRepository.create({
          manifest: createLinkGroupManifestDto.manifest,
          user_group: createLinkGroupManifestDto.user_group,
          rights: createLinkGroupManifestDto.rights,
        });
      return await this.linkManifestGroupRepository.upsert(linkGroupManifest, {
        conflictPaths: ['rights', 'manifest', 'user_group'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating linkGroupManifest, ${error.message}`,
      );
    }
  }

  async addManifestToGroup(addManifestToGroupDto: AddManifestToGroupDto) {
    const { userGroupId, manifestId } = addManifestToGroupDto;
    try {
      const manifestsForGroup = [];
      const manifest = await this.manifestService.findOne(manifestId);
      const group = await this.groupService.findOne(userGroupId);
      if (!manifest) {
        throw new InternalServerErrorException(
          `Project with id ${manifestId} not found`,
        );
      }
      await this.create({
        rights: addManifestToGroupDto.rights
          ? addManifestToGroupDto.rights
          : ManifestGroupRights.READER,
        user_group: group,
        manifest: manifest,
      });

      const groupForManifest = await this.getAllManifestsGroup(manifestId);
      manifestsForGroup.push(groupForManifest);
      return manifestsForGroup;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An Error occurred while adding manifests to userGroup with id ${userGroupId} : ${error.message}`,
      );
    }
  }

  async getAllManifestsGroup(manifestId: number) {
    try {
      return await this.findAllUserGroupByManifestId(manifestId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while getting all manifests group',
        error.message,
      );
    }
  }
  async updateManifest(updateManifestDto: UpdateManifestDto) {
    try {
      return await this.manifestService.update(
        updateManifestDto.id,
        updateManifestDto,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while updating manifest with id ${updateManifestDto.id}`,
        error.message,
      );
    }
  }

  private writeJsonFile(filePath: string, data: any): void {
    try {
      const absolutePath = path.resolve(filePath);
      fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Error writing file at ${filePath}: ${error.message}`);
    }
  }

  async updateManifestJson(updateManifestJsonDto: UpdateManifestJsonDto) {
    try {
      if (updateManifestJsonDto.origin === manifestOrigin.LINK) {
        throw new UnsupportedMediaTypeException(
          "Manifests linked can't be updated",
        );
      }

      // Build the path to the file
      const path = `${UPLOAD_FOLDER}/${updateManifestJsonDto.hash}/${updateManifestJsonDto.path}`;

      // Overwrite the file with the new JSON data
      this.writeJsonFile(path, updateManifestJsonDto.json);

      return { message: 'JSON file replaced successfully' };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while updating manifest with ID ${updateManifestJsonDto.id}`,
        error.message,
      );
    }
  }

  async removeManifest(manifestId: number) {
    try {
      const manifestToRemove = await this.manifestService.findOne(manifestId);
      if (!manifestToRemove) {
        throw new HttpException('Manifest not found', HttpStatus.NOT_FOUND);
      }
      if (manifestToRemove.origin === manifestOrigin.UPLOAD) {
        const filePath = join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'upload',
          manifestToRemove.hash,
          manifestToRemove.path,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          const dirPath = join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'upload',
            manifestToRemove.hash,
          );
          if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
            fs.rmdirSync(dirPath);
          }
        }
      }
      await this.manifestService.remove(manifestId);
      return {
        status: HttpStatus.OK,
        message: 'File and associated records deleted successfully',
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while removing manifest with id ${manifestId}`,
        error.message,
      );
    }
  }

  async updateAccessToManifest(
    updateManifestGroupRelation: UpdateManifestGroupRelation,
    userId: number,
  ) {
    try {
      const userRightsOnManifest = await this.getHighestRightForManifest(
        userId,
        updateManifestGroupRelation.manifestId,
      );
      const userToUpdateRights = await this.getHighestRightForManifest(
        updateManifestGroupRelation.userGroupId,
        updateManifestGroupRelation.manifestId,
      );
      if (
        ITEM_RIGHTS_PRIORITY[userRightsOnManifest.rights] <
        ITEM_RIGHTS_PRIORITY[userToUpdateRights.rights]
      ) {
        throw new ForbiddenException(
          'ou cannot modify a user with higher privileges.',
        );
      }
      const { manifestId, userGroupId, rights } = updateManifestGroupRelation;
      const manifestToUpdate = await this.manifestService.findOne(manifestId);
      const groupToUpdate = await this.groupService.findOne(userGroupId);
      return this.updateManifestGroupRelation(
        manifestToUpdate,
        groupToUpdate,
        rights,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          'You cannot modify a user with higher privileges.',
        );
      }
      throw new InternalServerErrorException(
        `an error occurred while updating access to manifest with id ${updateManifestGroupRelation.manifestId}, for the group with id ${updateManifestGroupRelation.userGroupId}`,
        error.message,
      );
    }
  }

  async removeAccessToManifest(manifestId: number, userGroupId: number) {
    try {
      const userGroupManifests =
        await this.findAllGroupManifestByUserGroupId(userGroupId);
      const manifestToRemove = userGroupManifests.find(
        (userGroupManifest) => userGroupManifest.manifest.id == manifestId,
      );
      if (!manifestToRemove) {
        throw new NotFoundException(
          `No association between Manifest with ID ${manifestId} and group with ID ${userGroupId}`,
        );
      }
      return await this.removeManifestGroupRelation(
        manifestToRemove.id,
        userGroupId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while removing link between manifest and group : ${error.message}`,
      );
    }
  }

  async findAllUserGroupByManifestId(manifestId: number) {
    try {
      const request = await this.linkManifestGroupRepository.find({
        where: { manifest: { id: manifestId } },
        relations: ['user_group', 'manifest'],
      });
      return request.map((linkGroup: LinkManifestGroup) => linkGroup);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding all User Group for Manifest with id ${manifestId}, ${error.message}`,
      );
    }
  }

  async findAllGroupManifestByUserGroupId(
    userGroupId: number,
  ): Promise<LinkManifestGroup[]> {
    try {
      return await this.linkManifestGroupRepository.find({
        where: { user_group: { id: userGroupId } },
        relations: ['manifest', 'user_group'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding all Manife for Manifest with id ${userGroupId}, ${error.message}`,
      );
    }
  }

  async findAllManifestByUserId(userId: number) {
    try {
      const userGroups =
        await this.linkUserGroupService.findALlGroupsForUser(userId);

      const manifestsMap: Map<
        number,
        Manifest & { rights: string; share?: string }
      > = new Map();

      for (const userGroup of userGroups) {
        const groupManifests = await this.findAllGroupManifestByUserGroupId(
          userGroup.id,
        );
        for (const groupManifest of groupManifests) {
          const manifest = groupManifest.manifest;
          const currentRights = ITEM_RIGHTS_PRIORITY[groupManifest.rights] || 0;

          const existingManifest = manifestsMap.get(manifest.id);
          const personalOwnerGroup =
            await this.groupService.findUserPersonalGroup(
              groupManifest.manifest.idCreator,
            );

          const manifestData = {
            ...manifest,
            rights: groupManifest.rights,
            shared: Number(manifest.idCreator) !== Number(userId),
            ...(groupManifest.user_group.type === UserGroupTypes.MULTI_USER && {
              share: 'group',
            }),
            personalOwnerGroupId: personalOwnerGroup.id,
          };
          if (
            !existingManifest ||
            currentRights > ITEM_RIGHTS_PRIORITY[existingManifest.rights]
          ) {
            manifestsMap.set(manifest.id, manifestData);
          }
        }
      }

      return Array.from(manifestsMap.values());
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding manifest for userGroup with id ${userId}`,
        error.message,
      );
    }
  }

  async updateManifestGroupRelation(
    manifest: Manifest,
    group: UserGroup,
    rights: ManifestGroupRights,
  ) {
    try {
      const linkManifestGroupsToUpdate =
        await this.linkManifestGroupRepository.find({
          where: {
            manifest: { id: manifest.id },
            user_group: { id: group.id },
          },
        });
      let linkManifestGroup;
      if (linkManifestGroupsToUpdate.length > 0) {
        linkManifestGroup = this.linkManifestGroupRepository.create({
          ...linkManifestGroupsToUpdate[0],
          rights: rights,
        });
      } else {
        linkManifestGroup = this.linkManifestGroupRepository.create({
          manifest: manifest,
          user_group: group,
          rights: rights,
        });
      }
      return await this.linkManifestGroupRepository.upsert(linkManifestGroup, {
        conflictPaths: ['rights', 'manifest', 'user_group'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while updating the linkManifestGroup',
        error.message,
      );
    }
  }

  async removeManifestGroupRelation(manifestId: number, groupId: number) {
    try {
      const done = await this.linkManifestGroupRepository.delete({
        manifest: { id: manifestId },
        user_group: { id: groupId },
      });
      if (done.affected != 1) throw new NotFoundException(manifestId);
      return done;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while removing the linkManifestGroup',
        error.message,
      );
    }
  }

  async getHighestRightForManifest(userId: number, manifestId: number) {
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
      const linkGroups = await this.linkManifestGroupRepository.find({
        where: {
          user_group: { id: group.id },
          manifest: { id: manifestId },
        },
        relations: ['manifest', 'user_group'],
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
    callback: (linkEntity: LinkManifestGroup) => any,
  ) {
    try {
      const linkEntity = await this.getHighestRightForManifest(
        userId,
        manifestId,
      );

      if (!linkEntity) {
        return new ForbiddenException(
          'User does not have access to this manifest or the manifest does not exist',
        );
      }
      switch (action) {
        case ActionType.READ:
          if (
            [
              ManifestGroupRights.READER,
              ManifestGroupRights.ADMIN,
              ManifestGroupRights.EDITOR,
            ].includes(linkEntity.rights)
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.UPDATE:
          if (
            [ManifestGroupRights.ADMIN, ManifestGroupRights.EDITOR].includes(
              linkEntity.rights,
            )
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.DELETE:
          if (linkEntity.rights === ManifestGroupRights.ADMIN) {
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

  async removeManifestFromUser(manifestId: number, userId: number) {
    try {
      const personalGroup =
        await this.groupService.findUserPersonalGroup(userId);
      return await this.removeAccessToManifest(manifestId, personalGroup.id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }
}
