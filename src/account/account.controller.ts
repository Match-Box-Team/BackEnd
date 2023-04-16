import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { stringify } from 'querystring';

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
    const email = 'rlawlsgh8113@naver.com';
    this.accountService.sendVerificationEmail(email);
  }

  // @Post()
  // async verifyCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<void> {
  //     return this.accountService.verifyCode(verifyCodeDto.code);
  // }
}
