import { Injectable, NotFoundException } from '@nestjs/common';
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

  // api들
  async get(): Promise<Game[]> {
    return this.repository.getGames();
  }

  async getGame(gameId: string): Promise<Game> {
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  async getGamesByUserId(userId: string): Promise<GameType[]> {
    const user = await this.accountService.getUser(userId);
    if (user === null) {
      throw new NotFoundException('User not found');
    }
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

  async buyGame(userId: string, gameId: string): Promise<GameId> {
    const user = await this.accountService.getUser(userId);
    const game = await this.repository.getGame(gameId);
    if (user === null || game === null) {
      throw new NotFoundException('User or Game not found');
    }
    const userGame = await this.repository.createUserGame(userId, gameId);
    return { gameId: userGame.gameId };
  }

  async getGameWatch(gameWatchId: string): Promise<GameWatch> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
    if (gameWatch === null) {
      throw new NotFoundException('GameWatch not found');
    }
    return gameWatch;
  }

  async getGameWatches(gameId: string): Promise<GameWatchesType> {
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Game not found');
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

  async createGameHistory(
    gameWatchId: string,
    gameHistoryDto: GameHistoryDto,
  ): Promise<void> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
    if (gameWatch === null) {
      throw new NotFoundException('GameWatch not found');
    }
    const checkGameWatchthis = await this.repository.deleteGameWath(gameWatchId);

    const winnerId = gameHistoryDto.winnerId;
    const loserId = gameHistoryDto.loserId;
    if (
      (winnerId === gameWatch.userGameId1 &&
        loserId === gameWatch.userGameId2) ||
      (winnerId === gameWatch.userGameId2 && loserId === gameWatch.userGameId1)
    ) {
      const gameHistory = await this.repository.createGameHistory(gameHistoryDto);
    } else {
      throw new NotFoundException('User matching is incorrect');
    }
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
  removePlayerToQueue(player: Socket): void {
    const gameId = player.data.gameId;
    const players = this.map.get(gameId);
    this.map.set(
      gameId,
      players.filter((socket) => socket.data.userId !== player.data.userId),
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
      while (players.length >= 2) {
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
            this.removePlayerToQueue(player);
            console.log(
              `User ${player.data.nickname} removed from matchmaking queue due to timeout`,
            );
          }
        }, 5000);
      }
    }
  }
}
