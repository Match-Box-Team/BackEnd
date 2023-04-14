import { IsNotEmpty, IsString } from 'class-validator';

// 예시
export class GamesDto {
  //   @IsString()
  //   userId: string;
}

export interface gameIdDto {
  gameId: string;
}

export interface gameWatchIdDto {
  gameWatchId: string;
}

export interface GameHistoryDto {
  winnerId: string;
  loserId: string;
}
