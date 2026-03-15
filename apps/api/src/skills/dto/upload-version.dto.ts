import { IsOptional, IsString } from 'class-validator'

export class UploadVersionDto {
  @IsOptional()
  @IsString()
  changelog?: string
}
