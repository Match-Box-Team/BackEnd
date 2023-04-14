import { IsNotEmpty, IsString } from 'class-validator';

export class gameIdDto {
  @IsString()
  gameId: string;
}

export class gameWatchIdDto {
  @IsString()
  gameWatchId: string;
}

export class GameHistoryDto {
  @IsString()
  winnerId: string;

  @IsString()
  loserId: string;
}
