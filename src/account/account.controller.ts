import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { User } from '@prisma/client';
import { UserId, VerifyCodeDto } from './dto/account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    return this.accountService.getUsers();
  }

  // @Patch(':userId')
  // async updateUserProfile(
  //   @Param('userId') userId: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ) {
  //   return this.accountService.updateUserProfile(userId, updateUserDto);
  // }
}
