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
    const accessToken = await this.authService.getAccessTokenUrl(code);
    const info = await this.authService.getUserInfo(accessToken);
    await this.authService.saveUserInfo(info);
    return `${JSON.stringify(info)}`;
  }
}
