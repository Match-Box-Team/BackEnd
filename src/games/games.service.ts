import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Game, GameHistory, GameWatch, UserGame } from '@prisma/client';
import { Socket } from 'socket.io';
import { GamesRepository } from './repository/games.repository';
import { GameId, GameWatchesType, GameType } from './repository/game.type';
import { GameHistoryDto } from './dto/games.dto';

@Injectable()
export class GamesService {
  constructor(private repository: GamesRepository) {
    setInterval(() => this.processMatchmakingQueue(), 1000);
  }

  async getGame(gameId: string): Promise<Game> {
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Not found game');
    }
    return game;
  }

  async getGames(): Promise<Game[]> {
    const games = await this.repository.getGames();
    return games;
  }

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.repository.getUserGame(userId, gameId);
  }

  async getGamesByUserId(userId: string): Promise<GameType[]> {
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
    const game = await this.repository.getGame(gameId);
    if (game === null) {
      throw new NotFoundException('Not found game');
    }
    const userGame = await this.repository.getUserGame(userId, gameId);
    if (userGame) {
      throw new ConflictException('Already exist userGame');
    }

    const newUserGame = await this.repository.createUserGame(userId, gameId);
    return { gameId: newUserGame.gameId };
  }

  async getGameWatch(userId: string, gameWatchId: string): Promise<GameWatch> {
    const gameWatch = await this.repository.getGameWatchByUserIdAndGameWatchId(
      userId,
      gameWatchId,
    );
    return gameWatch;
  }

  async getGameWatchByGameWatchId(gameWatchId: string): Promise<GameWatch> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
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

  async createWatchGame(
    userGameId1: string,
    userGameId2: string,
  ): Promise<GameWatch> {
    const userGame1 = await this.repository.getUserGameByUserGameId(
      userGameId1,
    );
    const userGame2 = await this.repository.getUserGameByUserGameId(
      userGameId2,
    );
    if (!userGame1 || !userGame2) {
      throw new NotFoundException('userGame이 생성되지 않은 유저가 있습니다.');
    }
    const gameWatch = await this.repository.createGameWatch(
      userGameId1,
      userGameId2,
    );
    return gameWatch;
  }

  /*
   ** 소켓 관련
   */

  // 게임 매칭 큐
  // Map<gameId, [socket...]>
  private map = new Map<string, Socket[]>();

  // TODO: 유저 중복 처리 필요함!!!
  // 게임 매칭 큐에 추가
  addPlayerToQueue(player: Socket): void {
    // const userId = player.data.userId;
    const gameId = player.data.gameId;
    const players = this.map.get(gameId);
    if (players) {
      this.map.set(gameId, [...this.map.get(gameId), player]);
    } else {
      this.map.set(gameId, [player]);
    }
    // console.log(
    //   `User ${userId} added to ${
    //     player.data.gameName
    //   } matchmaking queue. Current queue length: ${
    //     this.map.get(gameId).length
    //   }`,
    // );
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
    // console.log(
    //   `User ${player.data.nickname} deleted to ${
    //     player.data.gameName
    //   } matchmaking queue. Current queue length: ${
    //     this.map.get(gameId).length
    //   }`,
    // );
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
        // console.log(
        //   `Matched ${player1.data.nickname} and ${player2.data.nickname} with room name ${gameWatch.gameWatchId}`,
        // );
        player1.emit('matchSuccess', { roomName: gameWatch.gameWatchId });
        player2.emit('matchSuccess', { roomName: gameWatch.gameWatchId });
        // 이부분에 추가로 user table status를 game으로 바꿔야 할 것 같음.
      }

      if (players.length === 1) {
        const player = players[0];
        setTimeout(() => {
          if (players.length === 1 && this.map.get(gameId)[0] === player) {
            player.emit('matchFail');
            this.removePlayerToQueue(player, player.data.userId);
            // console.log(
            //   `User ${player.data.nickname} removed from matchmaking queue due to timeout`,
            // );
          }
        }, 10000);
      }
    }
  }

  async createGameHistory(
    gameWatchId: string,
    gameHistoryDto: GameHistoryDto,
  ): Promise<GameHistory> {
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
      return gameHistory;
    } else {
      throw new BadRequestException('User matching is incorrect');
    }
    // 이부분에 각 유저의 status를 online으로 수정
  }
}
