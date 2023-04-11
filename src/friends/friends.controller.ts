import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsAddDto } from './dto/friends-add.request';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  // 예시
  @Post('')
  @UsePipes(ValidationPipe)
  async addNewFriend(@Body() dto: FriendsAddDto) {
    return this.friendsService.addFriend(dto);
  }
}
