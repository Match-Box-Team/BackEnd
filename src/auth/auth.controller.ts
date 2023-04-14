// import { Controller, Get, Query, Header, Redirect } from '@nestjs/common';
// import { AuthService } from './auth.service';

// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   @Get('callback')
//   @Redirect('', 302)
//   @Header('Content-Type', 'application/json')
//   async signIn(@Query('code') code: string): Promise<any> {
//     const accessToken = await this.authService.getAccessTokenUrl(code);
//     const info = await this.authService.getUserInfo(accessToken);
//     await this.authService.saveUserInfo(info);

//     const jwt = await this.authService.generateJwt(info);
//     const cookieHeader = `jwt=${jwt}; HttpOnly; Path=/`; // 쿠키 헤더 생성

//     console.log(jwt);
//     console.log('----');
//     console.log(cookieHeader);

//     return { url: 'http://127.0.0.1:3000/' };
//   }
// }

import { Controller, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express'; // Express 응답 객체를 가져옵니다.

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('callback')
  async signIn(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const accessToken = await this.authService.getAccessTokenUrl(code);
    const info = await this.authService.getUserInfo(accessToken);
    await this.authService.saveUserInfo(info);

    const jwt = await this.authService.generateJwt(info);
    const cookieHeader = `token=${jwt}; HttpOnly; Path=/`; // 쿠키 헤더 생성

    console.log(jwt);
    res.setHeader('Set-Cookie', cookieHeader); // 헤더에 쿠키 설정
    res.redirect(301, 'http://127.0.0.1:3000/'); // 리다이렉트
  }
}
