import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FriendsService } from './friends.service';
import { FriendsAddDto } from './dto/friends-add.request';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('')
  @UseGuards(AuthGuard)
  @UsePipes(ValidationPipe)
  async addNewFriend(
    @Request() requset: ExpressRequest,
    @Body() friendID: FriendsAddDto,
  ) {
    return this.friendsService.addFriend(requset['id']['id'], friendID);
  }
}
