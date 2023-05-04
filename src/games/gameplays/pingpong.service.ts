import { Injectable } from '@nestjs/common';
import { GamesRepository } from '../repository/games.repository';
import { PingPongInfoDto } from '../dto/games.dto';

@Injectable()
export class PingpongService {
  constructor(private gameRepository: GamesRepository) {}
  private gameRooms = new Map<string, PingPongInfoDto>();
  // pingpongInfo = new PingPongInfoDto();
  InitGameInfo() {
    this.gameRooms['mygame'] = new PingPongInfoDto();
  }

  // private paddleInfo = {
  //   width: 100,
  //   height: 4,
  //   paddleAX: 100,
  //   paddleBX: 100,
  //   paddleAY: 30,
  //   paddleBY: 445,
  //   speed: 4,
  // };

  // private ball = {
  //   x: 150,
  //   y: 75,
  //   radius: 6,
  //   velocityX: 5,
  //   velocityY: 5,
  //   color: 'white',
  // };
  // private mapSize = { width: 325, height: 485 };
  // private paddleAPosition = 100;
  // private paddleBPosition = 100;

  // private scoreA = 0;
  // private scoreB = 0;
  // private goalScore = 3;

  // updatePaddlePosition(paddlePosition: number, control: any): number {
  //   paddlePosition += this.paddleInfo.speed * control.direction;

  //   if (paddlePosition < 0) {
  //     paddlePosition = 0;
  //   }
  //   if (paddlePosition + this.paddleInfo.width >= 325) {
  //     paddlePosition = this.mapSize.width - this.paddleInfo.width;
  //   }
  //   return paddlePosition;
  // }

  updatePaddleAPosition(control: any): number {
    this.gameRooms['mygame'].paddleAPosition = this.gameRooms[
      'mygame'
    ].updatePaddlePosition(this.gameRooms['mygame'].paddleAPosition, control);
    return this.gameRooms['mygame'].paddleAPosition;
  }

  updatePaddleBPosition(control: any): number {
    this.gameRooms['mygame'].paddleBPosition = this.gameRooms[
      'mygame'
    ].updatePaddlePosition(this.gameRooms['mygame'].paddleBPosition, control);
    return this.gameRooms['mygame'].paddleBPosition;
  }

  getPaddleBPosition(): number {
    return this.gameRooms['mygame'].paddleBPosition;
  }

  getPaddleAPosition(): number {
    return this.gameRooms['mygame'].paddleAPosition;
  }

  ballControl(paddleAPosition: number, paddleBPosition: number): any {
    // Calculate the new ball position
    this.gameRooms['mygame'].ball.x += this.gameRooms['mygame'].ball.velocityX;
    this.gameRooms['mygame'].ball.y += this.gameRooms['mygame'].ball.velocityY;

    if (
      this.gameRooms['mygame'].ball.x + this.gameRooms['mygame'].ball.radius >
        this.gameRooms['mygame'].mapSize.width ||
      this.gameRooms['mygame'].ball.x - this.gameRooms['mygame'].ball.radius < 0
    ) {
      this.gameRooms['mygame'].ball.velocityX =
        -this.gameRooms['mygame'].ball.velocityX;
    }

    if (
      this.gameRooms['mygame'].ball.y + this.gameRooms['mygame'].ball.radius >
        this.gameRooms['mygame'].mapSize.height ||
      this.gameRooms['mygame'].ball.y - this.gameRooms['mygame'].ball.radius < 0
    ) {
      this.gameRooms['mygame'].ball.velocityY =
        -this.gameRooms['mygame'].ball.velocityY;
    }

    if (
      (this.gameRooms['mygame'].ball.y - this.gameRooms['mygame'].ball.radius <
        this.gameRooms['mygame'].paddleInfo.paddleAY +
          this.gameRooms['mygame'].paddleInfo.height &&
        this.gameRooms['mygame'].ball.y + this.gameRooms['mygame'].ball.radius >
          this.gameRooms['mygame'].paddleInfo.paddleAY &&
        this.gameRooms['mygame'].ball.x - this.gameRooms['mygame'].ball.radius <
          paddleAPosition + this.gameRooms['mygame'].paddleInfo.width &&
        this.gameRooms['mygame'].ball.x + this.gameRooms['mygame'].ball.radius >
          paddleAPosition) ||
      (this.gameRooms['mygame'].ball.y - this.gameRooms['mygame'].ball.radius <
        this.gameRooms['mygame'].paddleInfo.paddleBY +
          this.gameRooms['mygame'].paddleInfo.height &&
        this.gameRooms['mygame'].ball.y + this.gameRooms['mygame'].ball.radius >
          this.gameRooms['mygame'].paddleInfo.paddleBY +
            this.gameRooms['mygame'].paddleInfo.height &&
        this.gameRooms['mygame'].ball.x - this.gameRooms['mygame'].ball.radius <
          paddleBPosition + this.gameRooms['mygame'].paddleInfo.width &&
        this.gameRooms['mygame'].ball.x + this.gameRooms['mygame'].ball.radius >
          paddleBPosition)
    ) {
      this.gameRooms['mygame'].ball.velocityY =
        -this.gameRooms['mygame'].ball.velocityY;
    }
    return this.gameRooms['mygame'].ball;
  }

  getMapSize(): any {
    return this.gameRooms['mygame'].mapSize;
  }

  getBallInfo(): any {
    return this.ballControl(
      this.getPaddleAPosition(),
      this.getPaddleBPosition(),
    );
  }

  getScores(): any {
    if (
      this.gameRooms['mygame'].ball.y + this.gameRooms['mygame'].ball.radius >
      this.gameRooms['mygame'].mapSize.height
    ) {
      this.gameRooms['mygame'].addScoreToA();
    }
    if (
      this.gameRooms['mygame'].ball.y - this.gameRooms['mygame'].ball.radius <
      0
    ) {
      this.gameRooms['mygame'].addScoreToB();
    }
    return {
      scoreA: this.gameRooms['mygame'].scoreA,
      scoreB: this.gameRooms['mygame'].scoreB,
    };
  }

  setScoresZeros() {
    this.gameRooms['mygame'].scoreA = 0;
    this.gameRooms['mygame'].scoreB = 0;
  }

  getWinner(userIdA, userIdB) {
    let winner = '';
    const goalScore = this.gameRooms['mygame'].goalScore;
    if (this.gameRooms['mygame'].scoreA === goalScore) {
      winner = 'A';
      // console.log('players : ', userIdA, userIdB);
      this.gameRepository.createGameHistory({
        winnerId: userIdA,
        loserId: userIdB,
        winnerScore: this.gameRooms['mygame'].scoreA,
        loserScore: this.gameRooms['mygame'].scoreB,
      });
    }
    if (this.gameRooms['mygame'].scoreB === goalScore) {
      winner = 'B';
      this.gameRepository.createGameHistory({
        winnerId: userIdB,
        loserId: userIdA,
        winnerScore: this.gameRooms['mygame'].scoreB,
        loserScore: this.gameRooms['mygame'].scoreA,
      });
    }
    return winner;
  }
}
