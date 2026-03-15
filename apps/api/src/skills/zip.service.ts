import { Injectable, BadRequestException } from '@nestjs/common'
import * as unzipper from 'unzipper'
import { Readable } from 'stream'

export interface ZipFile {
  path: string
  content: string
  encoding: 'utf8' | 'base64'
  size: number
}

// 允许的文本文件扩展名
const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.ts', '.js', '.mjs', '.cjs', '.json', '.yaml', '.yml',
  '.toml', '.sh', '.bash', '.zsh', '.py', '.rb', '.go', '.rs', '.java',
  '.c', '.cpp', '.h', '.css', '.html', '.xml', '.env', '.gitignore',
  '.dockerignore', '.prisma', '.graphql', '.sql', '.csv', '.ini', '.cfg',
])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file
const MAX_TOTAL_SIZE = 20 * 1024 * 1024 // 20MB total
const MAX_FILES = 100

@Injectable()
export class ZipService {
  async extractZip(buffer: Buffer): Promise<ZipFile[]> {
    const files: ZipFile[] = []
    let totalSize = 0

    const directory = await unzipper.Open.buffer(buffer)

    if (directory.files.length > MAX_FILES) {
      throw new BadRequestException(`ZIP 文件包含过多文件（最多 ${MAX_FILES} 个）`)
    }

    // 过滤掉目录和隐藏/系统文件
    const validFiles = directory.files.filter(f => {
      if (f.type === 'Directory') return false
      const name = f.path.split('/').pop() ?? ''
      if (name.startsWith('.') && name !== '.env' && name !== '.gitignore' && name !== '.dockerignore') return false
      if (name === '__MACOSX' || f.path.includes('__MACOSX/')) return false
      if (name === '.DS_Store') return false
      return true
    })

    for (const file of validFiles) {
      const fileBuffer = await file.buffer()
      const size = fileBuffer.length

      if (size > MAX_FILE_SIZE) {
        throw new BadRequestException(`文件 ${file.path} 超过大小限制（最大 5MB）`)
      }

      totalSize += size
      if (totalSize > MAX_TOTAL_SIZE) {
        throw new BadRequestException('ZIP 包总大小超过限制（最大 20MB）')
      }

      // 标准化路径：去掉顶层目录前缀
      let normalizedPath = file.path
      const parts = normalizedPath.split('/')
      if (parts.length > 1 && validFiles.every(f => f.path.startsWith(parts[0] + '/'))) {
        normalizedPath = parts.slice(1).join('/')
      }
      if (!normalizedPath) continue

      // 判断是否为文本文件
      const ext = '.' + (normalizedPath.split('.').pop() ?? '').toLowerCase()
      const isText = TEXT_EXTENSIONS.has(ext)

      if (isText) {
        files.push({
          path: normalizedPath,
          content: fileBuffer.toString('utf8'),
          encoding: 'utf8',
          size,
        })
      } else {
        files.push({
          path: normalizedPath,
          content: fileBuffer.toString('base64'),
          encoding: 'base64',
          size,
        })
      }
    }

    if (files.length === 0) {
      throw new BadRequestException('ZIP 包中没有有效文件')
    }

    // 必须包含 SKILL.md
    const hasSkillMd = files.some(f =>
      f.path === 'SKILL.md' || f.path.toLowerCase() === 'skill.md'
    )
    if (!hasSkillMd) {
      throw new BadRequestException('ZIP 包中必须包含 SKILL.md 文件')
    }

    return files
  }

  extractSkillMdContent(files: ZipFile[]): string {
    const skillMd = files.find(f =>
      f.path === 'SKILL.md' || f.path.toLowerCase() === 'skill.md'
    )
    return skillMd?.content ?? ''
  }
}
