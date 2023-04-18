import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UserEmail, UserInfo } from './account.type';

@Injectable()
export class AccountRepository {
  constructor(private prisma: PrismaService) {}

  // 쿼리 작성
  async getUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getUser(userId: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });
  }

  async getUserByIntraId(intraId: string): Promise<User> {
    return this.prisma.user.findFirst({
      where: {
        intraId,
      },
    });
  }

  async getUserEmail(userId: string): Promise<UserEmail> {
    return this.prisma.user.findUnique({
      where: {
        userId,
      },
      select: {
        email: true,
      },
    });
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    return this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
      select: {
        nickname: true,
        intraId: true,
        image: true,
        phoneNumber: true,
        email: true,
      },
    });
  }

  async getUserGameWinCount(userGameId: string): Promise<number> {
    return this.prisma.gameHistory.count({
      where: {
        winnerUserGameId: userGameId,
      },
    });
  }

  async getUserGameLoseCount(userGameId: string): Promise<number> {
    return this.prisma.gameHistory.count({
      where: {
        loserUserGameId: userGameId,
      },
    });
  }

  async updateUserProfile(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { data, where } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async updateUserState(userId: string, status: string): Promise<User> {
    const where = { userId: userId };
    const data = {
      status: status,
    };
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.prisma.userGame.findFirst({
      where: {
        userId: userId,
        gameId: gameId,
      },
    });
  }

  async getUserByNickname(nickname: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        nickname: nickname,
      },
    });
  }
}
