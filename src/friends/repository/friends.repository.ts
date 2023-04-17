import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FriendsAddDto } from '../dto/friends-add.request';

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
      if (existingFriend === undefined) {
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
}
