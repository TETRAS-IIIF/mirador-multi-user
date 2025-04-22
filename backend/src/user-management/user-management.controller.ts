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

@Controller('user-management') // Base route
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @ApiOperation({ summary: 'Delete user' })
  @ApiOkResponse({
    description: 'Delete user',
    isArray: false,
  })
  @SetMetadata('action', ActionType.DELETE)
  @UseGuards(AuthGuard('jwt'))
  @Delete('/delete/:userId')
  async removeAccess(@Param('userId') userId: number, @Req() request) {
    return await this.userManagementService.checkPolicies(
      request.metadata.action,
      userId,
      async () => {
        return this.userManagementService.deleteUserProcess(request.user.sub);
      },
    );
  }
}
