import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Get,
  Patch,
  Request,
  Param,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FriendsService } from './friends.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { FriendsAddDto, FriendsSetBanDto } from './dto/friends.dto';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('')
  @UsePipes(ValidationPipe)
  async addNewFriend(
    @Request() requset: ExpressRequest,
    @Body() friendID: FriendsAddDto,
  ) {
    return this.friendsService.addFriend(requset['id']['id'], friendID);
  }

  @Get('/banned')
  async getBanFriendList(@Request() req: ExpressRequest) {
    const userId: string = req['id']['id'];
    return this.friendsService.getBanFriendList(userId);
  }

  @Patch('/:friendId/banned')
  async setBanFriend(
    @Param('friendId') friendId: string,
    @Body() dto: FriendsSetBanDto,
    @Request() req: ExpressRequest,
  ) {
    const userId: string = req['id']['id'];
    return this.friendsService.setBanFriend(userId, friendId, dto);
  }
}
