import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Request,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FriendsService } from './friends.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { FriendsAddDto, FriendsSetBanDto } from './dto/friends.dto';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('')
  @UseGuards(AuthGuard)
  async addNewFriend(
    @Request() requset: ExpressRequest,
    @Body() friendID: FriendsAddDto,
  ) {
    return this.friendsService.addFriend(requset['id']['id'], friendID);
  }

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
    @Param('friendId', ParseUUIDPipe) friendId: string,
    @Body() dto: FriendsSetBanDto,
    @Request() req: ExpressRequest,
  ) {
    const userId: string = req['id']['id'];
    return this.friendsService.setBanFriend(userId, friendId, dto);
  }

  @Get('/search')
  @UseGuards(AuthGuard)
  async searchFriendForAdd(
    @Query('nickname') nickname: string,
    @Request() req: ExpressRequest,
  ) {
    const userId: string = req['id']['id'];
    return this.friendsService.searchFriendForAdd(userId, nickname);
  }

  @Get(':friendId/history')
  @UseGuards(AuthGuard)
  async getGameHistoryOfFriend(
    @Param('friendId') frinedId: string,
    @Query('game') gameName: string,
  ) {
    return await this.friendsService.searchGameHistoyOfFriend(
      frinedId,
      gameName,
    );
  }

  @Get('/:buddyId')
  @UseGuards(AuthGuard)
  async getFriendDetails(
    @Param('buddyId', ParseUUIDPipe) buddyId: string,
    @Request() req: ExpressRequest,
  ) {
    const reqId: string = req['id']['id'];
    return this.friendsService.getFriendDetails(reqId, buddyId);
  }
}
