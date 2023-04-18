import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateUserDto } from './dto/account.dto';
import { MyPage } from './repository/account.type';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Request } from 'express';
import { User } from '@prisma/client';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getMyPage(@Req() req: Request): Promise<MyPage> {
    const userId = req['id']['id'];
    return await this.accountService.getMyPage(userId);
  }

  @Patch()
  @UseGuards(AuthGuard)
  async updateUserProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const userId = req['id']['id'];
    return await this.accountService.updateUserProfile(userId, updateUserDto);
  }
}
