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
        downloadCount: true, starCount: true, likeCount: true,
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

  /* ─── ZIP 上传版本 ─── */
  async uploadVersion(skillId: string, authorId: string, files: import('./zip.service').ZipFile[], version: string, changelog?: string) {
    await this.findOneOwned(skillId, authorId)

    const existing = await this.prisma.skillVersion.findUnique({
      where: { skillId_version: { skillId, version } },
    })
    if (existing) throw new AppException(HttpStatus.CONFLICT, 'VERSION_EXISTS', '该版本号已存在')

    const latestVersion = await this.prisma.skillVersion.findFirst({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
      select: { version: true },
    })
    if (latestVersion) {
      const cur = version.split('.').map(Number)
      const prev = latestVersion.version.split('.').map(Number)
      const isHigher = cur[0] > prev[0]
        || (cur[0] === prev[0] && cur[1] > prev[1])
        || (cur[0] === prev[0] && cur[1] === prev[1] && cur[2] > prev[2])
      if (!isHigher) {
        throw new AppException(HttpStatus.BAD_REQUEST, 'VERSION_MUST_INCREMENT', `版本号必须大于当前最新版本 ${latestVersion.version}`)
      }
    }

    const skillMd = files.find(f => f.path === 'SKILL.md' || f.path.toLowerCase() === 'skill.md')
    const content = skillMd?.content ?? ''

    const skillVersion = await this.prisma.skillVersion.create({
      data: {
        skillId,
        version,
        content,
        changelog,
        files: {
          create: files.map(f => ({
            path: f.path,
            content: f.content,
            encoding: f.encoding,
            size: f.size,
          })),
        },
      },
      include: { files: true },
    })

    return skillVersion
  }

  /* ─── 获取版本文件列表 ─── */
  async getVersionFiles(skillId: string, versionId: string, authorId: string) {
    await this.findOneOwned(skillId, authorId)
    return this.prisma.skillVersionFile.findMany({
      where: { versionId },
      select: { id: true, path: true, encoding: true, size: true, createdAt: true },
      orderBy: { path: 'asc' },
    })
  }

  /* ─── 获取版本单个文件内容 ─── */
  async getVersionFileContent(skillId: string, versionId: string, fileId: string, authorId: string) {
    await this.findOneOwned(skillId, authorId)
    const file = await this.prisma.skillVersionFile.findFirst({
      where: { id: fileId, versionId },
    })
    if (!file) throw new AppException(HttpStatus.NOT_FOUND, 'FILE_NOT_FOUND', '文件不存在')
    return file
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

  /* ─── 星标 ─── */
  async toggleStar(slug: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { slug }, select: { id: true, authorId: true } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    const existing = await this.prisma.skillStar.findUnique({
      where: { userId_skillId: { userId, skillId: skill.id } },
    })
    if (existing) {
      await this.prisma.skillStar.delete({ where: { userId_skillId: { userId, skillId: skill.id } } })
      await this.prisma.skill.update({ where: { id: skill.id }, data: { starCount: { decrement: 1 } } })
      return { starred: false }
    } else {
      await this.prisma.skillStar.create({ data: { userId, skillId: skill.id } })
      await this.prisma.skill.update({ where: { id: skill.id }, data: { starCount: { increment: 1 } } })
      return { starred: true }
    }
  }

  /* ─── 点赞 ─── */
  async toggleLike(slug: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { slug }, select: { id: true, authorId: true } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    const existing = await this.prisma.skillLike.findUnique({
      where: { userId_skillId: { userId, skillId: skill.id } },
    })
    if (existing) {
      await this.prisma.skillLike.delete({ where: { userId_skillId: { userId, skillId: skill.id } } })
      await this.prisma.skill.update({ where: { id: skill.id }, data: { likeCount: { decrement: 1 } } })
      return { liked: false }
    } else {
      await this.prisma.skillLike.create({ data: { userId, skillId: skill.id } })
      await this.prisma.skill.update({ where: { id: skill.id }, data: { likeCount: { increment: 1 } } })
      return { liked: true }
    }
  }

  /* ─── 当前用户对技能的互动状态 ─── */
  async getUserInteraction(slug: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { slug }, select: { id: true } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')

    const [star, like] = await this.prisma.$transaction([
      this.prisma.skillStar.findUnique({
        where: { userId_skillId: { userId, skillId: skill.id } },
        select: { userId: true },
      }),
      this.prisma.skillLike.findUnique({
        where: { userId_skillId: { userId, skillId: skill.id } },
        select: { userId: true },
      }),
    ])

    return {
      starred: !!star,
      liked: !!like,
    }
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
  /* ─── 评论 ─── */
  async createComment(slug: string, userId: string, content: string, parentId?: string) {
    const skill = await this.prisma.skill.findUnique({ where: { slug } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')

    if (parentId) {
      const parent = await this.prisma.skillComment.findUnique({ where: { id: parentId } })
      if (!parent || parent.skillId !== skill.id) throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_PARENT', '回复的评论不存在')
    }

    return this.prisma.skillComment.create({
      data: { skillId: skill.id, userId, content, parentId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        replies: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async getComments(slug: string, page = 1, pageSize = 20) {
    const skill = await this.prisma.skill.findUnique({ where: { slug } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')

    const [total, items] = await Promise.all([
      this.prisma.skillComment.count({ where: { skillId: skill.id, parentId: null } }),
      this.prisma.skillComment.findMany({
        where: { skillId: skill.id, parentId: null },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          replies: {
            include: { user: { select: { id: true, username: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return { total, page, pageSize, items }
  }

  async deleteComment(commentId: string, userId: string, isAdmin = false) {
    const comment = await this.prisma.skillComment.findUnique({ where: { id: commentId } })
    if (!comment) throw new AppException(HttpStatus.NOT_FOUND, 'COMMENT_NOT_FOUND', '评论不存在')
    if (!isAdmin && comment.userId !== userId) throw new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', '无权删除此评论')
    await this.prisma.skillComment.delete({ where: { id: commentId } })
    return { success: true }
  }

  /* ─── 增加下载计数 ─── */
  async incrementDownloadCount(slug: string) {
    const skill = await this.prisma.skill.findUnique({ where: { slug } })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    await this.prisma.skill.update({
      where: { id: skill.id },
      data: { downloadCount: { increment: 1 } },
    })
    return { success: true }
  }

  /* ─── 构建下载 ZIP ─── */
  async buildDownloadZip(slug: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          take: 1,
          include: { files: { orderBy: { path: 'asc' } } },
        },
      },
    })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    if (!skill.versions.length) throw new AppException(HttpStatus.BAD_REQUEST, 'NO_PUBLISHED_VERSION', '该技能暂无已发布版本')

    const version = skill.versions[0]

    const archiver = await import('archiver')
    const archive = archiver.default('zip', { zlib: { level: 9 } })

    if (version.files.length > 0) {
      // 有文件列表，按文件树打包
      for (const file of version.files) {
        const content = file.encoding === 'base64'
          ? Buffer.from(file.content, 'base64')
          : Buffer.from(file.content, 'utf8')
        archive.append(content, { name: file.path })
      }
    } else {
      // 只有 content，打包为 SKILL.md
      archive.append(Buffer.from(version.content, 'utf8'), { name: 'SKILL.md' })
    }

    archive.finalize()

    const safeName = skill.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    const filename = `${safeName}-v${version.version}.zip`

    return { stream: archive, filename }
  }

  /* ─── 获取公开技能文件列表 ─── */
  async getPublicFiles(slug: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          take: 1,
          include: {
            files: {
              select: { id: true, path: true, size: true, encoding: true, content: true },
              orderBy: { path: 'asc' },
            },
          },
        },
      },
    })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    if (!skill.versions.length) return { files: [] }
    return { files: skill.versions[0].files }
  }

  /* ─── 安装技能 ─── */
  async install(slug: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          take: 1,
          include: { files: true },
        },
      },
    })
    if (!skill) throw new AppException(HttpStatus.NOT_FOUND, 'SKILL_NOT_FOUND', '技能不存在')
    if (!skill.versions.length) throw new AppException(HttpStatus.BAD_REQUEST, 'NO_PUBLISHED_VERSION', '该技能暂无已发布版本')

    const version = skill.versions[0]

    // 记录安装
    await this.prisma.userInstalledSkill.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      create: { userId, skillId: skill.id, installedVersion: version.version },
      update: { installedVersion: version.version },
    })

    // 更新下载计数
    await this.prisma.skill.update({
      where: { id: skill.id },
      data: { downloadCount: { increment: 1 } },
    })

    return {
      message: '安装成功',
      version: version.version,
      files: version.files.map(f => ({ path: f.path, content: f.content, encoding: f.encoding })),
      content: version.content,
    }
  }

  async findPublicBySlug(slug: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, name: true, description: true,
        tags: true, latestVersion: true, visibility: true, status: true,
        downloadCount: true, starCount: true, likeCount: true,
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
          downloadCount: true, starCount: true, likeCount: true,
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
