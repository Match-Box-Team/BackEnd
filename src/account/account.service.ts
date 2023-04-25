import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { MyPage, UserEmail } from './repository/account.type';
import { GamesService } from 'src/games/games.service';
import * as path from 'path';
import * as fs from 'fs-extra';
import { userImagePath } from 'src/app.controller';

@Injectable()
export class AccountService {
  constructor(
    private repository: AccountRepository,
    private gameService: GamesService,
  ) {}

  async getUsers(): Promise<User[]> {
    const users = await this.repository.getUsers();
    if (!users) {
      throw new NotFoundException('Not Found users');
    }
    return users;
  }

  async getUser(userId: string): Promise<User> {
    const user = await this.repository.getUser(userId);
    if (user === null) {
      throw new NotFoundException('Not Found user');
    }
    return user;
  }

  async getUserByIntraId(intraId: string): Promise<User> {
    const user = await this.repository.getUserByIntraId(intraId);
    if (user === null) {
      throw new NotFoundException('Not Found user');
    }
    return user;
  }

  async getUserEmail(userId: string): Promise<UserEmail> {
    const userEmail = await this.repository.getUserEmail(userId);
    if (userEmail === null) {
      throw new NotFoundException('Not Found user email');
    }
    return userEmail;
  }

  async getMyPage(userId: string): Promise<MyPage> {
    const userInfo = await this.repository.getUserInfo(userId);
    const games = await this.gameService.getGames();

    const userGameData = await Promise.all(
      games.map(async (game) => {
        const gameData = {
          gameId: game.gameId,
          name: game.name,
        };
        // 없으면 null이지만 에러 처리할 필요 없음
        const userGame = await this.gameService.getUserGame(
          userId,
          game.gameId,
        );
        let history;
        if (userGame === null) {
          history = null;
        } else {
          history = {
            wincounts: await this.repository.getUserGameWinCount(
              userGame.userGameId,
            ),
            loseCounts: await this.repository.getUserGameLoseCount(
              userGame.userGameId,
            ),
          };
        }
        return {
          game: gameData,
          gameHistory: history,
        };
      }),
    );
    return {
      user: userInfo,
      userGame: userGameData,
    };
  }

  async updateUserImagePath(userId: string, imagePath: string): Promise<User> {
    return await this.repository.updateUserImagePath(userId, imagePath);
  }

  async updateUserNickname(userId: string, nickname: string): Promise<User> {
    return await this.repository.updateUserProfile({
      where: { userId: userId },
      data: {
        nickname: nickname,
      },
    });
  }

  async updateUserImage(userId: string, oldFilePath: string): Promise<User> {
    const intraId = await this.repository.getUserIntraIdByUserId(userId);
    const newFilePath = path.join(userImagePath, `${intraId.intraId}.jpg`);
    fs.rename(oldFilePath, newFilePath);
    return await this.repository.updateUserProfile({
      where: { userId: userId },
      data: {
        image: newFilePath,
      },
    });
  }

  async updateUserState(userId: string, status: string): Promise<User> {
    return this.repository.updateUserState(userId, status);
  }

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.repository.getUserGame(userId, gameId);
  }

  async getUserByNickname(nickname: string) {
    return await this.repository.getUserByNickname(nickname);
  }

  async getUserImageByUserId(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    return user.image;
  }
}
