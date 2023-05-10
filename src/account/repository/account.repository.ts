import { Injectable } from '@nestjs/common';
import { Prisma, User, UserGame } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { IntraId, UserEmail, UserInfo } from './account.type';

@Injectable()
export class AccountRepository {
  constructor(private prisma: PrismaService) {}

  // 쿼리 작성
  async getUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async getUser(userId: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });
  }

  async getUserByIntraId(intraId: string): Promise<User> {
    return await this.prisma.user.findFirst({
      where: {
        intraId,
      },
    });
  }

  async getUserEmail(userId: string): Promise<UserEmail> {
    return await this.prisma.user.findUnique({
      where: {
        userId,
      },
      select: {
        email: true,
      },
    });
  }

  async getUserIntraIdByUserId(userId: string): Promise<IntraId> {
    return await this.prisma.user.findUnique({
      where: {
        userId,
      },
      select: {
        intraId: true,
      },
    });
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    return await this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
      select: {
        userId: true,
        nickname: true,
        intraId: true,
        image: true,
        phoneNumber: true,
        email: true,
      },
    });
  }

  async getUserGameWinCount(userGameId: string): Promise<number> {
    return await this.prisma.gameHistory.count({
      where: {
        winnerUserGameId: userGameId,
      },
    });
  }

  async getUserGameLoseCount(userGameId: string): Promise<number> {
    return await this.prisma.gameHistory.count({
      where: {
        loserUserGameId: userGameId,
      },
    });
  }

  async updateUserImagePath(userId: string, imagePath: string): Promise<User> {
    return await this.prisma.user.update({
      where: {
        userId,
      },
      data: {
        image: imagePath,
      },
    });
  }

  async updateUserProfile(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { data, where } = params;
    return await this.prisma.user.update({
      data,
      where,
    });
  }

  async updateUserState(userId: string, status: string): Promise<User> {
    const where = { userId: userId };
    const data = {
      status: status,
    };
    return await this.prisma.user.update({
      data,
      where,
    });
  }

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return await this.prisma.userGame.findFirst({
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
