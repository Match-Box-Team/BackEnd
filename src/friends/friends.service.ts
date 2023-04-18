import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendsRepository } from './repository/friends.repository';
import { FriendsAddDto, FriendsSetBanDto } from './dto/friends.dto';
import { Friend } from '@prisma/client';

@Injectable()
export class FriendsService {
  constructor(private friendsRepository: FriendsRepository) {}

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
