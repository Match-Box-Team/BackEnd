import { Injectable } from '@nestjs/common';
import { FriendsRepository } from './repository/friends.repository';
import { FriendsAddDto } from './dto/friends-add.request';

@Injectable()
export class FriendsService {
  constructor(private friendsRepository: FriendsRepository) {}

  async addFriend(userID: string, friendID: FriendsAddDto) {
    return await this.friendsRepository.addFrirend(userID, friendID);
  }
}
