import { Injectable } from '@nestjs/common';
import { Game, User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AccountService {
  constructor(private repository: AccountRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */

  async getUsers(): Promise<User[]> {
    return this.repository.getUsers();
  }

  async getUser(userId: string): Promise<User> {
    return this.repository.getUser(userId);
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

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.repository.getUserGame(userId, gameId);
  }
}
