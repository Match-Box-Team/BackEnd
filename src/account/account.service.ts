import { Injectable } from '@nestjs/common';
import { User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/account.dto';
import { UserEmail } from './repository/account.type';

@Injectable()
export class AccountService {
  constructor(private repository: AccountRepository) {}

  async getUsers(): Promise<User[]> {
    return this.repository.getUsers();
  }

  async getUser(userId: string): Promise<User> {
    return this.repository.getUser(userId);
  }

  async getUserEmail(userId: string): Promise<UserEmail> {
    return this.repository.getUserEmail(userId);
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
