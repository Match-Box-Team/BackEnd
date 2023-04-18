import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendsRepository } from './repository/friends.repository';
import { FriendsAddDto, FriendsSetBanDto } from './dto/friends.dto';
import { Friend } from '@prisma/client';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class FriendsService {
  constructor(
    private friendsRepository: FriendsRepository,
    private accountServce: AccountService,
  ) {}

  async addFriend(userID: string, friendID: FriendsAddDto) {
    return await this.friendsRepository.addFrirend(userID, friendID);
  }

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
    const friends = await this.friendsRepository.findFriendByFriendIdAndMyId(
      friendId,
      userId,
    );
    if (friends === null) {
      throw new NotFoundException('no friends');
    }
    return friends;
  }

  // GET /friends
  async getFriendsList(userId: string) {
    const friendsList = await this.friendsRepository.findFriendsByMyId(userId);
    return { friends: friendsList };
  }
}
