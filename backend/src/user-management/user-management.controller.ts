import {
  Controller,
  Delete,
  Param,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ActionType } from '../enum/actions';
import { AuthGuard } from '../auth/auth.guard';
import { SettingsService } from '../BaseEntities/setting/setting.service';

@Controller('user-management') // Base route
export class UserManagementController {
  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly settingsService: SettingsService,
  ) {}

  @ApiOperation({ summary: 'Delete user' })
  @ApiOkResponse({
    description: 'Delete user',
    isArray: false,
  })
  @SetMetadata('action', ActionType.DELETE)
  @UseGuards(AuthGuard)
  @Delete('/delete/:userId')
  async removeAccess(@Param('userId') userId: number, @Req() request) {
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    if (isAdmin) {
      return this.userManagementService.deleteUserProcess(userId);
    } else {
      return await this.userManagementService.checkPolicies(
        request.metadata.action,
        userId,
        async () => {
          return this.userManagementService.deleteUserProcess(request.user.sub);
        },
      );
    }
  }
}
