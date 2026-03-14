import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  username?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string

  @IsOptional()
  @IsString()
  // base64 data URI, 最大约 6.7MB (5MB file)
  avatar?: string
}
