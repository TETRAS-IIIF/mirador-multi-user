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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LinkUserGroupService } from './link-user-group.service';
import { CreateLinkUserGroupDto } from './dto/create-link-user-group.dto';
import { UpdateLinkUserGroupDto } from './dto/update-link-user-group.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { CreateUserGroupDto } from '../../BaseEntities/user-group/dto/create-user-group.dto';
import { CreateUserDto } from '../../BaseEntities/users/dto/create-user.dto';
import { ActionType } from '../../enum/actions';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { LinkGroupProject } from '../link-group-project/entities/link-group-project.entity';
import { LinkUserGroup } from './entities/link-user-group.entity';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { Language } from '../../utils/email/utils';

@ApiBearerAuth()
@Controller('link-user-group')
export class LinkUserGroupController {
  constructor(private readonly linkUserGroupService: LinkUserGroupService) {}

  @ApiOperation({ summary: 'Return all user that are part of the group' })
  @ApiOkResponse({
    description: 'Return all users for group and there rights',
    type: LinkUserGroup,
    isArray: true,
  })
  @SetMetadata('action', ActionType.READ)
  @UseGuards(AuthGuard)
  @Get('/users/:groupId')
  async getAllUsersForGroup(@Param('groupId') groupId: number, @Req() request) {
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      groupId,
      async () => {
        return this.linkUserGroupService.findAllUsersForGroup(groupId);
      },
    );
  }

  @ApiOperation({
    summary: 'Find all groups where a user is part of the group',
  })
  @ApiOkResponse({
    description: 'The groups the user can access and his rights on them',
    type: LinkGroupProject,
    isArray: true,
  })
  @SetMetadata('action', ActionType.READ)
  @UseGuards(AuthGuard)
  @Get('/groups/:userId')
  getAllGroupForUser(@Param('userId') userId: number, @Req() request) {
    if (userId == request.user.sub) {
      return this.linkUserGroupService.findALlGroupsForUser(userId);
    }
  }

  @ApiOperation({ summary: 'Get the rights of the users on the group' })
  @ApiOkResponse({
    description: 'Does the user can access to userGroup ?',
    isArray: false,
  })
  @UseGuards(AuthGuard)
  @Get('/access/:userId/:groupId')
  getAccessToGroup(
    @Param('userId') userId: number,
    @Param('groupId') groupId: number,
  ) {
    return this.linkUserGroupService.getAccessForUserToGroup(userId, groupId);
  }

  @ApiOperation({ summary: 'Create a user' })
  @ApiOkResponse({
    description: 'The user creation route',
    type: CreateUserDto,
    isArray: false,
  })
  @Post('/user')
  @HttpCode(201)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.linkUserGroupService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'Create a group' })
  @ApiOkResponse({
    description: 'The group creation route',
    type: CreateUserGroupDto,
    isArray: false,
  })
  @UseGuards(AuthGuard)
  @Post('/group')
  createGroup(@Body() createUserGroupDto: CreateUserGroupDto) {
    return this.linkUserGroupService.createUserGroup(createUserGroupDto);
  }

  @ApiOperation({ summary: 'Grant access to a group to a user' })
  @ApiOkResponse({
    description: 'The project and the rights of the user on it',
    type: LinkGroupProject,
    isArray: false,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Post('/access')
  async grantAccess(
    @Body() grantAccessToGroupDto: CreateLinkUserGroupDto,
    @Req() request,
  ) {
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      grantAccessToGroupDto.user_groupId,
      async () => {
        return this.linkUserGroupService.GrantAccessToUserGroup(
          grantAccessToGroupDto,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Resend mail for confirmation to the user' })
  @Get('resend-confirmation-link/:email/:language')
  async resendConfirmationLink(
    @Param('email') email: string,
    @Param('language') language: string,
  ) {
    await this.linkUserGroupService.sendConfirmationLink(email, language);
  }

  @ApiOperation({
    summary:
      'search for a user personnalGroup with a string matching the start of his title',
  })
  @ApiOkResponse({
    description: 'Looking for for user',
    isArray: false,
  })
  @UseGuards(AuthGuard)
  @Get('/looking-for-user/:partialString')
  lookingForUser(@Param('partialString') partialString: string) {
    return this.linkUserGroupService.searchForUserGroup(partialString);
  }

  @ApiOperation({
    summary: 'search for a group with a string matching the start of his title',
  })
  @ApiOkResponse({
    description: 'Looking for userGroup',
    isArray: false,
  })
  @UseGuards(AuthGuard)
  @Get('/looking-for-userGroups/:partialString')
  lookingForUserGroups(@Param('partialString') partialString: string) {
    return this.linkUserGroupService.searchForGroups(partialString);
  }

  @ApiOperation({ summary: 'Get your personnal group' })
  @ApiOkResponse({
    description: "The personal user's userGroup",
    type: LinkGroupProject,
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('/user-personal-group/:userId')
  getUserPersonalGroup(@Param('userId') userId: number, @Req() request) {
    if (userId == request.user.sub) {
      return this.linkUserGroupService.findUserPersonalGroup(userId);
    }
    return new UnauthorizedException(
      'you are not allowed to access to this information',
    );
  }

  @ApiOperation({ summary: 'Change access to a group for a specific user' })
  @ApiOkResponse({
    description: "The project updated and the user's rights on it",
    type: LinkGroupProject,
    isArray: true,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('/change-access')
  async changeAccess(
    @Body() grantAccessToGroupDto: UpdateLinkUserGroupDto,
    @Req() request,
  ) {
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      grantAccessToGroupDto.groupId,
      async () => {
        return this.linkUserGroupService.ChangeAccessToUserGroup(
          grantAccessToGroupDto.groupId,
          grantAccessToGroupDto.userId,
          grantAccessToGroupDto.rights,
          request.user.sub,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Update group' })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('/update-group')
  async updateGroup(
    @Body() updateGroupDto: UpdateUserGroupDto,
    @Req() request,
  ) {
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      updateGroupDto.id,
      async () => {
        return this.linkUserGroupService.updateGroup(updateGroupDto);
      },
    );
  }

  @ApiOperation({ summary: 'Remove access to a group' })
  @ApiOkResponse({
    description: 'Remove access to userGroup',
    isArray: false,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Delete('/remove-access/:groupId/:userId')
  async removeAccess(
    @Param('groupId') groupId: number,
    @Param('userId') userId: number,
    @Req() request,
  ) {
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      groupId,
      async () => {
        return this.linkUserGroupService.RemoveAccessToUserGroup(
          groupId,
          userId,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Remove a user from a group' })
  @SetMetadata('action', ActionType.DELETE)
  @Delete('/group/:groupId')
  @UseGuards(AuthGuard)
  async remove(@Param('groupId') id: number, @Req() request) {
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      id,
      async () => {
        return this.linkUserGroupService.removeGroupFromLinkEntity(+id);
      },
    );
  }

  @ApiOperation({ summary: 'get user name with id' })
  @UseGuards(AuthGuard)
  @Get('/user/name/:userId')
  async getUserNameWithId(@Param('userId') userId: number) {
    return await this.linkUserGroupService.getUserNameWithId(userId);
  }

  @ApiOperation({ summary: 'Get all users' })
  @SetMetadata('action', ActionType.ADMIN)
  @Get('/users')
  @UseGuards(AuthGuard)
  async getAllUsers(@Req() request) {
    const userPersonalGroup =
      await this.linkUserGroupService.findUserPersonalGroup(request.user.sub);
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      userPersonalGroup.id,
      async () => {
        return await this.linkUserGroupService.getAllUsers();
      },
    );
  }

  @ApiOperation({ summary: 'update user preferred language' })
  @SetMetadata('action', ActionType.UPDATE)
  @Patch('/updateLanguage/:userId')
  @UseGuards(AuthGuard)
  async updateUserLanguage(
    @Param('userId') userId: number,
    @Req() request,
    @Body() preferredLanguageDto: { preferredLanguage: Language },
  ) {
    const userPersonalGroup =
      await this.linkUserGroupService.findUserPersonalGroup(request.user.sub);
    return await this.linkUserGroupService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      userPersonalGroup.id,
      async () => {
        return await this.linkUserGroupService.updateUserLanguage(
          userId,
          preferredLanguageDto.preferredLanguage,
        );
      },
    );
  }

  @ApiOperation({ summary: 'leaving group' })
  @Delete('/leaving-group/:groupId')
  @UseGuards(AuthGuard)
  async leavingGroup(@Param('groupId') groupId: number, @Req() request) {
    return this.linkUserGroupService.RemoveAccessToUserGroup(
      groupId,
      request.user.sub,
    );
  }
}
