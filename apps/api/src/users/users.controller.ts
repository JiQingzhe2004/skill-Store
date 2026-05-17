import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'

import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'
import { UsersService } from './users.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

@ApiTags('Users')
@ApiCookieAuth('ss_at')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Get('me')
  getMe(@CurrentUser() user: JwtUser) {
    return this.usersService.getMe(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user.sub, dto)
  }

  @UseGuards(AccessTokenGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片文件')
    }
    return this.usersService.uploadAvatar(user.sub, file.buffer, file.mimetype)
  }

  @UseGuards(AccessTokenGuard)
  @Delete('me/avatar')
  removeAvatar(@CurrentUser() user: JwtUser) {
    return this.usersService.removeAvatar(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/stars')
  getMyStars(@CurrentUser() user: JwtUser) {
    return this.usersService.getMyStars(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/installs')
  getMyInstalls(@CurrentUser() user: JwtUser) {
    return this.usersService.getMyInstalls(user.sub)
  }
}
