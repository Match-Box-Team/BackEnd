import { IsNumber, IsString } from 'class-validator';

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

  @IsNumber()
  winnerScore: number;

  @IsNumber()
  loserScore: number;
}
