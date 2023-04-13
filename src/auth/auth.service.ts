import { ConflictException, Injectable } from '@nestjs/common';
import { OAuthUserInfoDto } from './dto';
import { AuthRepository } from './repository/auth.repository';
@Injectable()
export class AuthService {
  constructor(private authRepository: AuthRepository) {}

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
      // console.log(obj);
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
}
