import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class AdminSetupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  secret!: string
}
