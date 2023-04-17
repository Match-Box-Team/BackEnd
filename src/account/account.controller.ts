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

  @Post('sendEmail')
  async sendEmail(@Body() { userId }: UserId): Promise<void> {
    this.accountService.sendVerificationEmail(userId);
  }

  @Post('verifyTimeOut')
  async verifyTimeOut(@Body() { userId }: UserId) {
    this.accountService.verifyTimeOut(userId);
  }

  @Post('verifyCode')
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.accountService.verifyCode(
      verifyCodeDto.userId,
      verifyCodeDto.code,
    );
  }
}
