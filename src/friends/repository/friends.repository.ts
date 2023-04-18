import { ConflictException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Friend } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FriendsAddDto } from '../dto/friends.dto';

@Injectable()
export class FriendsRepository {
  constructor(private prisma: PrismaService) {}

  async addFrirend(userID: string, friendID: FriendsAddDto) {
    try {
      // 먼저 myId와 buddyId를 기준으로 기존 친구 관계를 찾는다
      const existingFriend = await this.prisma.friend.findFirst({
        where: {
          AND: [{ myId: userID }, { buddyId: friendID.userId }],
        },
      });

      // 기존 친구 관계가 없으면 새로운 친구 관계를 생성한다
      if (existingFriend === null) {
        await this.prisma.friend.create({
          data: {
            myId: userID,
            buddyId: friendID.userId,
            isBan: false,
          },
        });
      }
    } catch (error) {
      throw new ConflictException('친구 추가 실패');
    }
  }

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

  async findFriendsByMyId(userId: string): Promise<FriendsInfoData[]> {
    return await this.prisma.friend.findMany({
      where: {
        AND: [{ myId: userId }, { isBan: false }],
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
}
