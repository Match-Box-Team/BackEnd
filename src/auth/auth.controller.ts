/* 프론트 개발 후 return으로 프론트에 넘겨주는 코드로 변경시 사용할 코드입니다 */
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

import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express'; // Express 응답 객체를 가져옵니다.
import { UserId, VerifyCodeDto } from './dto/auth.dto';
import { AccountService } from 'src/account/account.service';
import * as path from 'path';
import { userImagePath } from 'src/app.controller';
import { OAuthUserInfoDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private accountService: AccountService,
  ) {}

  @Get('callback')
  async signIn(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const accessToken = await this.authService.getAccessTokenUrl(code);
    const info = await this.authService.getUserInfo(accessToken);
    await this.authService.saveUserInfo(info);

    // 2차 인증 때 JWT 토큰 생성을 위해서 유저 정보를 Map에 저장
    const user = await this.accountService.getUserByIntraId(info.intraId);
    this.authService.addAuthInfo(user.userId, info);

    const fileName = `${info.intraId}.jpg`; // 파일 이름
    const filePath = path.join(userImagePath, fileName);

    // 로그인할 때마다 다시 인트라 이미지로 프로필이 수정되는 것을 막음
    if (user.image !== filePath) {
      // 42 auth로 가져온 유저 이미지
      const imageUrlFromAccessToken = info.image;
      await this.authService.downloadAndSaveImage(
        imageUrlFromAccessToken,
        filePath,
      );
      await this.accountService.updateUserImagePath(user.userId, filePath);
    }

    // 아래는 1차 인증만 있을 때의 코드
    // 매번 메일 인증하기는 번거로우니 일단 사용
    // 나중에 지우기
    // const jwt = await this.authService.generateJwt(info);
    // const cookieHeader = `token=${jwt}; HttpOnly; Path=/`;
    // res.setHeader('Set-Cookie', cookieHeader);
    // res.redirect(301, 'http://127.0.0.1:4000/auth');

    // 아래는 access token을 쿠키에 넣는 방식
    // cookie에 userId 넣어준 후
    res.cookie('token', user.userId);
    // const cookieHeader = `token=${user.userId}; HttpOnly; Path=/`;
    // res.setHeader('Set-Cookie', cookieHeader);
    // // 인트라 이메일로 인증 코드 전송
    this.authService.sendVerificationEmail(user.userId);
    // // 프론트 2차 메일 인증 페이지로 리다이렉트 해줘야함
    // res.redirect(301, 'http://127.0.0.1:3000/verify');
    res.redirect(301, `${process.env.FRONT_URL}/auth`);
  }

  @Post('sendEmail')
  async sendEmail(@Body() { userId }: UserId): Promise<void> {
    await this.authService.sendVerificationEmail(userId);
  }

  @Post('verifyTimeOut')
  async verifyTimeOut(@Body() { userId }: UserId): Promise<void> {
    await this.authService.verifyTimeOut(userId);
  }

  @Post('verifyCode')
  async verifyCode(
    @Body() verifyCodeDto: VerifyCodeDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = verifyCodeDto.userId;
    const isVerify = this.authService.verifyCode(userId, verifyCodeDto.code);
    // 인증 실패 시 다시 2차 인증 페이지로 리다이랙트 해줘야 함
    // 프론트할 때 수정 필요
    if (isVerify === false) {
      res.redirect(301, `${process.env.BACKEND_URL}/verifyFail`);
    } else {
      const authInfo = this.authService.getAuthInfo(userId);
      const jwt = await this.authService.generateJwt(authInfo);
      // const cookieHeader = `token=${jwt}; HttpOnly; Path=/`; // 쿠키 헤더 생성
      // 성공 시 jwt토큰 cookie에 담아서 리다이랙트 시켜줌
      // res.setHeader('Set-Cookie', cookieHeader);
      // res.redirect(301, 'http://127.0.0.1:3000/');
      res.status(200).json({
        redirectUrl: `${process.env.FRONT_URL}/chat/channel`,
        token: jwt,
      });
    }
  }

  // 가짜 유저 로그인
  @Get('fakeLogin1')
  async fakeLogin1(@Res() res: Response): Promise<void> {
    const fakeUser: OAuthUserInfoDto = {
      email: 'fake1@naver.com',
      image: '',
      intraId: 'fake1',
      phoneNumber: '',
    };
    await this.authService.saveUserInfo(fakeUser);
    const user = await this.accountService.getUserByIntraId('fake1');
    const jwt = await this.authService.generateJwt(fakeUser);
    res.status(200).json({
      redirectUrl: `${process.env.FRONT_URL}/chat/channel`,
      token: jwt,
      userId: user.userId,
      nickname: user.nickname,
      imageUrl: user.image,
    });
  }
  @Get('fakeLogin2')
  async fakeLogin2(@Res() res: Response): Promise<void> {
    const fakeUser: OAuthUserInfoDto = {
      email: 'fake2@naver.com',
      image: '',
      intraId: 'fake2',
      phoneNumber: '',
    };
    await this.authService.saveUserInfo(fakeUser);
    const user = await this.accountService.getUserByIntraId('fake2');
    const jwt = await this.authService.generateJwt(fakeUser);
    res.status(200).json({
      redirectUrl: `${process.env.FRONT_URL}/chat/channel`,
      token: jwt,
      userId: user.userId,
      nickname: user.nickname,
      image: user.image,
    });
  }
  @Get('fakeLogin3')
  async fakeLogin3(@Res() res: Response): Promise<void> {
    const fakeUser: OAuthUserInfoDto = {
      email: 'fake3@naver.com',
      image: '',
      intraId: 'fake3',
      phoneNumber: '',
    };
    await this.authService.saveUserInfo(fakeUser);
    const user = await this.accountService.getUserByIntraId('fake3');
    const jwt = await this.authService.generateJwt(fakeUser);
    res.status(200).json({
      redirectUrl: `${process.env.FRONT_URL}/chat/channel`,
      token: jwt,
      userId: user.userId,
      nickname: user.nickname,
      imageUrl: user.image,
    });
  }
  @Get('fakeLogin4')
  async fakeLogin4(@Res() res: Response): Promise<void> {
    const fakeUser: OAuthUserInfoDto = {
      email: 'fake4@naver.com',
      image: '',
      intraId: 'fake4',
      phoneNumber: '',
    };
    await this.authService.saveUserInfo(fakeUser);
    const user = await this.accountService.getUserByIntraId('fake4');
    const jwt = await this.authService.generateJwt(fakeUser);
    res.status(200).json({
      redirectUrl: `${process.env.FRONT_URL}/chat/channel`,
      token: jwt,
      userId: user.userId,
      nickname: user.nickname,
      imageUrl: user.image,
    });
  }
}
