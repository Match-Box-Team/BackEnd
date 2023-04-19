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

export class FriendGameHistoryDto {
  gameId: string;
  name: string;
  gameHistory: {
    winner: {
      userId: string;
      nickname: string;
      image: string;
      score: number;
    };
    loser: {
      userId: string;
      nickname: string;
      image: string;
      score: number;
    };
  }[];
}
