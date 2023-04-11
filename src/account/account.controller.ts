import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // @Get()
  // async getUser() : Promise<User[]> {
  //     return this.accountService.getUsers();
  // }

  // @Patch(':userId')
  // async updateUser(
  //   @Param('userId') userId: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ) {
  //   return this.accountService.updateUser({
  //     where: { userId: userId },
  //     data: {
  //         nickname: updateUserDto.nickname,
  //         image: updateUserDto.image,
  //     },
  //   })
  // }

  // @Post()
  // async verifyCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<void> {
  //     return this.accountService.verifyCode(verifyCodeDto.code);
  // }
}
