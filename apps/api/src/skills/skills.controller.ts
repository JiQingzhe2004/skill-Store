import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards, UseInterceptors, UploadedFile, BadRequestException, ParseIntPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { SkillsService } from './skills.service'
import { CreateSkillDto } from './dto/create-skill.dto'
import { UpdateSkillDto } from './dto/update-skill.dto'
import { CreateVersionDto } from './dto/create-version.dto'
import { CreateCommentDto } from './dto/create-comment.dto'
import { ZipService } from './zip.service'
import { normalizePublicSkillSort } from './skills-public-query'

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(
    private readonly skillsService: SkillsService,
    private readonly zipService: ZipService,
  ) {}

  /* ─── 公开接口 ─── */

  @Get('public/tags')
  findPublicTags() {
    return this.skillsService.findPublicTags()
  }

  @Get('public')
  findPublic(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
  ) {
    return this.skillsService.findPublic(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      { q, tag, sort: sort ? normalizePublicSkillSort(sort) : undefined },
    )
  }

  @Get('public/:slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.skillsService.findPublicBySlug(slug)
  }

  /* ─── 互动/安装接口（public/:slug/*，需登录，放在 :id 前避免被抢匹配）─── */

  @UseGuards(AccessTokenGuard)
  @Post('public/:slug/star')
  toggleStar(@CurrentUser() user: JwtUser, @Param('slug') slug: string) {
    return this.skillsService.toggleStar(slug, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Post('public/:slug/like')
  toggleLike(@CurrentUser() user: JwtUser, @Param('slug') slug: string) {
    return this.skillsService.toggleLike(slug, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get('public/:slug/me')
  getUserInteraction(@CurrentUser() user: JwtUser, @Param('slug') slug: string) {
    return this.skillsService.getUserInteraction(slug, user.sub)
  }

  @Get('public/:slug/files')
  getPublicFiles(@Param('slug') slug: string) {
    return this.skillsService.getPublicFiles(slug)
  }

  @Get('public/:slug/comments')
  getComments(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.skillsService.getComments(slug, Number(page) || 1, Number(pageSize) || 20)
  }

  @UseGuards(AccessTokenGuard)
  @Post('public/:slug/comments')
  createComment(
    @CurrentUser() user: JwtUser,
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.skillsService.createComment(slug, user.sub, dto.content, dto.parentId)
  }

  @UseGuards(AccessTokenGuard)
  @Delete('public/comments/:commentId')
  deleteComment(
    @CurrentUser() user: JwtUser,
    @Param('commentId') commentId: string,
  ) {
    return this.skillsService.deleteComment(commentId, user.sub, user.role === 'ADMIN')
  }

  @Post('public/:slug/download/count')
  incrementDownload(@Param('slug') slug: string) {
    return this.skillsService.incrementDownloadCount(slug)
  }

  @Get('public/:slug/download')
  @UseInterceptors()
  async download(
    @Param('slug') slug: string,
    @Res({ passthrough: false }) res: import('express').Response,
  ) {
    try {
      const { stream, filename } = await this.skillsService.buildDownloadZip(slug)
      const encoded = encodeURIComponent(filename)
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
      })
      stream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: { code: 'ZIP_ERROR', message: err.message } })
        }
      })
      stream.pipe(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '下载失败'
      res.status(500).json({ success: false, error: { code: 'DOWNLOAD_ERROR', message: msg } })
    }
  }

  @UseGuards(AccessTokenGuard)
  @Post('public/:slug/install')
  install(@CurrentUser() user: JwtUser, @Param('slug') slug: string) {
    return this.skillsService.install(slug, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Delete('public/:slug/install')
  uninstall(@CurrentUser() user: JwtUser, @Param('slug') slug: string) {
    return this.skillsService.uninstall(slug, user.sub)
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
  @Post(':id/versions/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadVersion(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('version') version: string,
    @Body('changelog') changelog?: string,
  ) {
    if (!file) throw new BadRequestException('请上传 ZIP 文件')
    if (!version) throw new BadRequestException('请提供版本号')
    if (!file.originalname.endsWith('.zip') && file.mimetype !== 'application/zip') {
      throw new BadRequestException('只支持 ZIP 格式')
    }
    const files = await this.zipService.extractZip(file.buffer)
    return this.skillsService.uploadVersion(id, user.sub, files, version, changelog)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/versions/:versionId/files')
  getVersionFiles(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.skillsService.getVersionFiles(id, versionId, user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/versions/:versionId/files/:fileId')
  getVersionFileContent(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.skillsService.getVersionFileContent(id, versionId, fileId, user.sub)
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
