import { ConflictException, Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor() {}

  //   async getAccessTokenUrl(code: string) {
  //     // const baseUrl = 'https://api.intra.42.fr/oauth/token?';
  //     const redirect_url = 'http://127.0.0.1:3000/auth/callback';
  //     const fullUrl = `https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=${process.env.OAUTH_CLIENT_ID}&client_secret=${process.env.OAUTH_CLIENT_SECRET}&code=${code}&redirect_uri=${redirect_url}`;
  //     // const fullUrl = `${baseUrl}?grant_type=authorization_code&client_id=${process.env.OAUTH_CLIENT_ID}&client_secret=${process.env.OAUTH_CLIENT_SECRET}&code=${code}&redirect_uri=${redirect_url}`;
  //     let res;
  //     try {
  //       res = await fetch(fullUrl);
  //     } catch (error) {
  //       throw new ConflictException(error, 'access token 발급 실패');
  //     }
  //     if (res.status >= 400) {
  //       throw new ConflictException('404 에러');
  //     }
  //     return res;
  //   }

  async getAccessTokenUrl(code: string) {
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
    try {
      res = await fetch(fullUrl, requestOptions);
      const tmp = await res.json();
      console.log(tmp);
    } catch (error) {
      throw new ConflictException(error, 'access token 발급 실패');
    }
    if (res.status >= 400) {
      throw new ConflictException('404 에러');
    }
    return res;
  }

  //https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}

  //   constructor(private jwtService: JwtService) {}
  //   async signIn(username: string, pass: string): Promise<any> {
  //     return {
  //       access_token: await this.jwtService.signAsync(payload),
  //     };
  // }
}
