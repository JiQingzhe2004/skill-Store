import { HttpStatus, Injectable } from '@nestjs/common'
import { SkillStatus, UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AppException } from '../common/exceptions/app.exception'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /* ─── 统计概览 ─── */
  async getStats() {
    const [userCount, skillCount, publishedCount, totalDownloads, totalStars] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.skill.count(),
      this.prisma.skill.count({ where: { status: SkillStatus.PUBLISHED } }),
      this.prisma.skill.aggregate({ _sum: { downloadCount: true } }),
      this.prisma.skill.aggregate({ _sum: { starCount: true } }),
    ])
    return {
      userCount,
      skillCount,
      publishedCount,
      totalDownloads: totalDownloads._sum.downloadCount ?? 0,
      totalStars: totalStars._sum.starCount ?? 0,
    }
  }

  /* ─── 用户列表 ─── */
  async listUsers(page = 1, pageSize = 20, query?: string) {
    const where = query ? {
      OR: [
        { username: { contains: query } },
        { email: { contains: query } },
      ],
    } : {}
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, email: true, username: true, role: true,
          isEmailVerified: true, createdAt: true,
          avatar: true, isBanned: true, bannedUntil: true, banReason: true,
          _count: { select: { skills: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  /* ─── 封禁用户 ─── */
  async banUser(userId: string, durationHours: number, reason?: string) {
    const bannedUntil = durationHours > 0
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : null // null = 永久封禁
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, bannedUntil, banReason: reason ?? null },
      select: { id: true, username: true, isBanned: true, bannedUntil: true, banReason: true },
    })
  }

  /* ─── 解封用户 ─── */
  async unbanUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, bannedUntil: null, banReason: null },
      select: { id: true, username: true, isBanned: true },
    })
  }

  /* ─── 修改用户角色 ─── */
  async setUserRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, username: true, role: true },
    })
  }

  /* ─── 技能列表（管理员视角，含所有状态）─── */
  async listSkills(page = 1, pageSize = 20, status?: SkillStatus, query?: string) {
    const where = {
      ...(status ? { status } : {}),
      ...(query ? { OR: [{ name: { contains: query } }, { slug: { contains: query } }] } : {}),
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, slug: true, name: true, status: true, visibility: true,
          latestVersion: true, downloadCount: true, starCount: true, likeCount: true,
          createdAt: true, updatedAt: true,
          author: { select: { id: true, username: true, avatar: true } },
        },
      }),
      this.prisma.skill.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  /* ─── 强制下架技能 ─── */
  async archiveSkill(skillId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    return this.prisma.skill.update({
      where: { id: skillId },
      data: { status: SkillStatus.ARCHIVED },
      select: { id: true, name: true, status: true },
    })
  }

  /* ─── 恢复技能（ARCHIVED → PUBLISHED）─── */
  async restoreSkill(skillId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    return this.prisma.skill.update({
      where: { id: skillId },
      data: { status: SkillStatus.PUBLISHED },
      select: { id: true, name: true, status: true },
    })
  }

  /* ─── 删除技能 ─── */
  async deleteSkill(skillId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    await this.prisma.skill.delete({ where: { id: skillId } })
    return { message: '已删除' }
  }
}
