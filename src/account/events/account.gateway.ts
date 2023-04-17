import { Logger } from '@nestjs/common';
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

interface LoginMessage {
  userId: string;
}

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
    const users = await this.accountService.getUsers();
    const userId = client.data.userId ? client.data.userId : users[0].userId;
    this.logger.log(`${client.id} 소켓 연결 해제`);
    await this.accountService.updateUserState(userId, 'offline');
  }

  // 로그인 시 user state online으로 업데이트
  @SubscribeMessage('login')
  async login(client: Socket, { userId }: LoginMessage) {
    const user = await this.accountService.getUser(userId);
    console.log(`login name: ${user.nickname} --- id: ${userId}`);
    client.data.userId = userId;
    await this.accountService.updateUserState(userId, 'online');
  }
}
