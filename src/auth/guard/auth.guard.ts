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

interface JwtAuth {
  request: Socket | Request;
  token: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const data: JwtAuth = {
        request: request,
        token: this.extractToken(request.headers.authorization),
      };
      return await this.authenticateToken(data);
    } else if (context.getType() === 'ws') {
      const client: Socket = context.switchToWs().getClient();
      const data: JwtAuth = {
        request: client,
        token: this.extractToken(client.handshake.headers.authorization),
      };
      return await this.authenticateToken(data);
    }
    return true;
  }

  private extractToken(authorization: string): string | undefined {
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async authenticateToken(data: JwtAuth): Promise<boolean> {
    if (!data.token) {
      return this.errorType(data);
    }
    try {
      const payload = await this.jwtService.verifyAsync(data.token, {
        secret: process.env.JWT_SECRET,
      });
      if (data.request instanceof Socket) {
        data.request.data.user = payload;
      } else {
        data.request['id'] = payload;
      }
    } catch {
      return this.errorType(data);
    }
    return true;
  }

  private errorType(data: JwtAuth): boolean {
    if (data.request instanceof Socket) {
      data.request.emit('error', {
        UnauthorizedException: '사용자 인증을 실패했습니다.',
      });
    } else {
      throw new UnauthorizedException();
    }
    return false;
  }
}
