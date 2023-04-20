import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class gameIdDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  gameId: string;
}

export class gameWatchIdDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  gameWatchId: string;
}

export class GameHistoryDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  winnerId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  loserId: string;

  @IsNumber()
  @IsNotEmpty()
  winnerScore: number;

  @IsNumber()
  @IsNotEmpty()
  loserScore: number;
}
