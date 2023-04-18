import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/account.dto';
import { MyPage, UserEmail } from './repository/account.type';
import { GamesService } from 'src/games/games.service';

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

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.repository.updateUserProfile({
      where: { userId: userId },
      data: {
        nickname: updateUserDto.nickname,
        image: updateUserDto.image,
      },
    });
  }

  async updateUserState(userId: string, status: string): Promise<User> {
    return this.repository.updateUserState(userId, status);
  }
}
