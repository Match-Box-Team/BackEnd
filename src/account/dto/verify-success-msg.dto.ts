import { IsBoolean, IsString } from 'class-validator';

export class VerifySuccessMsgDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;
}