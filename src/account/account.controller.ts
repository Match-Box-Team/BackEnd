import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { User } from '@prisma/client';
import { VerifySuccessMsgDto } from './dto/verify-success-msg.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    return this.accountService.getUsers(); }

  // @Patch(':userId')
  // async updateUserProfile(
  //   @Param('userId') userId: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ) {
  //   return this.accountService.updateUserProfile(userId, updateUserDto);
  // }

  @Post('sendEmail')
  async sendEmail(): Promise<void> {
    const userId = 'd9a436fc-195f-41c6-b3fe-8300f4ad1fca';
    const email = 'rlawlsgh8113@naver.com';
    this.accountService.sendVerificationEmail(userId, email);
  }

  @Post('verifyCode')
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<VerifySuccessMsgDto> {

    const userId = 'd9a436fc-195f-41c6-b3fe-8300f4ad1fca';
    return this.accountService.verifyCode(userId, verifyCodeDto.code);
  }
}
