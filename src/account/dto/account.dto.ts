import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

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

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserId {
  @IsString()
  userId: string;
}

export class VerifyCodeDto {
  @IsString()
  userId: string;

  @IsString()
  code: string;
}
