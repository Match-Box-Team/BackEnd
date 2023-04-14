import { Injectable, NotFoundException } from '@nestjs/common';
import { Game, User } from '@prisma/client';
import { Socket } from 'socket.io';
import { GamesRepository } from './repository/games.repository';
import { GameIdType, GameWatchesType, GamesType } from './repository/game.type';
import { GameHistoryDto } from './dto/games.dto';
import { stringify } from 'querystring';

/**
 * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
 */

@Injectable()
export class GamesService {
  constructor(private repository: GamesRepository) {
    setInterval(() => this.processMatchmakingQueue(), 1000);
  }

  // 게임 매칭 큐
  private queue: { userId: string; socket: Socket }[] = [];

  // api들
  async get(): Promise<Game[]> {
    return this.repository.getGames();
  }

  async getGame(gameId: string): Promise<Game> {
    return this.repository.getGame(gameId);
  }

  async getGames(userId: string): Promise<GamesType[]> {
    const games = await this.repository.getGames();
    const userGameIds = await this.repository.getUserGameIdsByUserId(userId);

    return games.map((game) => ({
      gameId: game.gameId,
      name: game.name,
      price: game.price,
      isPlayable: game.isPlayable,
      isBuy: userGameIds.some((userGame) => userGame.gameId === game.gameId),
    }));
  }

  async buyGame(userId: string, gameId: string): Promise<GameIdType> {
    const userGame = await this.repository.createUserGame(userId, gameId);
    return { gameId: userGame.gameId };
  }

  async getGameWatches(gameId: string): Promise<GameWatchesType> {
    const game = await this.repository.getGame(gameId);
    // const gameWatches = await this.repository.getGameWatches();

    const gameWatchsWithSameGameId =
      await this.repository.getGameWatchsWithSameGameId(gameId);

    const Matches = await Promise.all(
      gameWatchsWithSameGameId.map(async (gameWatch) => {
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

  async createGameHistory(
    gameWatchId: string,
    gameHistoryDto: GameHistoryDto,
  ): Promise<void> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
    const winnerId = gameHistoryDto.winnerId;
    const loserId = gameHistoryDto.loserId;
    if (
      (winnerId === gameWatch.userGameId1 &&
        loserId === gameWatch.userGameId2) ||
      (winnerId === gameWatch.userGameId2 && loserId === gameWatch.userGameId1)
    ) {
      const gameHistory = await this.repository.createGameHistory(
        winnerId,
        loserId,
      );
    } else {
      throw new NotFoundException('User matching is incorrect');
    }
  }

  /*
   ** 소켓 관련
   */
  // 매칭 큐에서 추가
  addPlayerToQueue(socket: Socket, user: User, game: Game): void {
    if (game.isPlayable === false) {
      socket.emit('matchFail');
    }
    const userId = user.userId;
    const player = { userId, socket };
    this.queue.push(player);
    console.log(
      `User ${userId} added to matchmaking queue. Current queue length: ${this.queue.length}`,
    );
  }

  // 매칭 큐에서 제거
  removePlayerToQueue(socket: Socket, userId: string): void {
    this.queue = this.queue.filter((user) => user.userId !== userId);
    // delete this.queue[userId];
    console.log(
      `User ${userId} added to matchmaking queue. Current queue length: ${this.queue.length}`,
    );
  }

  // 1초마다 유저 2명 이상 있으면 매칭 해줌
  processMatchmakingQueue(): void {
    while (this.queue.length >= 2) {
      const user1 = this.queue.pop();
      const user2 = this.queue.pop();
      const roomName = `${user1.userId}-${user2.userId}`;

      console.log(
        `Matched ${user1.userId} and ${user2.userId} with room name ${roomName}`,
      );
      user1.socket.emit('matchSuccess', { roomName });
      user2.socket.emit('matchSuccess', { roomName });
    }

    if (this.queue.length === 1) {
      const user = this.queue[0];
      setTimeout(() => {
        if (this.queue.length === 1 && this.queue[0] === user) {
          user.socket.emit('matchFail');
          this.removePlayerToQueue(user.socket, user.userId);
          console.log(
            `User ${user.userId} removed from matchmaking queue due to timeout`,
          );
        }
      }, 5000);
    }
  }
}
