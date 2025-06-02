import {
  Body,
  Controller,
  Patch,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Update users credentials' })
  @ApiOkResponse({
    description: 'Update users credentials',
    type: UpdateUserDto,
    isArray: false,
  })
  @Patch('update')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateUser(@Body() updateUserDto: UpdateUserDto, @Req() request) {
    return this.usersService.updateUser(request.user.sub, updateUserDto);
  }
}
