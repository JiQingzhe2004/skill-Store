import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Body, Post } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { AdminService } from './admin.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ─── 初始化管理员（只需登录 + setup secret）─── */
  @UseGuards(AccessTokenGuard)
  @Post('setup')
  setup(@CurrentUser() user: JwtUser, @Body('secret') secret: string) {
    return this.adminService.setupAdmin(user.sub, secret)
  }

  /* ─── 以下全部需要 ADMIN 角色 ─── */

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('stats')
  getStats() { return this.adminService.getStats() }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') query?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      query,
    )
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/ban')
  banUser(
    @Param('id') id: string,
    @Body('durationHours') durationHours: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.banUser(id, durationHours, reason)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/role')
  setUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.setUserRole(id, role)
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('skills')
  listSkills(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('q') query?: string,
  ) {
    return this.adminService.listSkills(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      status as any,
      query,
    )
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('skills/:id/archive')
  archiveSkill(@Param('id') id: string) { return this.adminService.archiveSkill(id) }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('skills/:id/restore')
  restoreSkill(@Param('id') id: string) { return this.adminService.restoreSkill(id) }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('skills/:id')
  deleteSkill(@Param('id') id: string) { return this.adminService.deleteSkill(id) }
}
