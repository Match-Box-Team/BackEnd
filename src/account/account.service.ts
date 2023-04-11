import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private prisma: PrismaService) {}

    async getUsers() : Promise<User[]> {
        return this.prisma.user.findMany();
    }

    async updateUser(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
      }): Promise<User> {
        const { data, where } = params;
        return this.prisma.user.update({
          data,
          where,
        });
    }

    async verifyCode(code: string) : Promise<void> {
        console.log(`code: ${code}`)
    }
}


