import { Injectable, HttpStatus } from '@nestjs/common'
import { SkillStatus, SkillVisibility } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AppException } from '../common/exceptions/app.exception'
import { CreateSkillDto } from './dto/create-skill.dto'
import { UpdateSkillDto } from './dto/update-skill.dto'
import { CreateVersionDto } from './dto/create-version.dto'

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ─── 创建技能 ─── */
  async create(authorId: string, dto: CreateSkillDto) {
    const exists = await this.prisma.skill.findUnique({ where: { slug: dto.slug } })
    if (exists) throw new AppException(HttpStatus.CONFLICT, 'SLUG_TAKEN', '该 slug 已被占用')

    return this.prisma.skill.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        tags: dto.tags ?? '',
        visibility: dto.visibility ?? SkillVisibility.PUBLIC,
        status: SkillStatus.DRAFT,
        authorId,
      },
    })
  }

  /* ─── 我的技能列表 ─── */
  async findMine(authorId: string) {
    return this.prisma.skill.findMany({
      where: { authorId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, slug: true, name: true, description: true,
        tags: true, visibility: true, status: true,
        latestVersion: true, createdAt: true, updatedAt: true,
      },
    })
  }

  /* ─── 技能详情（仅作者） ─── */
  async findOneOwned(id: string, authorId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    if (skill.authorId !== authorId) throw new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', '无权访问')
    return skill
  }

  /* ─── 更新技能基础信息 ─── */
  async update(id: string, authorId: string, dto: UpdateSkillDto) {
    await this.findOneOwned(id, authorId)
    return this.prisma.skill.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.visibility && { visibility: dto.visibility }),
      },
    })
  }

  /* ─── 删除技能 ─── */
  async remove(id: string, authorId: string) {
    await this.findOneOwned(id, authorId)
    await this.prisma.skill.delete({ where: { id } })
    return { message: '技能已删除' }
  }

  /* ─── 创建版本（保存草稿） ─── */
  async createVersion(skillId: string, authorId: string, dto: CreateVersionDto) {
    await this.findOneOwned(skillId, authorId)

    const existing = await this.prisma.skillVersion.findUnique({
      where: { skillId_version: { skillId, version: dto.version } },
    })
    if (existing) throw new AppException(HttpStatus.CONFLICT, 'VERSION_EXISTS', '该版本号已存在')

    // 版本号必须递增
    const latestVersion = await this.prisma.skillVersion.findFirst({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
      select: { version: true },
    })
    if (latestVersion) {
      const cur = dto.version.split('.').map(Number)
      const prev = latestVersion.version.split('.').map(Number)
      const isHigher = cur[0] > prev[0]
        || (cur[0] === prev[0] && cur[1] > prev[1])
        || (cur[0] === prev[0] && cur[1] === prev[1] && cur[2] > prev[2])
      if (!isHigher) {
        throw new AppException(HttpStatus.BAD_REQUEST, 'VERSION_MUST_INCREMENT', `版本号必须大于当前最新版本 ${latestVersion.version}`)
      }
    }

    return this.prisma.skillVersion.create({
      data: {
        skillId,
        version: dto.version,
        content: dto.content,
        changelog: dto.changelog,
      },
    })
  }

  /* ─── 发布版本 ─── */
  async publishVersion(skillId: string, versionId: string, authorId: string) {
    const skill = await this.findOneOwned(skillId, authorId)

    const version = await this.prisma.skillVersion.findFirst({
      where: { id: versionId, skillId },
    })
    if (!version) throw new AppException(HttpStatus.NOT_FOUND, 'VERSION_NOT_FOUND', '版本不存在')
    if (version.publishedAt) throw new AppException(HttpStatus.CONFLICT, 'VERSION_ALREADY_PUBLISHED', '该版本已发布')

    const [updatedVersion] = await this.prisma.$transaction([
      this.prisma.skillVersion.update({
        where: { id: versionId },
        data: { publishedAt: new Date() },
      }),
      this.prisma.skill.update({
        where: { id: skillId },
        data: {
          latestVersion: version.version,
          status: SkillStatus.PUBLISHED,
        },
      }),
    ])

    return updatedVersion
  }

  /* ─── 版本列表 ─── */
  async findVersions(skillId: string, authorId: string) {
    await this.findOneOwned(skillId, authorId)
    return this.prisma.skillVersion.findMany({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, version: true, changelog: true,
        content: true, publishedAt: true, createdAt: true,
      },
    })
  }

  /* ─── 公开技能详情（by slug） ─── */
  async findPublicBySlug(slug: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, name: true, description: true,
        tags: true, latestVersion: true, visibility: true, status: true,
        createdAt: true, updatedAt: true,
        author: { select: { username: true, avatar: true } },
        versions: {
          where: { publishedAt: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, version: true, changelog: true, publishedAt: true, createdAt: true },
        },
      },
    })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    if (skill.status !== SkillStatus.PUBLISHED || skill.visibility === SkillVisibility.PRIVATE) {
      throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    }
    return skill
  }

  /* ─── 公开技能列表 ─── */
  async findPublic(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where: { status: SkillStatus.PUBLISHED, visibility: SkillVisibility.PUBLIC },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true, slug: true, name: true, description: true,
          tags: true, latestVersion: true, updatedAt: true,
          author: { select: { username: true, avatar: true } },
        },
      }),
      this.prisma.skill.count({
        where: { status: SkillStatus.PUBLISHED, visibility: SkillVisibility.PUBLIC },
      }),
    ])
    return { items, total, page, pageSize }
  }
}
