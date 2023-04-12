import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Redirect,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('callback')
  async signIn(@Query('code') code: string): Promise<any> {
    // console.log(code);
    const accessToken = await this.authService.getAccessTokenUrl(code);
    // console.log(res);

    const info = await this.authService.getUserInfo(accessToken);
    // console.log(userInfo);
    // return `${userInfo}`;
    return `${JSON.stringify(info)}`;
  }
}
