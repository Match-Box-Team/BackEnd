import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
