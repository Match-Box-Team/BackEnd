import { IsBoolean, IsNotEmpty } from 'class-validator';

export class FriendsSetBanDto {
  @IsBoolean()
  @IsNotEmpty()
  isBan: boolean;
}

export class FriendsAddDto {
  @IsNotEmpty()
  userId: string;
}
