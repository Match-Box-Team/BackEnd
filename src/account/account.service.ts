import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AccountRepository } from './repository/account.repository';

@Injectable()
export class AccountService {
  constructor(private repository: AccountRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */

  // async getUsers(): Promise<any> {
  //   return this.repository.findMany();
  // }

  // async updateUser(params: {
  //     where: Prisma.UserWhereUniqueInput;
  //     data: Prisma.UserUpdateInput;
  //   }): Promise<User> {
  //     const { data, where } = params;
  //     return this.prisma.user.update({
  //       data,
  //       where,
  //     });
  // }

  async verifyCode(code: string): Promise<void> {
    console.log(`code: ${code}`);
  }
}
