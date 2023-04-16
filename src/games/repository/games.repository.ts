import { Injectable, NotFoundException } from '@nestjs/common';
import { Game, GameHistory, GameWatch, UserGame } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { GameHistoryDto } from '../dto/games.dto';
import { GameId, UserId, UserProfile } from './game.type';

@Injectable()
export class GamesRepository {
  constructor(private prisma: PrismaService) {}

  async getGame(gameId: string): Promise<Game> {
    return this.prisma.game.findUnique({
      where: {
        gameId: gameId,
      },
    });
  }

  async getGames(): Promise<Game[]> {
    return this.prisma.game.findMany();
  }

  // 왜?? -> undefined는 where절에서 무시하는 것 같음
  async getUserGameIdsByUserId(userId: string): Promise<GameId[]> {
    if (userId == undefined) {
      throw new NotFoundException('userId is undefined');
    }
    return this.prisma.userGame.findMany({
      where: { userId: userId },
      select: { gameId: true },
    });
  }

  async createUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.prisma.userGame.create({
      data: {
        userId: userId,
        gameId: gameId,
      },
    });
  }

  async getGameWatchById(gameWatchId: string): Promise<GameWatch> {
    return this.prisma.gameWatch.findFirst({
      where: { gameWatchId },
    });
  }

  async getGameWatches(): Promise<GameWatch[]> {
    return this.prisma.gameWatch.findMany();
  }

  async getUserIdByUserGameId(userGameId: string): Promise<UserId> {
    return this.prisma.userGame.findUnique({
      where: { userGameId: userGameId },
      select: { userId: true },
    });
  }

  async getGameIdByUserGameId(userGameId: string): Promise<GameId> {
    return this.prisma.userGame.findUnique({
      where: { userGameId: userGameId },
      select: { gameId: true },
    });
  }

  async getGameWatchsWithSameGameId(gameId: string): Promise<GameWatch[]> {
    return this.prisma.gameWatch.findMany({
      where: {
        OR: [
          { userGame1: { game: { gameId: gameId } } },
          { userGame2: { game: { gameId: gameId } } },
        ],
      },
    });
  }

  async getUserProfile(userGameId: string): Promise<UserProfile> {
    const userId = await this.getUserIdByUserGameId(userGameId);
    return await this.prisma.user.findUnique({
      where: {
        userId: userId.userId,
      },
      select: {
        userId: true,
        nickname: true,
        image: true,
      },
    });
  }

  async createGameHistory({
    winnerId,
    loserId,
    winnerScore,
    loserScore,
  }: GameHistoryDto): Promise<GameHistory> {
    return this.prisma.gameHistory.create({
      data: {
        winnerUserGameId: winnerId,
        loserUserGameId: loserId,
        winnerScore: winnerScore,
        loserScore: loserScore,
      },
    });
  }

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.prisma.userGame.findFirstOrThrow({
      where: {
        userId: userId,
        gameId: gameId,
      },
    });
  }

  async createGameWatch(
    userGameId1: string,
    userGameId2: string,
  ): Promise<GameWatch> {
    return this.prisma.gameWatch.create({
      data: {
        currentViewer: 0,
        userGameId1: userGameId1,
        userGameId2: userGameId2,
      },
    });
  }

  async deleteGameWath(gameWatchId: string): Promise<GameWatch> {
    return this.prisma.gameWatch.delete({
      where: {
        gameWatchId,
      },
    });
  }
}
