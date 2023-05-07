import { Injectable } from '@nestjs/common';
import { GamesRepository } from '../repository/games.repository';
import { PingPongInfoDto } from '../dto/games.dto';
import { GamesService } from '../games.service';
import { UserProfile } from '../repository/game.type';

@Injectable()
export class PingpongService {
  constructor(
    private gameRepository: GamesRepository,
    private gamesService: GamesService,
  ) {}
  private gameRooms = new Map<string, PingPongInfoDto>();

  InitGameInfo(gameWatchId: string, speed: number) {
    const pingPongInfo = new PingPongInfoDto();
    pingPongInfo.ball.velocityX = speed + 2;
    pingPongInfo.ball.velocityY = speed + 2;
    this.gameRooms[gameWatchId] = pingPongInfo;
    console.log('------------init-------------');
    console.log(this.gameRooms[gameWatchId]);
    console.log('-----------------------------');
  }

  updatePaddleAPosition(gameWatchId: string, control: any): number {
    this.gameRooms[gameWatchId].paddleAPosition = this.gameRooms[
      gameWatchId
    ].updatePaddlePosition(
      this.gameRooms[gameWatchId]?.paddleAPosition,
      control,
    );
    return this.gameRooms[gameWatchId]?.paddleAPosition;
  }

  updatePaddleBPosition(gameWatchId: string, control: any): number {
    this.gameRooms[gameWatchId].paddleBPosition = this.gameRooms[
      gameWatchId
    ].updatePaddlePosition(
      this.gameRooms[gameWatchId]?.paddleBPosition,
      control,
    );
    return this.gameRooms[gameWatchId]?.paddleBPosition;
  }

  getPaddleBPosition(gameWatchId: string): number {
    return this.gameRooms[gameWatchId]?.paddleBPosition;
  }

  getPaddleAPosition(gameWatchId: string): number {
    return this.gameRooms[gameWatchId]?.paddleAPosition;
  }

  ballControl(
    gameWatchId: string,
    paddleAPosition: number,
    paddleBPosition: number,
  ): any {
    if (!this.gameRooms || !this.gameRooms[gameWatchId]) {
      console.error(`Game room not found for gameWatchId: ${gameWatchId}`);
      return;
    }
    // Calculate the new ball position
    this.gameRooms[gameWatchId].ball.x +=
      this.gameRooms[gameWatchId].ball.velocityX;
    this.gameRooms[gameWatchId].ball.y +=
      this.gameRooms[gameWatchId].ball.velocityY;

    if (
      this.gameRooms[gameWatchId].ball.x +
        this.gameRooms[gameWatchId].ball.radius >
        this.gameRooms[gameWatchId].mapSize.width ||
      this.gameRooms[gameWatchId].ball.x -
        this.gameRooms[gameWatchId].ball.radius <
        0
    ) {
      this.gameRooms[gameWatchId].ball.velocityX =
        -this.gameRooms[gameWatchId].ball.velocityX;
    }

    if (
      this.gameRooms[gameWatchId].ball.y +
        this.gameRooms[gameWatchId].ball.radius >
        this.gameRooms[gameWatchId].mapSize.height ||
      this.gameRooms[gameWatchId].ball.y -
        this.gameRooms[gameWatchId].ball.radius <
        0
    ) {
      this.gameRooms[gameWatchId].ball.velocityY =
        -this.gameRooms[gameWatchId].ball.velocityY;
    }

    if (
      (this.gameRooms[gameWatchId].ball.y -
        this.gameRooms[gameWatchId].ball.radius <
        this.gameRooms[gameWatchId].paddleInfo.paddleAY +
          this.gameRooms[gameWatchId].paddleInfo.height &&
        this.gameRooms[gameWatchId].ball.y +
          this.gameRooms[gameWatchId].ball.radius >
          this.gameRooms[gameWatchId].paddleInfo.paddleAY &&
        this.gameRooms[gameWatchId].ball.x -
          this.gameRooms[gameWatchId].ball.radius <
          paddleAPosition + this.gameRooms[gameWatchId].paddleInfo.width &&
        this.gameRooms[gameWatchId].ball.x +
          this.gameRooms[gameWatchId].ball.radius >
          paddleAPosition) ||
      (this.gameRooms[gameWatchId].ball.y -
        this.gameRooms[gameWatchId].ball.radius <
        this.gameRooms[gameWatchId].paddleInfo.paddleBY +
          this.gameRooms[gameWatchId].paddleInfo.height &&
        this.gameRooms[gameWatchId].ball.y +
          this.gameRooms[gameWatchId].ball.radius >
          this.gameRooms[gameWatchId].paddleInfo.paddleBY +
            this.gameRooms[gameWatchId].paddleInfo.height &&
        this.gameRooms[gameWatchId].ball.x -
          this.gameRooms[gameWatchId].ball.radius <
          paddleBPosition + this.gameRooms[gameWatchId].paddleInfo.width &&
        this.gameRooms[gameWatchId].ball.x +
          this.gameRooms[gameWatchId].ball.radius >
          paddleBPosition)
    ) {
      this.gameRooms[gameWatchId].ball.velocityY =
        -this.gameRooms[gameWatchId].ball.velocityY;
    }
    return this.gameRooms[gameWatchId].ball;
  }

  getMapSize(gameWatchId: string): any {
    // return this.gameRooms[gameWatchId]?.mapSize;
    return { width: 325, height: 485 };
  }

  getBallInfo(gameWatchId: string): any {
    return this.ballControl(
      gameWatchId,
      this.getPaddleAPosition(gameWatchId),
      this.getPaddleBPosition(gameWatchId),
    );
  }

  getScores(gameWatchId: string): any {
    if (!this.gameRooms || !this.gameRooms[gameWatchId]) {
      console.error(`Game room not found for gameWatchId: ${gameWatchId}`);
      return;
    }
    if (
      this.gameRooms[gameWatchId].ball.y +
        this.gameRooms[gameWatchId].ball.radius >
      this.gameRooms[gameWatchId].mapSize.height
    ) {
      this.gameRooms[gameWatchId].addScoreToA();
    }
    if (
      this.gameRooms[gameWatchId].ball.y -
        this.gameRooms[gameWatchId].ball.radius <
      0
    ) {
      this.gameRooms[gameWatchId].addScoreToB();
    }
    const scoreA = this.gameRooms[gameWatchId].scoreA;
    const scoreB = this.gameRooms[gameWatchId].scoreB;
    this.gameRooms.delete(gameWatchId);
    return {
      scoreA: scoreA,
      scoreB: scoreB,
    };
  }

  setScoresZeros(gameWatchId: string) {
    this.gameRooms[gameWatchId].scoreA = 0;
    this.gameRooms[gameWatchId].scoreB = 0;
  }

  getWinner = async (gameWatchId: string, userIdA: string, userIdB: string) => {
    if (!this.gameRooms || !this.gameRooms[gameWatchId]) {
      console.error(`Game room not found for gameWatchId: ${gameWatchId}`);
      return;
    }
    let winner = '';
    const goalScore = this.gameRooms[gameWatchId].goalScore;
    if (this.gameRooms[gameWatchId].scoreA === goalScore) {
      console.log('A winner:', goalScore);
      const user: UserProfile = await this.gameRepository.getUserProfile(
        userIdA,
      );
      winner = user.nickname;
      this.gamesService.createGameHistory(gameWatchId, {
        winnerId: userIdA,
        loserId: userIdB,
        winnerScore: this.gameRooms[gameWatchId].scoreA,
        loserScore: this.gameRooms[gameWatchId].scoreB,
      });
    }
    if (this.gameRooms[gameWatchId].scoreB === goalScore) {
      console.log('B winner:', goalScore);
      const user: UserProfile = await this.gameRepository.getUserProfile(
        userIdB,
      );
      winner = user.nickname;
      this.gamesService.createGameHistory(gameWatchId, {
        winnerId: userIdB,
        loserId: userIdA,
        winnerScore: this.gameRooms[gameWatchId].scoreB,
        loserScore: this.gameRooms[gameWatchId].scoreA,
      });
    }
    return winner;
  };
}
