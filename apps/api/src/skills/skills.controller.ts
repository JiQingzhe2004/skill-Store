import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { SkillsService } from './skills.service'
import { CreateSkillDto } from './dto/create-skill.dto'
import { UpdateSkillDto } from './dto/update-skill.dto'
import { CreateVersionDto } from './dto/create-version.dto'

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /* ─── 公开接口 ─── */

  @Get('public')
  findPublic(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.skillsService.findPublic(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    )
  }

  @Get('public/:slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.skillsService.findPublicBySlug(slug)
  }

  /* ─── 需要登录 ─── */

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateSkillDto) {
    return this.skillsService.create(user.sub, dto)
  }

  @UseGuards(AccessTokenGuard)
  @Get('mine')
  findMine(@CurrentUser() user: JwtUser) {
    return this.skillsService.findMine(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.skillsService.findOneOwned(id, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillsService.update(id, user.sub, dto)
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.skillsService.remove(id, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/versions')
  createVersion(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.skillsService.createVersion(id, user.sub, dto)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/versions')
  findVersions(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.skillsService.findVersions(id, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/versions/:versionId/publish')
  publishVersion(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.skillsService.publishVersion(id, versionId, user.sub)
  }
}
