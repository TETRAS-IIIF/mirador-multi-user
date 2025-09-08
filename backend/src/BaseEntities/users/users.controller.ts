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
import { AuthGuard } from '../../auth/auth.guard';
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
  @UseGuards(AuthGuard)
  @Patch('update')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateUser(@Body() updateUserDto: UpdateUserDto, @Req() request) {
    return this.usersService.updateUser(request.user.sub, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Patch('validTerms')
  async validTerms(@Req() request) {
    const user = await this.usersService.findOne(request.user.sub);
    return this.usersService.validTermsForUser(user.mail);
  }

  // this actions should only be possible if you are the super Admin of the platform, for now I disable this routes
  //
  // @UseGuards(AuthGuard)
  // @Get(':id')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // findOne(@Param('id') id: number) {
  //   return this.usersService.findOne(id);
  // }
  // //
  // // @Get('groups/:userId')
  // // @UseGuards(AuthGuard)
  // // findAllGroups(@Param('userId') userId: number) {
  // //   return this.usersService.getUserGroupsByUserId(userId);
  // // }
  // @UseGuards(AuthGuard)
  // @Patch(':id')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // update(@Param() params: UpdateParams, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(params.id, updateUserDto);
  // }
  //
  // @UseGuards(AuthGuard)
  // @Delete(':id')
  // @HttpCode(204)
  // @UsePipes(new ValidationPipe({ transform: true }))
  // remove(@Param() params: DeleteParams) {
  //   return this.usersService.remove(params.id);
  // }
}
