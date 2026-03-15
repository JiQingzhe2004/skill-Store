import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: '评论内容不能为空' })
  @MaxLength(1000, { message: '评论内容不超过 1000 个字符' })
  content!: string

  @IsOptional()
  @IsString()
  parentId?: string
}
