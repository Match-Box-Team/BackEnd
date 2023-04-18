import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OAuthUserInfoDto } from './dto';
import { AuthRepository } from './repository/auth.repository';
import { JwtUtil } from './jwt/jwt.util';
import { PrismaService } from 'prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtUtil: JwtUtil,
    private prisma: PrismaService,
    private accountServce: AccountService,
    private mailService: MailerService,
  ) {}

  // map<userId, accessToken>
  private authInfoMap = new Map<string, OAuthUserInfoDto>();

  public getAuthInfo(userId: string): OAuthUserInfoDto {
    const authInfo = this.authInfoMap.get(userId);
    if (!authInfo) {
      throw new NotFoundException('Not found access info');
    }
    return authInfo;
  }

  public addAuthInfo(userId: string, authInfo: OAuthUserInfoDto): void {
    this.authInfoMap.set(userId, authInfo);
  }

  public deleteAuthInfo(userId: string): void {
    this.authInfoMap.delete(userId);
  }

  async getAccessTokenUrl(code: string): Promise<string> {
    const redirect_url = 'http://127.0.0.1:3000/auth/callback';
    const fullUrl = `https://api.intra.42.fr/oauth/token`;

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=authorization_code&client_id=${process.env.OAUTH_CLIENT_ID}&client_secret=${process.env.OAUTH_CLIENT_SECRET}&code=${code}&redirect_uri=${redirect_url}`,
    };

    let res;
    let obj;
    try {
      res = await fetch(fullUrl, requestOptions);
      obj = await res.json();
    } catch (error) {
      throw new ConflictException(error, 'access token 발급 실패');
    }
    if (res.status >= 400) {
      throw new ConflictException('404 에러');
    }
    return obj.access_token;
  }

  async getUserInfo(token: string): Promise<OAuthUserInfoDto> {
    const apiUrl = 'https://api.intra.42.fr/v2/me';
    const requestOptions = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    let res;
    try {
      res = await fetch(apiUrl, requestOptions);
    } catch (error) {
      throw new ConflictException(
        error,
        'User Profile 정보를 얻어올 수 없습니다',
      );
    }

    if (res.status !== 200) {
      throw new ConflictException('User Profile 정보를 얻어올 수 없습니다');
    }

    let info;
    try {
      info = await res.json();
    } catch (error) {
      throw new ConflictException('User Profile 정보가 json 양식이 아닙니다');
    }

    const profile: OAuthUserInfoDto = {
      email: info.email,
      image: info.image.link,
      intraId: info.login,
      nickName: info.login,
      phoneNumber: info.phone !== 'hidden' ? info.phone : null,
    };

    return profile;
  }

  async saveUserInfo(profile: OAuthUserInfoDto): Promise<void> {
    try {
      await this.authRepository.createOrUpdateUser(profile);
    } catch (error) {
      throw new ConflictException('유저 로그인 에러');
    }
  }

  async generateJwt(user: OAuthUserInfoDto): Promise<string> {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email: user.email,
      },
      select: {
        userId: true,
      },
    });

    const payload = {
      id: foundUser.userId,
    };

    const resJWT = this.jwtUtil.encode(payload);
    return resJWT;
  }

  /*
   ** 이메일 인증
   */

  // Map<email, code>
  private emailMap = new Map<string, string>();

  async sendVerificationEmail(userId: string): Promise<void> {
    const userEmail = await this.accountServce.getUserEmail(userId);
    if (userEmail === null) {
      throw new NotFoundException('Not found user email');
    }
    const code = Math.random().toString(36).substring(2, 15);

    await this.mailService.sendMail({
      to: userEmail.email,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        code,
      },
    });
    this.emailMap.set(userId, code);
  }

  verifyTimeOut(userId: string): void {
    this.emailMap.delete(userId);
  }

  verifyCode(userId: string, inputCode: string): boolean {
    const storedCode = this.emailMap.get(userId);
    if (!storedCode) {
      throw new NotFoundException('User not has code');
    }
    if (inputCode === storedCode) {
      this.emailMap.delete(userId);
      return true;
    } else {
      return false;
    }
  }
}
