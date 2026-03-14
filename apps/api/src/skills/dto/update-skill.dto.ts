import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { SkillVisibility } from '@prisma/client'

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  tags?: string

  @IsOptional()
  @IsEnum(SkillVisibility)
  visibility?: SkillVisibility
}
