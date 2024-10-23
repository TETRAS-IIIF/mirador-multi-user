import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LinkManifestGroupService } from './link-manifest-group.service';
import { AuthGuard } from '../../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { generateAlphanumericSHA1Hash } from '../../utils/hashGenerator';
import * as fs from 'fs';
import { ManifestGroupRights } from '../../enum/rights';
import { manifestOrigin } from '../../enum/origins';
import { MediaInterceptor } from '../../utils/Custom_pipes/manifest-creation.pipe';
import { manifestCreationDto } from './dto/manifestCreationDto';
import { UpdateManifestDto } from '../../BaseEntities/manifest/dto/update-manifest.dto';
import { UpdateManifestGroupRelation } from './dto/update-manifest-group-Relation';
import { AddManifestToGroupDto } from './dto/add-manifest-to-group.dto';
import { ActionType } from '../../enum/actions';
import { CreateGroupManifestDto } from './dto/create-group-manifest.dto';
import { ApiBody } from '@nestjs/swagger';
import { CreateLinkGroupManifestDto } from './dto/CreateLinkGroupManifestDto';

@Controller('link-manifest-group')
export class LinkManifestGroupController {
  constructor(
    private readonly linkManifestGroupService: LinkManifestGroupService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('/group/:userGroupId')
  async getManifestByUserGroupId(@Param('userGroupId') userGroupId: number) {
    return this.linkManifestGroupService.findAllManifestByUserGroupId(
      userGroupId,
    );
  }
  @ApiBody({ type: CreateGroupManifestDto })
  @UseGuards(AuthGuard)
  @Post('/manifest/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const hash = generateAlphanumericSHA1Hash(
            `${file.originalname}${Date.now().toString()}`,
          );
          const uploadPath = `./upload/${hash}`;
          fs.mkdirSync(uploadPath, { recursive: true });
          (req as any).generatedHash = hash;
          callback(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const fileName = file.originalname.replace(/\//g, '');
          cb(null, fileName);
        },
      }),
    }),
  )
  uploadManifest(
    @Body() createGroupManifestDto: CreateGroupManifestDto,
    @Req() req,
    @UploadedFile() file,
  ) {
    console.log('UPLOAD MANIFEST');
    console.log(createGroupManifestDto);
    const manifestToCreate = {
      rights: ManifestGroupRights.ADMIN,
      origin: manifestOrigin.UPLOAD,
      path: `${file.filename}`,
      hash: `${(req as any).generatedHash}`,
      description: 'your manifest description',
      name: file.originalname,
      idCreator: createGroupManifestDto.idCreator,

    };

    return this.linkManifestGroupService.createManifest(manifestToCreate);
  }

  @ApiBody({ type: CreateGroupManifestDto })
  @UseGuards(AuthGuard)
  @Post('/manifest/link')
  linkManifest(@Body() createLinkDto: CreateLinkGroupManifestDto) {
    const manifestToCreate = {
      ...createLinkDto,
      description: 'your manifest description',
      origin: manifestOrigin.LINK,
    };
    return this.linkManifestGroupService.createManifest(manifestToCreate);
  }

  @ApiBody({ type: manifestCreationDto })
  @UseGuards(AuthGuard)
  @Post('/manifest/creation')
  @UseInterceptors(MediaInterceptor)
  async createManifest(@Body() createManifestDto: manifestCreationDto) {
    const label = createManifestDto.name;
    if (!label) {
      throw new BadRequestException('Manifest label is required');
    }

    const hash = generateAlphanumericSHA1Hash(
      `${label}${Date.now().toString()}`,
    );
    const uploadPath = `./upload/${hash}`;
    fs.mkdirSync(uploadPath, { recursive: true });

    try {
      const manifestData = {
        ...createManifestDto.processedManifest,
        id: `${uploadPath}/${label}.json`,
      };
      const manifestJson = JSON.stringify(manifestData);
      const filePath = `${uploadPath}/${label}.json`;
      await fs.promises.writeFile(filePath, manifestJson);

      const manifestToCreate = {
        name: label,
        description: 'your manifest description',
        user_group: createManifestDto.user_group,
        hash: hash,
        path: `${label}.json`,
        idCreator: createManifestDto.idCreator,
        rights: ManifestGroupRights.ADMIN,
        origin: manifestOrigin.CREATE,
        thumbnailUrl: createManifestDto.manifestThumbnail,
      };

      return await this.linkManifestGroupService.createManifest(
        manifestToCreate,
      );
    } catch (error) {
      console.error(`Error occurred while creating manifest: ${error.message}`);
      throw new InternalServerErrorException(
        `An error occurred: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Get('/manifest/:manifestId')
  async getManifestById(@Param('manifestId') manifestId: number) {
    return this.linkManifestGroupService.getAllManifestsGroup(manifestId);
  }

  @SetMetadata('action', ActionType.DELETE)
  @UseGuards(AuthGuard)
  @Delete('/manifest/:manifestId')
  async deleteManifest(
    @Param('manifestId') manifestId: number,
    @Req() request,
  ) {
    return await this.linkManifestGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      manifestId,
      async () => {
        return this.linkManifestGroupService.removeManifest(manifestId);
      },
    );
  }

  @ApiBody({ type: UpdateManifestDto })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('manifest')
  async updateManifest(
    @Body() updateManifestDto: UpdateManifestDto,
    @Req() request,
  ) {
    return await this.linkManifestGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      updateManifestDto.id,
      async () => {
        return this.linkManifestGroupService.updateManifest(updateManifestDto);
      },
    );
  }
  @ApiBody({ type: UpdateManifestGroupRelation })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('/relation')
  async updateManifestGroupRelation(
    @Body() updateManifestGroupRelation: UpdateManifestGroupRelation,
    @Req() request,
  ) {
    const { manifestId, userGroupId, rights } = updateManifestGroupRelation;

    return await this.linkManifestGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      manifestId,
      async () => {
        return this.linkManifestGroupService.updateAccessToManifest({
          manifestId,
          userGroupId,
          rights,
        });
      },
    );
  }
  @ApiBody({ type: AddManifestToGroupDto })
  @UseGuards(AuthGuard)
  @Post('/manifest/add')
  addManifestToGroup(@Body() addManifestToGroup: AddManifestToGroupDto) {
    return this.linkManifestGroupService.addManifestToGroup(addManifestToGroup);
  }

  @SetMetadata('action', ActionType.DELETE)
  @UseGuards(AuthGuard)
  @Delete('/manifest/:manifestId/:groupId')
  async deleteManifestById(
    @Param('manifestId') manifestId: number,
    @Param('groupId') groupId: number,
    @Req() request,
  ) {
    return await this.linkManifestGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      manifestId,
      async () => {
        return await this.linkManifestGroupService.removeAccesToManifest(
          groupId,
          manifestId,
        );
      },
    );
  }
}
