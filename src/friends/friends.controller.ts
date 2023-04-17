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

  @Get('/banned')
  @UseGuards(AuthGuard)
  async getBanFriendList(@Request() req: ExpressRequest) {
    return this.friendsService.getBanFriendList(req['id']['id']);
  }

  @Patch('/:buddyId/banned')
  @UseGuards(AuthGuard)
  async setBanFriend(
    @Param('buddyId') buddyId: string,
    @Body() dto: FriendsSetBanDto,
    @Request() req: ExpressRequest,
  ) {
    return this.friendsService.setBanFriend(req['id']['id'], buddyId, dto);
  }
}
