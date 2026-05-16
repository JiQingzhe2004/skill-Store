import { HttpStatus, Injectable } from '@nestjs/common'
import { ApiClientStatus } from '@prisma/client'

import { AppException } from '../common/exceptions/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { ApiKeyService } from './api-key.service'
import { CreateApiClientDto } from './dto/create-api-client.dto'
import { UpdateApiClientStatusDto } from './dto/update-api-client-status.dto'

const MAX_KEYS_PER_USER = 10

@Injectable()
export class ApiClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  findAll(ownerId: string) {
    return this.prisma.apiClient.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        lastUsedAt: true,
        createdAt: true,
      },
    })
  }

  async create(ownerId: string, dto: CreateApiClientDto) {
    const count = await this.prisma.apiClient.count({ where: { ownerId } })
    if (count >= MAX_KEYS_PER_USER) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'API_KEY_LIMIT', `每个账号最多创建 ${MAX_KEYS_PER_USER} 个 API Key`)
    }

    const { rawKey, keyPrefix, apiKeyHash } = this.apiKeyService.generate()
    const client = await this.prisma.apiClient.create({
      data: {
        ownerId,
        name: dto.name.trim(),
        keyPrefix,
        apiKeyHash,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        createdAt: true,
      },
    })

    return { ...client, apiKey: rawKey }
  }

  async updateStatus(ownerId: string, id: string, dto: UpdateApiClientStatusDto) {
    const client = await this.prisma.apiClient.findFirst({
      where: { id, ownerId },
    })
    if (!client) {
      throw new AppException(HttpStatus.NOT_FOUND, 'API_CLIENT_NOT_FOUND', 'API Key 不存在')
    }

    return this.prisma.apiClient.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        lastUsedAt: true,
        createdAt: true,
      },
    })
  }

  async remove(ownerId: string, id: string) {
    const client = await this.prisma.apiClient.findFirst({
      where: { id, ownerId },
    })
    if (!client) {
      throw new AppException(HttpStatus.NOT_FOUND, 'API_CLIENT_NOT_FOUND', 'API Key 不存在')
    }

    await this.prisma.apiClient.delete({ where: { id } })
    return { deleted: true }
  }

  async findByRawKey(rawKey: string) {
    if (!rawKey.startsWith('ssk_')) return null
    const hash = this.apiKeyService.hash(rawKey)
    const client = await this.prisma.apiClient.findFirst({
      where: { apiKeyHash: hash, status: ApiClientStatus.ACTIVE },
      include: { owner: { select: { id: true, isBanned: true, bannedUntil: true } } },
    })
    if (!client) return null
    if (client.owner.isBanned) {
      const until = client.owner.bannedUntil
      if (!until || until > new Date()) return null
    }
    return client
  }

  touchLastUsed(id: string) {
    return this.prisma.apiClient.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    })
  }
}
