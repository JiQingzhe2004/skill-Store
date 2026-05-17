import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import sharp from 'sharp'

import { AppException } from '../common/exceptions/app.exception'
import { getDataDir } from '../config/runtime-config'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024
const TARGET_MAX_BYTES = 1 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })
    if (!user) throw new AppException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', '用户不存在')
    return user
  }

  async getMyInstalls(userId: string) {
    const installs = await this.prisma.userInstalledSkill.findMany({
      where: { userId },
      orderBy: { installedAt: 'desc' },
      select: {
        installedVersion: true,
        installedAt: true,
        trackLatest: true,
        skill: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            latestVersion: true,
            status: true,
            downloadCount: true,
            starCount: true,
            likeCount: true,
            author: { select: { username: true, avatar: true } },
          },
        },
      },
    })

    return installs.map(row => {
      const latest = row.skill.latestVersion
      const hasUpdate = !!latest && latest !== row.installedVersion
      return {
        ...row.skill,
        installedVersion: row.installedVersion,
        installedAt: row.installedAt,
        trackLatest: row.trackLatest,
        hasUpdate,
      }
    })
  }

  async getMyStars(userId: string) {
    const stars = await this.prisma.skillStar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        skill: {
          select: {
            id: true, slug: true, name: true, description: true,
            latestVersion: true, status: true,
            downloadCount: true, starCount: true, likeCount: true,
            author: { select: { username: true, avatar: true } },
          },
        },
      },
    })
    return stars.map(s => ({ ...s.skill, starredAt: s.createdAt }))
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimetype: string) {
    if (!ALLOWED_MIME.has(mimetype)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'AVATAR_TYPE_INVALID', '仅支持 JPG / PNG / WebP / GIF 格式')
    }

    const { data, ext } = await this.processImage(buffer, mimetype)

    const dir = getAvatarDir()
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    // Remove any previous avatar files for this user (extension may change).
    purgeExistingForUser(dir, userId)

    const filename = `${userId}.${ext}`
    writeFileSync(path.join(dir, filename), data)

    // Cache-busting via mtime so the new image loads immediately in the browser.
    const url = `/api/avatars/${filename}?v=${Date.now()}`

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
      select: {
        id: true, email: true, username: true, avatar: true,
        bio: true, role: true, createdAt: true,
      },
    })
    return user
  }

  async removeAvatar(userId: string) {
    const dir = getAvatarDir()
    if (existsSync(dir)) purgeExistingForUser(dir, userId)

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true, email: true, username: true, avatar: true,
        bio: true, role: true, createdAt: true,
      },
    })
    return user
  }

  /**
   * Re-encodes the upload through sharp. If under threshold, only normalizes
   * the format / strips metadata. If over threshold, progressively reduces
   * dimensions + quality until the result fits under TARGET_MAX_BYTES.
   */
  private async processImage(buffer: Buffer, mimetype: string): Promise<{ data: Buffer; ext: string }> {
    const isGif = mimetype === 'image/gif'
    // GIFs (potentially animated) — keep format, but enforce size limit by
    // refusing to silently strip animation.
    if (isGif) {
      if (buffer.byteLength > TARGET_MAX_BYTES) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'AVATAR_TOO_LARGE',
          'GIF 头像不能超过 1MB（请改用 JPG/PNG 上传，超出会自动压缩）',
        )
      }
      return { data: buffer, ext: 'gif' }
    }

    const pickFormat = (m: string): 'jpeg' | 'png' | 'webp' => {
      if (m === 'image/png') return 'png'
      if (m === 'image/webp') return 'webp'
      return 'jpeg'
    }
    const ext = (f: 'jpeg' | 'png' | 'webp') => (f === 'jpeg' ? 'jpg' : f)

    const format = pickFormat(mimetype)

    if (buffer.byteLength <= COMPRESS_THRESHOLD_BYTES) {
      // Still re-encode to normalize / strip EXIF, but at high quality.
      const out = await sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .toFormat(format, format === 'png' ? {} : { quality: 90 })
        .toBuffer()
      return { data: out, ext: ext(format) }
    }

    // > 2MB: progressively reduce to fit under 1MB.
    const sizeSteps = [1024, 768, 512, 384, 256]
    const qualitySteps = format === 'png' ? [9, 9, 9, 9, 9] : [80, 70, 60, 50, 40]
    for (let i = 0; i < sizeSteps.length; i++) {
      const out = await sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize({ width: sizeSteps[i], height: sizeSteps[i], fit: 'inside', withoutEnlargement: true })
        .toFormat(format, format === 'png'
          ? { compressionLevel: qualitySteps[i] }
          : { quality: qualitySteps[i] })
        .toBuffer()
      if (out.byteLength <= TARGET_MAX_BYTES) {
        this.logger.log(
          `Avatar compressed: ${buffer.byteLength}B → ${out.byteLength}B (size=${sizeSteps[i]}, q=${qualitySteps[i]})`,
        )
        return { data: out, ext: ext(format) }
      }
    }

    // Last resort: small JPEG.
    const fallback = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 35 })
      .toBuffer()
    return { data: fallback, ext: 'jpg' }
  }
}

export function getAvatarDir(): string {
  return path.join(getDataDir(), 'avatars')
}

function purgeExistingForUser(dir: string, userId: string) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(`${userId}.`)) {
        try { unlinkSync(path.join(dir, entry)) } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}
