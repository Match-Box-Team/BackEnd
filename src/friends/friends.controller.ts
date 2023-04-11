import { Body, Controller, Post, Get, Delete, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsAddRequest } from './dto/request/friends-add.request';

@Controller('friends')
export class FriendsController {
    constructor(private friendsService: FriendsService) {}

    // 예시
    @Post('')
    @UsePipes(ValidationPipe)
    async addNewFriend(@Body() requestBody: FriendsAddRequest) {
        return this.friendsService.addFriend(requestBody);
    }
}
