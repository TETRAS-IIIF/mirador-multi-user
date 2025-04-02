import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateLinkGroupManifestDto } from './dto/CreateLinkGroupManifestDto';
import { LinkManifestGroup } from './entities/link-manifest-group.entity';
import { Manifest } from '../../BaseEntities/manifest/entities/manifest.entity';
import { UpdateManifestJsonDto } from './dto/UpdateManifestJsonDto';
import { fileFilterManifest } from './utils/fileFilterManifest';
import { serializeToValidUrl } from '../../utils/serializeToValideUrl';
import { UPLOAD_FOLDER } from '../../utils/constants';

@ApiBearerAuth()
@Controller('link-manifest-group')
export class LinkManifestGroupController {
  constructor(
    private readonly linkManifestGroupService: LinkManifestGroupService,
  ) {}

  @ApiOperation({ summary: 'Get All manifest a specific group can access' })
  @ApiOkResponse({
    description: "The manifests and the user's right on it",
    type: LinkManifestGroup,
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('/manifests')
  async getManifestByUserId(@Req() request) {
    return this.linkManifestGroupService.findAllManifestByUserId(
      request.user.sub,
    );
  }

  @ApiOperation({ summary: 'upload a manifest' })
  @ApiOkResponse({
    description: "The manifest and the user's right on it",
    type: LinkManifestGroup,
    isArray: false,
  })
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
          const uploadPath = `${UPLOAD_FOLDER}/${hash}`;
          fs.mkdirSync(uploadPath, { recursive: true });
          (req as any).generatedHash = hash;
          callback(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const fileName = file.originalname.replace(/\//g, '');
          cb(null, fileName);
        },
      }),
      fileFilter: fileFilterManifest,
    }),
  )
  uploadManifest(
    @Body() createGroupManifestDto: CreateGroupManifestDto,
    @Req() req,
    @UploadedFile() file,
  ) {
    const manifestToCreate = {
      rights: ManifestGroupRights.ADMIN,
      origin: manifestOrigin.UPLOAD,
      path: `${file.filename}`,
      hash: `${(req as any).generatedHash}`,
      description: 'your manifest description',
      title: file.originalname,
      idCreator: createGroupManifestDto.idCreator,
    };
    return this.linkManifestGroupService.createManifest(manifestToCreate);
  }

  @ApiOperation({ summary: 'Create a manifest with a link a manifest' })
  @ApiOkResponse({
    description: "The manifest and the user's right on it",
    type: LinkManifestGroup,
    isArray: false,
  })
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

  @ApiOperation({ summary: 'Create a manifest with a json' })
  @ApiOkResponse({
    description: "The manifest and the user's right on it",
    type: LinkManifestGroup,
    isArray: false,
  })
  @ApiBody({ type: manifestCreationDto })
  @UseGuards(AuthGuard)
  @Post('/manifest/creation')
  @UseInterceptors(MediaInterceptor)
  async createManifest(@Body() createManifestDto: manifestCreationDto) {
    const label = createManifestDto.title;
    if (!label) {
      throw new BadRequestException('Manifest title is required');
    }
    const serializeLabel = serializeToValidUrl(label);

    const hash = createManifestDto.hash;
    const uploadPath = `${UPLOAD_FOLDER}/${hash}`;
    fs.mkdirSync(uploadPath, { recursive: true });

    try {
      const manifestJson = JSON.stringify(createManifestDto.processedManifest);
      const filePath = `${uploadPath}/${serializeLabel}.json`;
      await fs.promises.writeFile(filePath, manifestJson);

      const manifestToCreate = {
        title: label,
        description: 'your manifest description',
        hash: hash,
        path: `${serializeLabel}.json`,
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

  @ApiOperation({ summary: 'updateManifest' })
  @UseGuards(AuthGuard)
  @Patch('/manifest/updateJson')
  async UpdateManifest(@Body() updateManifestJsonDto: UpdateManifestJsonDto) {
    return await this.linkManifestGroupService.updateManifestJson(
      updateManifestJsonDto,
    );
  }

  @ApiOperation({
    summary: 'Get all group that can access a manifest with his Id',
  })
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

  @ApiOperation({ summary: 'Update a manifest object' })
  @ApiOkResponse({
    description: 'The manifest updated',
    type: Manifest,
    isArray: false,
  })
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

  @ApiOperation({
    summary: 'Update the relation between a manifest and a group',
  })
  @ApiBody({ type: UpdateManifestGroupRelation })
  @SetMetadata('action', ActionType.UPDATE)
  @HttpCode(204)
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
        return this.linkManifestGroupService.updateAccessToManifest(
          {
            manifestId,
            userGroupId,
            rights,
          },
          request.user.sub,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Grant access to a manifest' })
  @ApiOkResponse({
    description: 'The manifests and the users rights on them',
    type: LinkManifestGroup,
    isArray: true,
  })
  @ApiBody({ type: AddManifestToGroupDto })
  @UseGuards(AuthGuard)
  @Post('/manifest/add')
  addManifestToGroup(@Body() addManifestToGroup: AddManifestToGroupDto) {
    return this.linkManifestGroupService.addManifestToGroup(addManifestToGroup);
  }

  @ApiOperation({ summary: 'remove access to a manifest' })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Delete('/manifest/:manifestId/:groupId')
  async removeManifestGroupLink(
    @Param('manifestId') manifestId: number,
    @Param('groupId') groupId: number,
    @Req() request,
  ) {
    return await this.linkManifestGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      manifestId,
      async () => {
        return await this.linkManifestGroupService.removeAccessToManifest(
          manifestId,
          groupId,
        );
      },
    );
  }

  @ApiOperation({ summary: "Remove a manifest from user's list" })
  @UseGuards(AuthGuard)
  @Delete('/remove-manifest/:manifestId')
  async removeManifestFromUser(
    @Param('manifestId') manifestId: number,
    @Req() request,
  ) {
    return await this.linkManifestGroupService.removeManifestFromUser(
      manifestId,
      request.user.sub,
    );
  }
}
