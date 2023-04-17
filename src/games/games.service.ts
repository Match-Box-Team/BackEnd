import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Game, GameWatch } from '@prisma/client';
import { Socket } from 'socket.io';
import { GamesRepository } from './repository/games.repository';
import { GameId, GameWatchesType, GameType } from './repository/game.type';
import { GameHistoryDto } from './dto/games.dto';
import { AccountService } from 'src/account/account.service';

/**
 * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
 */

@Injectable()
export class GamesService {
  constructor(
    private accountService: AccountService,
    private repository: GamesRepository,
  ) {
    setInterval(() => this.processMatchmakingQueue(), 1000);
  }

  async getGame(gameId: string): Promise<Game> {
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Not found game');
    }
    return game;
  }

  async getGamesByUserId(userId: string): Promise<GameType[]> {
    const games = await this.repository.getGames();
    const userGameIds = await this.repository.getUserGameIdsByUserId(userId);
    if (userGameIds === null) {
      throw new NotFoundException('Not found userGameIds');
    }

    return games.map((game) => ({
      gameId: game.gameId,
      name: game.name,
      price: game.price,
      isPlayable: game.isPlayable,
      isBuy: userGameIds.some((userGame) => userGame.gameId === game.gameId),
    }));
  }

  async buyGame(userId: string, gameId: string): Promise<GameId> {
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Not found game');
    }
    const userGame = await this.repository.createUserGame(userId, gameId);
    if (userGame === null) {
      throw new NotFoundException('Not found userGame');
    }
    return { gameId: userGame.gameId };
  }

  async getGameWatch(gameWatchId: string): Promise<GameWatch> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
    if (gameWatch === null) {
      throw new NotFoundException('Not found gameWatch');
    }
    return gameWatch;
  }

  async getGameWatches(gameId: string): Promise<GameWatchesType> {
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Not found game');
    }

    const gameWatchesWithSameGameId =
      await this.repository.getGameWatchsWithSameGameId(gameId);

    const Matches = await Promise.all(
      gameWatchesWithSameGameId.map(async (gameWatch) => {
        const gameWatchId = gameWatch.gameWatchId;
        const currentViewer = gameWatch.currentViewer;
        const user1 = await this.repository.getUserProfile(
          gameWatch.userGameId1,
        );
        const user2 = await this.repository.getUserProfile(
          gameWatch.userGameId2,
        );
        return {
          gameWatchId: gameWatchId,
          currentViewer: currentViewer,
          user1: user1,
          user2: user2,
        };
      }),
    );

    return {
      gameId: gameId,
      gameName: game.name,
      matches: Matches,
    };
  }

  /*
   ** 소켓 관련
   */

  // 게임 매칭 큐
  // Map<gameId, [socket...]>
  private map = new Map<string, Socket[]>();

  // 게임 매칭 큐에 추가
  addPlayerToQueue(player: Socket): void {
    const userId = player.data.userId;
    const gameId = player.data.gameId;
    const players = this.map.get(gameId);
    if (players) {
      this.map.set(gameId, [...this.map.get(gameId), player]);
    } else {
      this.map.set(gameId, [player]);
    }
    console.log(
      `User ${userId} added to ${
        player.data.gameName
      } matchmaking queue. Current queue length: ${
        this.map.get(gameId).length
      }`,
    );
  }

  // 게임 매칭 큐에서 제거
  removePlayerToQueue(player: Socket, userId: string): void {
    const gameId = player.data.gameId;
    if (this.map.get(gameId) === undefined) {
      return;
    }

    const players = this.map.get(gameId);
    this.map.set(
      gameId,
      players.filter((player) => player.data.userId !== userId),
    );
    console.log(
      `User ${player.data.nickname} deleted to ${
        player.data.gameName
      } matchmaking queue. Current queue length: ${
        this.map.get(gameId).length
      }`,
    );
  }

  // 1초마다 유저 2명 이상 있으면 매칭 해줌
  async processMatchmakingQueue(): Promise<void> {
    for (const gameId of this.map.keys()) {
      const players = this.map.get(gameId);
      while (players && players.length >= 2) {
        const player1 = players.shift();
        const player2 = players.shift();
        const userGame1 = await this.repository.getUserGame(
          player1.data.userId,
          player1.data.gameId,
        );
        const userGame2 = await this.repository.getUserGame(
          player2.data.userId,
          player2.data.gameId,
        );
        const gameWatch = await this.repository.createGameWatch(
          userGame1.userGameId,
          userGame2.userGameId,
        );
        console.log(
          `Matched ${player1.data.nickname} and ${player2.data.nickname} with room name ${gameWatch.gameWatchId}`,
        );
        player1.emit('matchSuccess', { roomName: gameWatch.gameWatchId });
        player2.emit('matchSuccess', { roomName: gameWatch.gameWatchId });
      }

      if (players.length === 1) {
        const player = players[0];
        setTimeout(() => {
          if (players.length === 1 && this.map.get(gameId)[0] === player) {
            player.emit('matchFail');
            this.removePlayerToQueue(player, player.data.userId);
            console.log(
              `User ${player.data.nickname} removed from matchmaking queue due to timeout`,
            );
          }
        }, 10000);
      }
    }
  }

  async createGameHistory(
    gameWatchId: string,
    gameHistoryDto: GameHistoryDto,
  ): Promise<void> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
    if (gameWatch === null) {
      throw new NotFoundException('Not found gameWatch');
    }
    const deletedGameWatchth = await this.repository.deleteGameWatch(
      gameWatchId,
    );
    if (deletedGameWatchth === null) {
      throw new BadRequestException('Failed delete gameWatch');
    }

    const winnerId = gameHistoryDto.winnerId;
    const loserId = gameHistoryDto.loserId;
    if (
      (winnerId === gameWatch.userGameId1 &&
        loserId === gameWatch.userGameId2) ||
      (winnerId === gameWatch.userGameId2 && loserId === gameWatch.userGameId1)
    ) {
      const gameHistory = await this.repository.createGameHistory(
        gameHistoryDto,
      );
      if (gameHistory === null) {
        throw new BadRequestException('Failed create gameHistory');
      }
    } else {
      throw new BadRequestException('User matching is incorrect');
    }
  }
}
