import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'
import { UsersService } from './users.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

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
