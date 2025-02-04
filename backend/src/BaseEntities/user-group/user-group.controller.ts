import { Controller } from '@nestjs/common';
import { UserGroupService } from './user-group.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('user-group')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}
}
