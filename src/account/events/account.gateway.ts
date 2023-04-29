import { ConflictException, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccountService } from '../account.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { User } from '@prisma/client';

@UseGuards(AuthGuard)
@WebSocketGateway({ cors: true })
export class AccountEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private accountService: AccountService) {}

  private logger = new Logger('AccountGateway');

  // 초기화 이후에 실행
  afterInit() {
    this.logger.log('채널 - 초기화 완료');
  }

  // 소켓이 연결되면 실행
  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} 소켓 연결`);
  }

  // 소켓 연결이 끊기면 실행, user state offline으로 업데이트
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} 소켓 연결 해제`);
    const user = client.data.user;
    if (user === undefined) {
      return;
    }
    const userId = user['id'];
    await this.accountService.updateUserState(userId, 'offline');
  }

  // 로그인 시 user state online으로 업데이트
  @SubscribeMessage('login')
  async login(client: Socket) {
    try {
      const userId = client.data.user['id'];
      const user = await this.accountService.getUser(userId);
      console.log(`login name: ${user.nickname} --- id: ${userId}`);
      await this.accountService.updateUserState(userId, 'online');
      client.data.userInfo = {
        ...user,
        status: 'online',
      }
    } catch {
      client.emit('error', {
        NotFoundException: 'Not found user',
      });
    }
  }

  // 게임 초대
  @SubscribeMessage('game')
  async game(client: Socket, enemy: { userId: string }) {
    if (client.data.userInfo.userId === enemy.userId) {
      // 아래 3줄 나중에 지워야함
      const user: User = client.data.userInfo;
      client.emit('game', user);
      return;
      // throw new ConflictException("자기 자신에게 게임을 신청했습니다")
    }
    const clients = this.server.sockets.sockets;
    const matchedUser = Array.from(clients.values())
      .filter(user => user.data.userInfo.userId === enemy.userId);
    if (!matchedUser) {
      throw new NotFoundException("상대가 로그인 상태가 아닙니다");
    }
    console.log("상대 발견!\n 상대 소켓 id:", matchedUser[0].id);
    client.to(matchedUser[0].id).emit('game', client.data.userInfo);
  }
}
