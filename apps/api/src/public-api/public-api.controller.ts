import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'

import { getClientIp } from '../common/utils/request'
import { CurrentApiClient } from './decorators/current-api-client.decorator'
import { ApiKeyGuard } from './guards/api-key.guard'
import { PublicApiService } from './public-api.service'
import { ApiClientContext } from './types/api-client-context'

@Controller('v1/skills')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  private requestMeta(client: ApiClientContext, request: Request) {
    return {
      apiClientId: client.id,
      requestIp: getClientIp(request),
    }
  }

  @Get()
  list(
    @CurrentApiClient() client: ApiClientContext,
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.publicApiService.listSkills(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      this.requestMeta(client, request),
    )
  }

  @Get(':slug/manifest')
  manifest(
    @CurrentApiClient() client: ApiClientContext,
    @Req() request: Request,
    @Param('slug') slug: string,
    @Query('version') version?: string,
  ) {
    return this.publicApiService.getManifest(
      slug,
      client,
      version,
      this.requestMeta(client, request),
    )
  }

  @Get(':slug')
  detail(
    @CurrentApiClient() client: ApiClientContext,
    @Req() request: Request,
    @Param('slug') slug: string,
    @Query('version') version?: string,
  ) {
    return this.publicApiService.getSkillBySlug(
      slug,
      client,
      version,
      this.requestMeta(client, request),
    )
  }
}
