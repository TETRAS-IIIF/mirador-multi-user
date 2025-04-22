import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Find a media by hist title for a specific group' })
  @UseGuards(AuthGuard('jwt'))
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
