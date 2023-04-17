import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtUtil {
  private secret = process.env.JWT_SECRET;
  private jwtOptions = {
    expiresIn: '24h',
  };

  encode(payload: any): string {
    return jwt.sign(payload, this.secret, this.jwtOptions);
  }

  decode(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }
}
