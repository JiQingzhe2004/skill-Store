import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'

import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'
import { ApiClientsService } from './api-clients.service'
import { CreateApiClientDto } from './dto/create-api-client.dto'
import { UpdateApiClientStatusDto } from './dto/update-api-client-status.dto'

@ApiTags('API Clients')
@ApiCookieAuth('ss_at')
@Controller('api-clients')
@UseGuards(AccessTokenGuard)
export class ApiClientsController {
  constructor(private readonly apiClientsService: ApiClientsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.apiClientsService.findAll(user.sub)
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateApiClientDto) {
    return this.apiClientsService.create(user.sub, dto)
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateApiClientStatusDto,
  ) {
    return this.apiClientsService.updateStatus(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.apiClientsService.remove(user.sub, id)
  }
}
