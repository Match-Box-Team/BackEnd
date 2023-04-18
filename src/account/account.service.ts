import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/account.dto';
import { UserEmail } from './repository/account.type';

@Injectable()
export class AccountService {
  constructor(private repository: AccountRepository) {}

  async getUsers(): Promise<User[]> {
    const users = await this.repository.getUsers();
    if (users === null) {
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
