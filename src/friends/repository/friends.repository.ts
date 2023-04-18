import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Friend } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FriendsRepository {
  constructor(private prisma: PrismaService) {}

  async findBanFriendByMyId(userId: string): Promise<FriendsInfoData[]> {
    return await this.prisma.friend.findMany({
      where: {
        AND: [{ myId: userId }, { isBan: true }],
      },
      select: {
        friendId: true,
        buddyId: true,
        buddy: {
          select: {
            nickname: true,
            image: true,
            status: true,
          },
        },
      },
    });
  }

  async findFriendByFriendIdAndMyId(
    friendId: string,
    userId: string,
  ): Promise<Friend> {
    return await this.prisma.friend.findFirst({
      where: {
        AND: [{ friendId: friendId }, { myId: userId }],
      },
    });
  }

  async findFriendByBuddyId(userId: string, buddyId: string): Promise<Friend> {
    return await this.prisma.friend.findFirst({
      where: {
        AND: [{ myId: userId }, { buddyId: buddyId }],
      },
    });
  }

  /**
   * Create, Update, Delete
   */
  async updateFriendBan(friendId: string, isBan: boolean) {
    await this.prisma.friend.update({
      where: {
        friendId: friendId,
      },
      data: {
        isBan: isBan,
      },
    });
  }
}
