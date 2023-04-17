import { IsString } from 'class-validator';

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
