import { IsString, IsEmail, IsOptional}  from 'class-validator';

export class CreateUserDto {
  @IsString()
  nickname: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsEmail()
  email: string;

  @IsString()
  image: string;

  @IsString()
  intraId: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}