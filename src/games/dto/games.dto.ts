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

export class MapSizeDto {
  @IsNumber()
  @IsNotEmpty()
  width: number;

  @IsNumber()
  @IsNotEmpty()
  height: number;
}

export class UserInputDto {
  @IsNumber()
  @IsNotEmpty()
  direction: number;
}

export class PaddleControlDto {
  @IsNumber()
  @IsNotEmpty()
  position: number;
}

export class BallDto {
  @IsNumber()
  @IsNotEmpty()
  x: number;

  @IsNumber()
  @IsNotEmpty()
  y: number;

  @IsNumber()
  @IsNotEmpty()
  radius: number;

  @IsNumber()
  @IsNotEmpty()
  velocityX: number;

  @IsNumber()
  @IsNotEmpty()
  velocityY: number;

  @IsString()
  @IsNotEmpty()
  color: string;
}

export class BallInfoDto {
  @IsNotEmpty()
  ball: BallDto;
}

export class PingPongInfoDto {
  paddleAPosition = 100;
  paddleBPosition = 100;

  scoreA = 0;
  scoreB = 0;
  goalScore = 11;

  mapSize = { width: 325, height: 485 };

  ball = {
    x: 150,
    y: 75,
    radius: 6,
    velocityX: 5,
    velocityY: 5,
    color: 'white',
  };

  paddleInfo = {
    width: 100,
    height: 4,
    paddleAX: 100,
    paddleBX: 100,
    paddleAY: 30,
    paddleBY: 445,
    speed: 4,
  };

  updatePaddlePosition(paddlePosition: number, control: any): number {
    paddlePosition += this.paddleInfo.speed * control.direction;

    if (paddlePosition < 0) {
      paddlePosition = 0;
    }
    if (paddlePosition + this.paddleInfo.width >= 325) {
      paddlePosition = this.mapSize.width - this.paddleInfo.width;
    }
    return paddlePosition;
  }

  addScoreToA() {
    this.scoreA++;
  }

  addScoreToB() {
    this.scoreB++;
  }
}
