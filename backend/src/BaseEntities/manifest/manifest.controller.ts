import { Controller, Get, Param } from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('manifest')
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  @ApiOperation({
    summary: 'looking for a manifest a specific group can access',
  })
  @Get('/search/:UserGroupId/:partialString')
  lookingForManifest(
    @Param('UserGroupId') userGroupId: number,
    @Param('partialString') partialString: string,
  ) {
    return this.manifestService.findManifestsByPartialStringAndUserGroup(
      partialString,
      userGroupId,
    );
  }
}
