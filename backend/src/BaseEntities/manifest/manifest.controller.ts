import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('manifest')
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}
  // This routes shouldn't be exposed
  // @Get()
  // @UseGuards(AuthGuard)
  // findAll() {
  //   return this.manifestService.findAll();
  // }
  //
  // @Get(':id')
  // @UseGuards(AuthGuard)
  // findOne(@Param('id') id: string) {
  //   return this.manifestService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // @UseGuards(AuthGuard)
  // update(
  //   @Param('id') id: string,
  //   @Body() updateManifestDto: UpdateManifestDto,
  // ) {
  //   return this.manifestService.update(+id, updateManifestDto);
  // }
  //
  // @UseGuards(AuthGuard)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.manifestService.remove(+id);
  // }
  @ApiOperation({
    summary: 'looking for a manifest a specific group can access',
  })
  @UseGuards(AuthGuard)
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
