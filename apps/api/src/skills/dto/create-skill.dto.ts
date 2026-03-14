import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { SkillVisibility } from '@prisma/client'

export class CreateSkillDto {
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name: string

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug 只能包含小写字母、数字和连字符' })
  @MinLength(2)
  @MaxLength(128)
  slug: string

  @IsString()
  @MinLength(10)
  @MaxLength(512)
  description: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  tags?: string

  @IsOptional()
  @IsEnum(SkillVisibility)
  visibility?: SkillVisibility
}
