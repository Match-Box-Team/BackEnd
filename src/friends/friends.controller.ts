import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Request,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { FriendsSetBanDto } from './dto/friends.dto';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get('')
  @UseGuards(AuthGuard)
  async getFriendList(@Request() req: ExpressRequest) {
    const userId: string = req['id']['id'];
    return this.friendsService.getFriendsList(userId);
  }

  @Get('/banned')
  @UseGuards(AuthGuard)
  async getBanFriendList(@Request() req: ExpressRequest) {
    const userId: string = req['id']['id'];
    return this.friendsService.getBanFriendList(userId);
  }

  @Patch('/:friendId/banned')
  @UseGuards(AuthGuard)
  async setBanFriend(
    @Param('friendId') friendId: string,
    @Body() dto: FriendsSetBanDto,
    @Request() req: ExpressRequest,
  ) {
    const userId: string = req['id']['id'];
    return this.friendsService.setBanFriend(userId, friendId, dto);
  }
}
