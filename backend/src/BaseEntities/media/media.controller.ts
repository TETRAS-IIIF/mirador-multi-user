import { Controller, Get, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Find a media by hist title for a specific group' })
  @Get('/search/:UserGroupId/:partialString')
  lookingForMedia(
    @Param('UserGroupId') userGroupId: number,
    @Param('partialString') partialString: string,
  ) {
    return this.mediaService.findMediasByPartialStringAndUserGroup(
      partialString,
      userGroupId,
    );
  }
}
