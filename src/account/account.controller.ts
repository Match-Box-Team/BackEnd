import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateUserDto, UserId } from './dto/account.dto';
import { MyPage } from './repository/account.type';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { userImagePath } from 'src/app.controller';
import { Response } from 'express';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getMyPage(@Req() req: Request): Promise<MyPage> {
    const userId = req['id']['id'];
    return await this.accountService.getMyPage(userId);
  }

  @Patch('nickname')
  @UseGuards(AuthGuard)
  async updateNickname(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req['id']['id'];
    return await this.accountService.updateUserNickname(
      userId,
      updateUserDto.nickname,
    );
  }

  @Get('image')
  @UseGuards(AuthGuard)
  async getUserImageByUserId(
    @Res() res: Response,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    const imagePath = await this.accountService.getUserImageByUserId(userId);
    res.set('Content-Type', 'image/jpeg');
    res.sendFile(imagePath);
  }

  @Get('default')
  @UseGuards(AuthGuard)
  async getDefaultImage(@Res() res: Response) {
    const imagePath = await this.accountService.getDefaultImage();
    res.set('Content-Type', 'image/jpeg');
    res.sendFile(imagePath);
  }

  @Patch('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: userImagePath,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const filename = `${randomName}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  )
  @UseGuards(AuthGuard)
  async uploadImage(@Req() req: Request, @UploadedFile() file) {
    const userId = req['id']['id'];
    return await this.accountService.updateUserImage(userId, file.path);
  }

  @Post('/info')
  async getUserInfo(@Body() dto: UserId) {
    return await this.accountService.getUser(dto.userId);
  }
}
