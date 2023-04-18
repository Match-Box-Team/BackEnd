import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendsRepository } from './repository/friends.repository';
import { FriendsSetBanDto } from './dto/friends.dto';
import { Friend } from '@prisma/client';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class FriendsService {
  constructor(
    private friendsRepository: FriendsRepository,
    private accountServce: AccountService,
  ) {}

  async getBanFriendList(userId: string) {
    const banFriend = await this.friendsRepository.findBanFriendByMyId(userId);
    return { friend: banFriend };
  }

  async setBanFriend(userId: string, friendId: string, dto: FriendsSetBanDto) {
    const friend = await this.validateMyFriend(userId, friendId);
    if (friend.isBan === dto.isBan) {
      throw new ConflictException(
        'Your friend is already ' + (dto.isBan ? 'banned' : 'unbanned'),
      );
    }
    await this.friendsRepository.updateFriendBan(friend.friendId, dto.isBan);
  }

  async searchFriendForAdd(userId: string, nickname: string) {
    const buddy = await this.accountServce.getUserByNickname(nickname);
    if (buddy === null) {
      throw new NotFoundException('not existed user');
    }
    if (buddy.userId === userId) {
      throw new NotFoundException('Input nickname is my nickname');
    }
    const isFriend = await this.friendsRepository.findFriendByBuddyId(
      userId,
      buddy.userId,
    );
    return {
      userId: buddy.userId,
      nickname: buddy.nickname,
      image: buddy.image,
      isFriend: isFriend === null ? false : true,
    };
  }

  private async validateMyFriend(
    userId: string,
    friendId: string,
  ): Promise<Friend> {
    const friend = await this.friendsRepository.findFriendByFriendIdAndMyId(
      friendId,
      userId,
    );
    if (friend === null) {
      throw new NotFoundException('Not my buddy');
    }
    return friend;
  }
}
