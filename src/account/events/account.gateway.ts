import {
  ConflictException,
  Logger,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
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
import { GamesService } from 'src/games/games.service';
import { Game, User, UserGame } from '@prisma/client';

@UseGuards(AuthGuard)
@WebSocketGateway({ cors: true })
export class AccountEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private accountService: AccountService,
    private gamesService: GamesService,
  ) {}

  @WebSocketServer()
  server: Server;

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
      };
    } catch {
      client.emit('error', {
        NotFoundException: 'Not found user',
      });
    }
  }

  private findSocketByUserId = (client: Socket, userId: string): Socket => {
    const clients = this.server.sockets.sockets;
    const matchedSocketArray = Array.from(clients.values()).filter(
      (user) => user.data.userInfo.userId === userId,
    );
    if (matchedSocketArray.length === 0) {
      client.emit('gameError', { message: '로그인한 유저가 이닙니다' });
    }
    return matchedSocketArray[0];
  };

  private updateUserState = async (client: Socket, state: string) => {
    client.data.userInfo.status = state;
    await this.accountService.updateUserState(
      client.data.userInfo.userId,
      state,
    );
  };

  // 게임 초대
  // clinet: 초대 보낸 유저, enemy: 초대 받은 유저
  @SubscribeMessage('inviteGame')
  async inviteGame(client: Socket, enemy: { userId: string }) {
    if (client.data.userInfo.userId === enemy.userId) {
      client.emit('gameError', {
        message: '자기 자신에게 게임을 신청했습니다',
      });
      return;
    }
    const matchedUserSocket: Socket = this.findSocketByUserId(
      client,
      enemy.userId,
    );
    const matchedUser: User = matchedUserSocket.data.userInfo;
    if (matchedUser.status === 'game') {
      client.emit('gameError', { message: '상대방이 게임 중입니다' });
      return;
    }
    console.log(matchedUser);
    const games: Game[] = await this.gamesService.getGames();
    const pong: Game = games.filter((game) => game.name === '핑퐁핑퐁')[0];
    const userPong: UserGame = await this.gamesService.getUserGame(
      matchedUser.userId,
      pong.gameId,
    );
    if (!userPong) {
      client.emit('gameError', { message: '게임을 구매한 유저가 이닙니다' });
      return;
    }
    // 유저 둘다
    await this.updateUserState(client, 'game');
    await this.updateUserState(matchedUserSocket, 'game');
    client.to(matchedUserSocket.id).emit('inviteGame', client.data.userInfo);
  }

  // 게임 초대 거부
  @SubscribeMessage('inviteReject')
  // clinet: 초대 받은 유저, enemy: 초대 보낸 유저
  async inviteReject(client: Socket, enemy: { userId: string }) {
    try {
      const matchedUserSocket: Socket = this.findSocketByUserId(
        client,
        enemy.userId,
      );
      console.log('게임 거부됨');
      // 유저 둘다
      await this.updateUserState(client, 'online');
      await this.updateUserState(matchedUserSocket, 'online');
      client.to(matchedUserSocket.id).emit('inviteReject');
    } catch (error) {
      // 초대 받은 유저
      await this.updateUserState(client, 'online');
      client.emit('gameError', {
        message: '초대 받은 유저가 매칭을 취소했습니다',
      });
    }
  }

  // 게임 초대 수락
  // clinet: 초대 받은 유저, enemy: 초대 보낸 유저
  @SubscribeMessage('inviteResolve')
  async inviteResolve(client: Socket, enemy: { userId: string }) {
    try {
      const matchedUserSocket: Socket = this.findSocketByUserId(
        client,
        enemy.userId,
      );
      console.log('게임 수락됨');
      client.to(matchedUserSocket.id).emit('inviteResolve');
    } catch (error) {
      // 초대 받은 유저
      await this.updateUserState(client, 'online');
      client.emit('gameError', { message: '상대방이 매칭을 취소했습니다' });
    }
  }

  // 게임 초대 취소
  @SubscribeMessage('inviteCancel')
  // clinet: 초대 보낸 유저, enemy: 초대 받은 유저
  async inviteCancel(client: Socket, enemy: { userId: string }) {
    try {
      const matchedUserSocket: Socket = this.findSocketByUserId(
        client,
        enemy.userId,
      );
      console.log('게임 초대 취소됨');
      // 유저 둘다
      await this.updateUserState(client, 'online');
      await this.updateUserState(matchedUserSocket, 'online');
      client.to(matchedUserSocket.id).emit('inviteCancel');
    } catch (error) {
      // 초대 보낸 유저
      await this.updateUserState(client, 'online');
      client.emit('gameError', { message: '상대방이 로그인 상태가 아닙니다' });
    }
  }
}
