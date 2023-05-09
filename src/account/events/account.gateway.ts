import { Logger, UseGuards } from '@nestjs/common';
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
import { OnEvent } from '@nestjs/event-emitter';
import { GamesService } from 'src/games/games.service';
import { Game, GameWatch, User, UserGame } from '@prisma/client';

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
      this.logger.log(`login name: ${user.nickname} --- id: ${userId}`);
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

  // userId로 소켓 찾기
  private findSocketByUserId = (client: Socket, userId: string): Socket => {
    const clients = this.server.sockets.sockets;
    const matchedSocketArray = Array.from(clients.values()).filter(
      (user) => user.data.user['id'] === userId,
    );
    if (matchedSocketArray.length === 0) {
      return null;
    }
    return matchedSocketArray[0];
  };

  // userGameId로 소켓 찾기
  private findSocketByUserGameId = (userGameId: string): Socket => {
    const clients = this.server.sockets.sockets;
    const matchedSocketArray = Array.from(clients.values()).filter(
      (user) => user.data.userInfo.userGameId === userGameId,
    );
    return matchedSocketArray[0];
  };

  // userId로 소켓 찾기 -> 위에 있는 함수랑 차이는 null반환을 안함
  private findSocketByUserIdForRandomMatch = (userId: string): Socket => {
    const clients = this.server.sockets.sockets;
    const matchedSocketArray = Array.from(clients.values()).filter(
      (user) => user.data && user.data.user && user.data.user['id'] === userId,
    );
    return matchedSocketArray[0];
  };

  // 유저 상태 업데이트(DB, Socket)
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
      client.emit('inviteFail', '자기 자신에게 게임을 신청했습니다');
      return;
    }
    const matchedUserSocket: Socket = this.findSocketByUserId(
      client,
      enemy.userId,
    );
    if (!matchedUserSocket) {
      client.emit('inviteFail', '상대방이 오프라인 상태입니다');
      return;
    }
    const matchedUser: User = matchedUserSocket.data.userInfo;
    if (matchedUser.status === 'game') {
      client.emit('inviteFail', '상대방이 게임 중입니다');
      return;
    }
    const games: Game[] = await this.gamesService.getGames();
    const pong: Game = games.filter((game) => game.name === '핑퐁핑퐁')[0];
    const userPong: UserGame = await this.gamesService.getUserGame(
      client.data.user['id'],
      pong.gameId,
    );
    const enemyPong: UserGame = await this.gamesService.getUserGame(
      matchedUser.userId,
      pong.gameId,
    );
    if (!userPong || !enemyPong) {
      client.emit('inviteFail', '게임을 구매하지 않은 유저가 있습니다');
      return;
    }
    client.data.userInfo.userGameId = userPong.userGameId;
    matchedUserSocket.data.userInfo.userGameId = enemyPong.userGameId;
    await this.updateUserState(client, 'game');
    await this.updateUserState(matchedUserSocket, 'game');
    client.emit('inviteSuccess');
    client.to(matchedUserSocket.id).emit('inviteGame', client.data.userInfo);
  }

  // 게임 초대 거부
  // clinet: 초대 받은 유저, enemy: 초대 보낸 유저
  @SubscribeMessage('inviteReject')
  async inviteReject(client: Socket, enemy: { userId: string }) {
    const matchedUserSocket: Socket = this.findSocketByUserId(
      client,
      enemy.userId,
    );
    if (!matchedUserSocket) {
      client.emit('inviteRejectFail', '상대방이 오프라인 상태입니다');
      await this.updateUserState(client, 'online');
      return;
    }
    await this.updateUserState(client, 'online');
    await this.updateUserState(matchedUserSocket, 'online');
    client.to(matchedUserSocket.id).emit('inviteReject');
  }

  // 게임 초대 수락
  // clinet: 초대 받은 유저, enemy: 초대 보낸 유저
  @SubscribeMessage('inviteResolve')
  async inviteResolve(client: Socket, enemy: { userId: string }) {
    const matchedUserSocket: Socket = this.findSocketByUserId(
      client,
      enemy.userId,
    );
    if (!matchedUserSocket) {
      client.emit('inviteResolveFail', '상대방이 오프라인 상태입니다');
      await this.updateUserState(client, 'online');
      return;
    }
    const gameWatch: GameWatch = await this.gamesService.createWatchGame(
      matchedUserSocket.data.userInfo.userGameId,
      client.data.userInfo.userGameId,
    );
    if (!gameWatch) {
      client.emit('inviteResolveFail', 'gameWatch 생성을 실패했습니다');
      await this.updateUserState(client, 'online');
      await this.updateUserState(matchedUserSocket, 'online');
    }
    client.emit('goGameReadyPage', { gameWatchId: gameWatch.gameWatchId });
    client
      .to(matchedUserSocket.id)
      .emit('goGameReadyPage', { gameWatchId: gameWatch.gameWatchId });
  }

  // 게임 초대 취소
  // clinet: 초대 보낸 유저, enemy: 초대 받은 유저
  @SubscribeMessage('inviteCancel')
  async inviteCancel(client: Socket, enemy: { userId: string }) {
    const matchedUserSocket: Socket = this.findSocketByUserId(
      client,
      enemy.userId,
    );
    if (!matchedUserSocket) {
      client.emit('inviteCancelFail', '상대방이 오프라인 상태입니다');
      await this.updateUserState(client, 'online');
      return;
    }
    await this.updateUserState(client, 'online');
    await this.updateUserState(matchedUserSocket, 'online');
    client.emit('inviteCancelSuccess');
    client.to(matchedUserSocket.id).emit('inviteCancel');
  }

  // Game Gateway로 부터 유저 상태 업데이트 이벤트 감지
  @OnEvent('cancelGame')
  cancelGame(gameWatch: GameWatch) {
    const userSocket1 = this.findSocketByUserGameId(gameWatch.userGameId1);
    const userSocket2 = this.findSocketByUserGameId(gameWatch.userGameId2);
    if (userSocket1) {
      this.updateUserState(userSocket1, 'online');
    }
    if (userSocket2) {
      this.updateUserState(userSocket2, 'online');
    }
  }

  // Game Gateway로 부터 유저 상태 업데이트 이벤트 감지
  @OnEvent('updateUserStateOnline')
  updateUserStateOnline(userGameId: string) {
    const userSocket = this.findSocketByUserGameId(userGameId);
    if (userSocket) {
      this.updateUserState(userSocket, 'online');
    }
  }

  // 랜덤 매칭이 성공되었을 때 감지되는 이벤트
  @OnEvent('randomMatchSuccess')
  async cancelRandomMatch(gameWatch: GameWatch) {
    const userId1 = await this.gamesService.getUserByUserGameId(
      gameWatch.userGameId1,
    );
    const userId2 = await this.gamesService.getUserByUserGameId(
      gameWatch.userGameId2,
    );
    const userSocket1 = this.findSocketByUserIdForRandomMatch(userId1);
    const userSocket2 = this.findSocketByUserIdForRandomMatch(userId2);
    if (userSocket1 && userSocket1.data && userSocket1.data.userInfo) {
      userSocket1.data.userInfo.userGameId = gameWatch.userGameId1;
      this.updateUserState(userSocket1, 'game');
    }
    if (userSocket2 && userSocket2.data && userSocket2.data.userInfo) {
      userSocket2.data.userInfo.userGameId = gameWatch.userGameId2;
      this.updateUserState(userSocket2, 'game');
    }
  }
}
