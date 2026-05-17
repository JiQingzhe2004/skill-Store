import { Body, Controller, Get, Post } from '@nestjs/common'
import { Type } from 'class-transformer'
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

import { SetupService } from './setup.service'

class DbConnectionDto {
  @IsString() @IsNotEmpty() host!: string
  @IsInt() @Min(1) @Max(65535) port!: number
  @IsString() @IsNotEmpty() user!: string
  @IsString() password!: string
  @IsString() @IsNotEmpty() database!: string
  @IsOptional() @IsString() shadowDatabase?: string
}

class SmtpDto {
  @IsString() @IsNotEmpty() host!: string
  @IsInt() @Min(1) @Max(65535) port!: number
  @IsOptional() @IsString() user?: string
  @IsOptional() @IsString() pass?: string
  @IsString() @IsNotEmpty() from!: string
}

class TestDbDto {
  @ValidateNested() @Type(() => DbConnectionDto) db!: DbConnectionDto
}

class TestSmtpDto {
  @ValidateNested() @Type(() => SmtpDto) smtp!: SmtpDto
  @IsOptional() @IsString() to?: string
}

class SubmitSetupDto {
  @ValidateNested() @Type(() => DbConnectionDto) db!: DbConnectionDto
  @ValidateNested() @Type(() => SmtpDto) smtp!: SmtpDto
  @IsUrl({ require_tld: false }) appUrl!: string
  @IsString() @IsNotEmpty() adminSetupSecret!: string
  @IsOptional() @IsString() jwtAccessSecret?: string
  @IsOptional() @IsString() jwtRefreshSecret?: string
}

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  status() {
    return this.setupService.getStatus()
  }

  @Post('test-db')
  testDb(@Body() body: TestDbDto) {
    return this.setupService.testConnection(body.db)
  }

  @Post('test-smtp')
  testSmtp(@Body() body: TestSmtpDto) {
    return this.setupService.testSmtp(body.smtp, body.to)
  }

  @Post('submit')
  submit(@Body() body: SubmitSetupDto) {
    return this.setupService.submit(body)
  }
}
