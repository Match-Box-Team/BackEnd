import { Injectable } from '@nestjs/common';
import { GamesRepository } from '../repository/games.repository';

@Injectable()
export class PingpongService {
  constructor(private gameRepository: GamesRepository) {}
  private paddleInfo = {
    width: 100,
    height: 4,
    paddleAX: 100,
    paddleBX: 100,
    paddleAY: 30,
    paddleBY: 445,
    speed: 4,
  };

  private ball = {
    x: 150,
    y: 75,
    radius: 6,
    velocityX: 5,
    velocityY: 5,
    color: 'white',
  };
  private mapSize = { width: 325, height: 485 };
  private paddleAPosition = 100;
  private paddleBPosition = 100;

  private scoreA = 0;
  private scoreB = 0;
  private goalScore = 3;

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

  updatePaddleAPosition(control: any): number {
    this.paddleAPosition = this.updatePaddlePosition(
      this.paddleAPosition,
      control,
    );
    return this.paddleAPosition;
  }

  updatePaddleBPosition(control: any): number {
    this.paddleBPosition = this.updatePaddlePosition(
      this.paddleBPosition,
      control,
    );
    return this.paddleBPosition;
  }

  getPaddleBPosition(): number {
    return this.paddleBPosition;
  }

  getPaddleAPosition(): number {
    return this.paddleAPosition;
  }

  ballControl(paddleAPosition: number, paddleBPosition: number): any {
    // Calculate the new ball position
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    if (
      this.ball.x + this.ball.radius > this.mapSize.width ||
      this.ball.x - this.ball.radius < 0
    ) {
      this.ball.velocityX = -this.ball.velocityX;
    }

    if (
      this.ball.y + this.ball.radius > this.mapSize.height ||
      this.ball.y - this.ball.radius < 0
    ) {
      this.ball.velocityY = -this.ball.velocityY;
    }

    if (
      (this.ball.y - this.ball.radius <
        this.paddleInfo.paddleAY + this.paddleInfo.height &&
        this.ball.y + this.ball.radius > this.paddleInfo.paddleAY &&
        this.ball.x - this.ball.radius <
          paddleAPosition + this.paddleInfo.width &&
        this.ball.x + this.ball.radius > paddleAPosition) ||
      (this.ball.y - this.ball.radius <
        this.paddleInfo.paddleBY + this.paddleInfo.height &&
        this.ball.y + this.ball.radius >
          this.paddleInfo.paddleBY + this.paddleInfo.height &&
        this.ball.x - this.ball.radius <
          paddleBPosition + this.paddleInfo.width &&
        this.ball.x + this.ball.radius > paddleBPosition)
    ) {
      this.ball.velocityY = -this.ball.velocityY;
    }
    return this.ball;
  }

  getMapSize(): any {
    return this.mapSize;
  }

  getBallInfo(): any {
    return this.ballControl(
      this.getPaddleAPosition(),
      this.getPaddleBPosition(),
    );
  }

  addScoreToA() {
    this.scoreA++;
  }

  addScoreToB() {
    this.scoreB++;
  }

  getScores(): any {
    if (this.ball.y + this.ball.radius > this.mapSize.height) {
      this.addScoreToA();
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.addScoreToB();
    }
    return { scoreA: this.scoreA, scoreB: this.scoreB };
  }

  setScoresZeros() {
    this.scoreA = 0;
    this.scoreB = 0;
  }

  getWinner(userIdA, userIdB) {
    let winner = '';
    const goalScore = this.goalScore;
    if (this.scoreA === goalScore) {
      winner = 'A';
      // console.log('players : ', userIdA, userIdB);
      this.gameRepository.createGameHistory({
        winnerId: userIdA,
        loserId: userIdB,
        winnerScore: this.scoreA,
        loserScore: this.scoreB,
      });
    }
    if (this.scoreB === goalScore) {
      winner = 'B';
      this.gameRepository.createGameHistory({
        winnerId: userIdB,
        loserId: userIdA,
        winnerScore: this.scoreA,
        loserScore: this.scoreB,
      });
    }
    return winner;
  }
}
