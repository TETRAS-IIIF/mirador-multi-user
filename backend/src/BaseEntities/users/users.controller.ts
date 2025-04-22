import {
  Body,
  Controller,
  Patch,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('jwt'))
  @Patch('update')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateUser(@Body() updateUserDto: UpdateUserDto, @Req() request) {
    return this.usersService.updateUser(request.user.sub, updateUserDto);
  }

  // this actions should only be possible if you are the super Admin of the platform, for now I disable this routes
  //
  // @UseGuards(AuthGuard('jwt'))
  // @Get(':id')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // findOne(@Param('id') id: number) {
  //   return this.usersService.findOne(id);
  // }
  // //
  // // @Get('groups/:userId')
  // // @UseGuards(AuthGuard('jwt'))
  // // findAllGroups(@Param('userId') userId: number) {
  // //   return this.usersService.getUserGroupsByUserId(userId);
  // // }
  // @UseGuards(AuthGuard('jwt'))
  // @Patch(':id')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // update(@Param() params: UpdateParams, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(params.id, updateUserDto);
  // }
  //
  // @UseGuards(AuthGuard('jwt'))
  // @Delete(':id')
  // @HttpCode(204)
  // @UsePipes(new ValidationPipe({ transform: true }))
  // remove(@Param() params: DeleteParams) {
  //   return this.usersService.remove(params.id);
  // }
}
