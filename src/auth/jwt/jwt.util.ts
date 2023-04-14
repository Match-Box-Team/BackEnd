import { Injectable } from '@nestjs/common';
import * as jwt from 'jwt-simple';

@Injectable()
export class JwtUtil {
  private secret = process.env.JWT_SECRET;

  encode(payload: any): string {
    return jwt.encode(payload, this.secret);
  }

  decode(token: string): any {
    try {
      return jwt.decode(token, this.secret);
    } catch (error) {
      return null;
    }
  }
}
