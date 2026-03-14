import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Body } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { AdminService } from './admin.service'

@Controller('admin')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats()
  }

  /* ─── 用户管理 ─── */

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

  @Patch('users/:id/ban')
  banUser(
    @Param('id') id: string,
    @Body('durationHours') durationHours: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.banUser(id, durationHours, reason)
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id)
  }

  @Patch('users/:id/role')
  setUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.setUserRole(id, role)
  }

  /* ─── 技能管理 ─── */

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

  @Patch('skills/:id/archive')
  archiveSkill(@Param('id') id: string) {
    return this.adminService.archiveSkill(id)
  }

  @Patch('skills/:id/restore')
  restoreSkill(@Param('id') id: string) {
    return this.adminService.restoreSkill(id)
  }

  @Delete('skills/:id')
  deleteSkill(@Param('id') id: string) {
    return this.adminService.deleteSkill(id)
  }
}
