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

@WebSocketGateway()
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
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    this.accountService.updateUserState(userId, 'offline');
    this.logger.log(`${client.id} 소켓 연결 해제`);
  }

  // 로그인 시 user state online으로 업데이트
  @SubscribeMessage('login')
  login(client: Socket, { userId }: LoginMessage) {
    client.data.userId = userId;
    this.accountService.updateUserState(userId, 'online');
  }
}
