import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
// import { jwtConstants } from './constants';
import { Request } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const token = this.extractToken(request.headers.authorization);

      if (!token) {
        throw new UnauthorizedException();
      }
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        request['id'] = payload;
      } catch {
        throw new UnauthorizedException();
      }
    } else if (context.getType() === 'ws') {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client.handshake.headers.authorization);

      if (!token) {
        client.emit('error', {
          UnauthorizedException: 'Unauthorized access when socket connection',
        });
        return false;
      }
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        client.data.user = payload;
      } catch (error) {
        client.emit('error', {
          UnauthorizedException: 'Unauthorized access when socket connection',
        });
        return false;
      }
    }
    return true;
  }

  private extractToken(authorization: string): string | undefined {
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
