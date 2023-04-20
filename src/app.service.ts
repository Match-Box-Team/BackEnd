import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  oauthLogin(): string {
    //return `<div><a href="https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-092559f7d07776b4823725b73cee081449fe7fa955f2d6f99d01a95879349c04&redirect_uri=https%3A%2F%2F127.0.0.1%3A3000%2Fcallback&response_type=code" /></div>`;
    return 'hello';
  }
}
