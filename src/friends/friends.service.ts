import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendsRepository } from './repository/friends.repository';
import { FriendsAddDto, FriendsSetBanDto } from './dto/friends.dto';
import { Friend, Game, UserGame } from '@prisma/client';
import { AccountService } from 'src/account/account.service';
import { GamesRepository } from 'src/games/repository/games.repository';

@Injectable()
export class FriendsService {
  constructor(
    private friendsRepository: FriendsRepository,
    private accountServce: AccountService,
    private gameRepository: GamesRepository,
  ) {}

  async addFriend(userID: string, friendID: FriendsAddDto) {
    if (userID === friendID.userId) {
      throw new BadRequestException('자기자신을 친구로 추가할 수 없습니다');
    }

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

  async searchGameHistoyOfFriend(frinedId: string, gameName: string) {
    //게임 이름으로 게임 아이디를 찾아낸다
    let gameInfo: Game;
    try {
      gameInfo = await this.gameRepository.getGameByName(gameName);
    } catch (error) {
      throw new NotFoundException('해당하는 게임이 없습니다');
    }

    //게임 아이디와 친구 아이디로 친구가 해당 게임을 가지고 있는 지 확인한다
    let userGameInfo: UserGame;
    try {
      userGameInfo = await this.gameRepository.getUserGame(
        frinedId,
        gameInfo.gameId,
      );
    } catch (error) {
      throw new NotFoundException(
        '해당하는 친구가 게임을 가지고 있지 않습니다',
      );
    }

    //유저 게임 히스토리에서 해당하는 친구의 전적을 모두 가져온다
  }
}
