import { Injectable } from '@nestjs/common';
import { FriendsRepository } from './repository/friends.repository';
import { FriendsAddRequest } from './dto/request/friends-add.request';

@Injectable()
export class FriendsService {
    constructor(private friendsRepository: FriendsRepository) {}
    
    // 예시
    async addFriend(request: FriendsAddRequest) {
        // 로직 구현
        // friendsRepository에서 쿼리문 찾아서 사용
    }
}
