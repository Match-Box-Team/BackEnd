import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Game, GameHistory, GameWatch, User, UserGame } from '@prisma/client';
import { Socket } from 'socket.io';
import { GamesRepository } from './repository/games.repository';
import { GameId, GameWatchesType, GameType } from './repository/game.type';
import { GameHistoryDto } from './dto/games.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GamesService {
  constructor(
    private repository: GamesRepository,
    private eventEmitter: EventEmitter2,
  ) {
    setInterval(() => this.processMatchmakingQueue(), 3000);
  }

  async initGames() {
    const games = [
      {
        name: '핑퐁핑퐁',
        price: 5000,
        isPlayable: true,
      },
      {
        name: '테트리스',
        price: 7000,
        isPlayable: false,
      },
      {
        name: '퍼즐팡팡',
        price: 6000,
        isPlayable: false,
      },
      {
        name: '좀비좀비',
        price: 8000,
        isPlayable: false,
      },
    ];
    const checkGames = await this.repository.getGames();
    if (checkGames.length === 0) {
      await this.repository.addGames(games);
    }
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
    const checkGameWatch1 = await this.repository.getGameWatchByUserGameId(
      userGameId1,
    );
    const checkGameWatch2 = await this.repository.getGameWatchByUserGameId(
      userGameId2,
    );
    if (checkGameWatch1 || checkGameWatch2) {
      if (checkGameWatch1) {
        await this.repository.deleteGameWatch(checkGameWatch1.gameWatchId);
      }
      if (checkGameWatch2) {
        await this.repository.deleteGameWatch(checkGameWatch2.gameWatchId);
      }
      return null;
    }
    const gameWatch = await this.repository.createGameWatch(
      userGameId1,
      userGameId2,
    );
    return gameWatch;
  }

  async deleteGameWatch(gameWatchId: string): Promise<GameWatch> {
    const gameWatch = await this.repository.getGameWatchById(gameWatchId);
    if (!gameWatch) {
      throw new NotFoundException('gameWatch가 존재하지 않습니다.');
    }
    const deletedGameWatch = await this.repository.deleteGameWatch(gameWatchId);
    return deletedGameWatch;
  }

  async getUserByUserGameId(userGameId: string): Promise<string> {
    const userId = await this.repository.getUserIdByUserGameId(userGameId);
    return userId.userId;
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
    const userId = player.data.userId;
    const gameId = player.data.gameId;
    const players = this.map.get(gameId);
    if (players) {
      players.map((socket) => {
        if (socket.data.userId === userId) {
          player.emit('randomMatchError', '이미 큐에 존재하는 유저입니다');
        }
        this.removePlayerToQueue(player, player.data.user['id']);
        return;
      });
    }
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
        if (player1.data.user['id'] === player2.data.user['id']) {
          player1.emit('randomMatchError', '랜덤 매칭 실패');
        }
        const userGame1 = await this.repository.getUserGame(
          player1.data.userId,
          player1.data.gameId,
        );
        const userGame2 = await this.repository.getUserGame(
          player2.data.userId,
          player2.data.gameId,
        );
        // const gameWatch: GameWatch = await this.repository.createGameWatch(
        const gameWatch: GameWatch = await this.createWatchGame(
          userGame1.userGameId,
          userGame2.userGameId,
        );
        // 이미 게임워치가 생성되어 있는 유저가 있는 경우
        if (!gameWatch) {
          player1.emit('randomMatchError', '매칭 에러');
          player2.emit('randomMatchError', '매칭 에러');
          return;
        }
        player1.data.userInfo = { userGameId: userGame1.userGameId };
        player2.data.userInfo = { userGameId: userGame2.userGameId };
        console.log(
          `Matched ${player1.data.nickname} and ${player2.data.nickname} with room name ${gameWatch.gameWatchId}`,
        );
        player1.emit('randomMatchSuccess', {
          gameWatchId: gameWatch.gameWatchId,
        });
        player2.emit('randomMatchSuccess', {
          gameWatchId: gameWatch.gameWatchId,
        });
        // 유저 status를 업데이트
        this.eventEmitter.emit('randomMatchSuccess', gameWatch);
      }

      if (players.length === 1) {
        const player = players[0];
        setTimeout(() => {
          if (players.length === 1 && this.map.get(gameId)[0] === player) {
            player.emit('randomMatchError', '랜덤 매칭 실패');
            this.removePlayerToQueue(player, player.data.userId);
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
    const deletedGameWatch = await this.repository.deleteGameWatch(gameWatchId);
    if (deletedGameWatch === null) {
      throw new BadRequestException('Failed delete gameWatch');
    }

    const winnerId = gameHistoryDto.winnerId;
    const loserId = gameHistoryDto.loserId;
    console.log('winnerId: ', winnerId);
    console.log('loserId: ', loserId);
    console.log('gameWatch:', gameWatch);
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
