import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FriendsSetBanDto {
  @IsBoolean()
  @IsNotEmpty()
  isBan: boolean;
}

export class FriendsAddDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
