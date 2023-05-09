import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import * as path from 'path';
import * as fs from 'fs-extra';

export const userImagePath = path.join(
  process.cwd(), // 프로젝트 루트 경로
  'assets/images/', // 파일 저장할 경로
);
export const defaultImagePath = path.join(
  process.cwd(), // 프로젝트 루트 경로
  'assets/default/default.jpg', // 파일 저장할 경로
);
if (!fs.existsSync(userImagePath)) {
  fs.mkdirSync(userImagePath, { recursive: true });
}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('verify')
  verify(): string {
    return '2차 인증 페이지';
  }

  @Get('verifyFail')
  verifyFail(): string {
    throw new NotFoundException('2차 인증 실패');
  }

  private createOauthUrl(): string {
    const clientId = process.env.OAUTH_APP_URL;
    const redirectUri = encodeURIComponent(
      'http://127.0.0.1:3000/auth/callback',
    );
    const responseType = 'code';

    return `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}`;
  }

  @Get('login')
  oauthLogin(): { url: string } {
    return { url: this.createOauthUrl() };
  }
}
