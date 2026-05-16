import { HttpStatus, Injectable } from '@nestjs/common'
import { SkillStatus, SkillVisibility } from '@prisma/client'

import { AppException } from '../common/exceptions/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { canReadSkill } from './public-api.access'
import { ApiClientContext } from './types/api-client-context'

export type PublicApiRequestMeta = {
  apiClientId: string
  requestIp?: string
}

@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService) {}

  async logUsage(
    apiClientId: string,
    action: string,
    options?: { skillId?: string; requestIp?: string },
  ) {
    await this.prisma.skillUsageLog.create({
      data: {
        apiClientId,
        action,
        skillId: options?.skillId,
        requestIp: options?.requestIp,
      },
    })
  }

  async listSkills(page = 1, pageSize = 20, meta?: PublicApiRequestMeta) {
    const safePage = Math.max(1, page)
    const safeSize = Math.min(50, Math.max(1, pageSize))
    const skip = (safePage - 1) * safeSize

    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where: { status: SkillStatus.PUBLISHED, visibility: SkillVisibility.PUBLIC },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: safeSize,
        select: {
          slug: true,
          name: true,
          description: true,
          tags: true,
          latestVersion: true,
          updatedAt: true,
          author: { select: { username: true } },
        },
      }),
      this.prisma.skill.count({
        where: { status: SkillStatus.PUBLISHED, visibility: SkillVisibility.PUBLIC },
      }),
    ])

    const result = {
      items: items.map(item => ({
        ...item,
        tags: this.parseTags(item.tags),
      })),
      total,
      page: safePage,
      pageSize: safeSize,
    }

    if (meta) {
      await this.logUsage(meta.apiClientId, 'v1.skills.list', { requestIp: meta.requestIp })
    }

    return result
  }

  async getSkillBySlug(
    slug: string,
    client: ApiClientContext,
    version?: string,
    meta?: PublicApiRequestMeta,
  ) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        tags: true,
        visibility: true,
        status: true,
        latestVersion: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { username: true, avatar: true } },
      },
    })

    if (!skill) {
      throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    }

    this.assertReadable(skill, client)

    const versionRow = await this.resolveVersion(skill.id, version)
    if (!versionRow) {
      throw new AppException(HttpStatus.NOT_FOUND, 'VERSION_NOT_FOUND', '指定版本不存在或未发布')
    }

    const result = {
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      tags: this.parseTags(skill.tags),
      visibility: skill.visibility,
      version: versionRow.version,
      changelog: versionRow.changelog,
      publishedAt: versionRow.publishedAt,
      author: skill.author,
      updatedAt: skill.updatedAt,
    }

    if (meta) {
      await this.logUsage(meta.apiClientId, 'v1.skills.detail', {
        skillId: skill.id,
        requestIp: meta.requestIp,
      })
    }

    return result
  }

  async getManifest(
    slug: string,
    client: ApiClientContext,
    version?: string,
    meta?: PublicApiRequestMeta,
  ) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        tags: true,
        visibility: true,
        status: true,
        authorId: true,
        author: { select: { username: true } },
      },
    })

    if (!skill) {
      throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    }

    this.assertReadable(skill, client)

    const versionRow = await this.resolveVersion(skill.id, version, true)
    if (!versionRow) {
      throw new AppException(HttpStatus.NOT_FOUND, 'VERSION_NOT_FOUND', '指定版本不存在或未发布')
    }

    const files = versionRow.files.map(f => ({
      path: f.path,
      encoding: f.encoding,
      size: f.size,
      content: f.content,
    }))

    const result = {
      schemaVersion: '1.0',
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      tags: this.parseTags(skill.tags),
      version: versionRow.version,
      author: skill.author,
      publishedAt: versionRow.publishedAt,
      install: {
        type: 'skill-store',
        content: versionRow.content,
        files,
        downloadUrl: `/api/skills/public/${skill.slug}/download`,
      },
    }

    if (meta) {
      await this.logUsage(meta.apiClientId, 'v1.skills.manifest', {
        skillId: skill.id,
        requestIp: meta.requestIp,
      })
    }

    return result
  }

  private assertReadable(
    skill: { status: SkillStatus; visibility: SkillVisibility; authorId: string },
    client: ApiClientContext,
  ) {
    if (!canReadSkill(skill, client.ownerId)) {
      throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    }
  }

  private async resolveVersion(skillId: string, version?: string, includeFiles = false) {
    if (version) {
      return this.prisma.skillVersion.findFirst({
        where: {
          skillId,
          version,
          publishedAt: { not: null },
        },
        include: includeFiles ? { files: { orderBy: { path: 'asc' } } } : undefined,
      })
    }

    return this.prisma.skillVersion.findFirst({
      where: { skillId, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      include: includeFiles ? { files: { orderBy: { path: 'asc' } } } : undefined,
    })
  }

  private parseTags(tags: string) {
    if (!tags.trim()) return []
    return tags.split(',').map(t => t.trim()).filter(Boolean)
  }
}
