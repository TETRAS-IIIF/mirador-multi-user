import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LinkMediaGroupService } from './link-media-group.service';
import { AuthGuard } from '../../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { generateAlphanumericSHA1Hash } from '../../utils/hashGenerator';
import { fileFilterMedia } from '../../BaseEntities/media/utils/fileFilterMedia';
import { SharpPipeInterceptor } from '../../utils/Custom_pipes/sharp.pipe';
import { mediaOrigin } from '../../enum/origins';
import { MediaLinkInterceptor } from '../../utils/Custom_pipes/media-link.pipe';
import { UpdateMediaDto } from '../../BaseEntities/media/dto/update-media.dto';
import { UpdateMediaGroupRelationDto } from './dto/updateMediaGroupRelationDto';
import { AddMediaToGroupDto } from './dto/addMediaToGroupDto';
import * as fs from 'fs';
import { ActionType } from '../../enum/actions';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { LinkMediaGroup } from './entities/link-media-group.entity';
import { Media } from '../../BaseEntities/media/entities/media.entity';
import { mediaTypes } from '../../enum/mediaTypes';
import { UPLOAD_FOLDER } from '../../utils/constants';

@ApiBearerAuth()
@Controller('link-media-group')
export class LinkMediaGroupController {
  constructor(private readonly linkMediaGroupService: LinkMediaGroupService) {}

  @ApiOperation({ summary: 'Upload a media' })
  @UseGuards(AuthGuard)
  @Post('/media/upload')
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
      fileFilter: fileFilterMedia,
      limits: {
        fileSize:
          (parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 1000) * 1024 * 1024,
      },
    }),
    SharpPipeInterceptor,
  )
  async uploadSingleFile(
    @UploadedFile() file,
    @Body() CreateMediaDto,
    @Req() req,
  ) {
    const userGroup = JSON.parse(CreateMediaDto.user_group);
    // TODO TRAD 'your media description'
    const mediaToCreate = {
      ...CreateMediaDto,
      title: file.originalname,
      description: 'your media description',
      user_group: userGroup,
      path: `${file.filename}`,
      hash: `${(req as any).generatedHash}`,
      origin: mediaOrigin.UPLOAD,
      mediaTypes: mediaTypes.IMAGE,
    };
    return await this.linkMediaGroupService.createMedia(mediaToCreate);
  }

  @ApiOperation({ summary: 'Create a media with an url' })
  @UseGuards(AuthGuard)
  @Post('/media/link')
  @UseInterceptors(MediaLinkInterceptor)
  @HttpCode(201)
  async linkMedia(@Body() createMediaDto, @Req() req) {
    const mediaToCreate = {
      ...createMediaDto,
      title: `${req.body.url}`,
      description: 'your media description',
      user_group: createMediaDto.user_group,
      url: `${req.body.url}`,
      origin: mediaOrigin.LINK,
      mediaTypes: req.mediaTypes,
      hash: req.generatedHash,
    };
    return await this.linkMediaGroupService.createMedia(mediaToCreate);
  }

  @ApiOperation({ summary: 'Get all media for a specific group' })
  @ApiOkResponse({
    description: 'The medias user have access and his rights on them',
    type: LinkMediaGroup,
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('/medias')
  async getUserMedias(@Req() request) {
    return this.linkMediaGroupService.getAllMediasForUser(request.user.sub);
  }

  @ApiOperation({ summary: 'Get all group that can access a specific media' })
  @UseGuards(AuthGuard)
  @Get('/media/:mediaId')
  async getMediaById(@Param('mediaId') mediaId: number) {
    return this.linkMediaGroupService.getAllMediaGroup(mediaId);
  }

  @ApiOperation({ summary: 'Delete a media' })
  @SetMetadata('action', ActionType.DELETE)
  @UseGuards(AuthGuard)
  @Delete('/media/:mediaId')
  async deleteMedia(@Param('mediaId') mediaId: number, @Req() request) {
    return await this.linkMediaGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      mediaId,
      async () => {
        return this.linkMediaGroupService.removeMedia(mediaId);
      },
    );
  }

  @ApiOperation({ summary: 'Update a media' })
  @ApiOkResponse({
    description: 'The media updated',
    type: Media,
    isArray: false,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('/media')
  async updateMedia(
    @Body() updateGroupMediaDto: UpdateMediaDto,
    @Req() request,
  ) {
    return await this.linkMediaGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      updateGroupMediaDto.id,
      async () => {
        return this.linkMediaGroupService.updateMedia(updateGroupMediaDto);
      },
    );
  }

  @ApiOperation({ summary: 'update media and group relation' })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Patch('/relation')
  async updateMediaGroupRelation(
    @Body() updateMediaGroupRelationDto: UpdateMediaGroupRelationDto,
    @Req() request,
  ) {
    const { mediaId, userGroupId, rights } = updateMediaGroupRelationDto;
    return await this.linkMediaGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      mediaId,
      async () => {
        return this.linkMediaGroupService.updateMediaGroupRelation(
          mediaId,
          userGroupId,
          rights,
          request.user.sub,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Grant access to media' })
  @ApiOkResponse({
    description: 'The media updated',
    type: Media,
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Post('/media/add')
  addMediaToGroup(@Body() addMediaToGroupDto: AddMediaToGroupDto) {
    return this.linkMediaGroupService.addMediaToGroup(addMediaToGroupDto);
  }

  @ApiOperation({ summary: 'Remove access to a media' })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Delete('/media/:mediaId/:groupId')
  async deleteMediaById(
    @Param('mediaId') mediaId: number,
    @Param('groupId') groupId: number,
    @Req() request,
  ) {
    return await this.linkMediaGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      mediaId,
      async () => {
        return await this.linkMediaGroupService.removeAccessToMedia(
          mediaId,
          groupId,
        );
      },
    );
  }

  @ApiOperation({ summary: "Remove a media from user's list" })
  @UseGuards(AuthGuard)
  @Delete('/remove-media/:mediaId')
  async removeMediaFromUser(@Param('mediaId') mediaId: number, @Req() request) {
    return await this.linkMediaGroupService.removeMediaFromUser(
      mediaId,
      request.user.sub,
    );
  }
}
