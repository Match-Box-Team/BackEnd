import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

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
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class VerifyCodeDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
