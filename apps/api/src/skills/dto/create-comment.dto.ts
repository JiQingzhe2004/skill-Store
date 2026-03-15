import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateCommentDto {
  @IsString({ message: '评论内容格式错误' })
  @MinLength(1, { message: '评论内容不能为空' })
  @MaxLength(2000, { message: '评论内容不超过 2000 个字符' })
  content!: string

  @IsOptional()
  @IsString()
  parentId?: string
}
