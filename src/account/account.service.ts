import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AccountService {
  constructor(private repository: AccountRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */

  async getUsers(): Promise<any> {
    return this.repository.getUsers();
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
