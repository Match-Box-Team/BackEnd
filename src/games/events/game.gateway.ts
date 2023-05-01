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
import { AccountService } from 'src/account/account.service';
import { GamesService } from '../games.service';
import { GameWatchId, UserId, randomMatchDto } from '../repository/game.type';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Game, User } from '@prisma/client';
import { OnModuleInit } from '@nestjs/common';
import { PingpongService } from '../gameplays/pingpong.service';
// cors 꼭꼭 해주기!
@UseGuards(AuthGuard)
@WebSocketGateway({ namespace: 'game', cors: true })
export class GameEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private accountService: AccountService,
    private gamesService: GamesService,
    private pingpongService: PingpongService,
  ) {}

  private logger = new Logger('GamesGateway');
  // private mapSize = { width: 325, height: 485 };
  private paddleAPosition = 100;
  private paddleBPosition = 100;

  @SubscribeMessage('ready')
  async gameReady(client: Socket, info: any) {
    console.log('connected');
    console.log(info);

    this.sendToClientMapSize(this.pingpongService.getMapSize());
  }

  sendToClientMapSize(mapSize: any) {
    this.server.emit('mapSize', mapSize);
  }

  @SubscribeMessage('gamecontrolB')
  async gameControlB(client: Socket, control: any) {
    console.log('gamecontrolB');
    console.log(control);
    this.paddleBPosition = this.pingpongService.updatePaddlePosition(
      this.paddleBPosition,
      control,
    );
    this.sendToClientControlB({ position: this.paddleBPosition });
  }

  sendToClientControlB(control: any) {
    this.server.emit('controlB', control);
  }

  @SubscribeMessage('gamecontrolA')
  async gameControlA(client: Socket, control: any) {
    console.log('gamecontrolA');
    console.log(control);
    // Calculate the new paddle position
    this.paddleAPosition = this.pingpongService.updatePaddlePosition(
      this.paddleAPosition,
      control,
    );
    this.sendToClientControlA({ position: this.paddleAPosition });
  }

  sendToClientControlA(control: any) {
    this.server.emit('controlA', control);
  }

  onModuleInit() {
    // 메서드 이름 변경
    setInterval(() => {
      // this.ballControl();
      // console.log(this.ball);
      this.sendToClientBall({
        ball: this.pingpongService.ballControl(
          this.paddleAPosition,
          this.paddleBPosition,
        ),
      });
    }, 1000 / 60); // 60FPS로 업데이트, 필요에 따라 조정 가능
  }

  sendToClientBall(control: any) {
    this.server.emit('ballcontrol', control);
  }

  // 초기화 이후에 실행
  afterInit() {
    this.logger.log('게임 채널 - 초기화 완료');
  }

  // 소켓이 연결되면 실행
  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} 게임 소켓 연결`);
  }

  // 소켓 연결이 끊기면 실행, user state offline으로 업데이트
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    // if (client.data.userId) {
    //   this.gamesService.removeUserToQueue(client, client.data.userId);
    // }
    this.logger.log(`${client.id} 게임 소켓 연결 해제`);
  }

  // 랜덤 게임 매칭
  @SubscribeMessage('randomMatch')
  async randomMatch(client: Socket, { gameId }: randomMatchDto) {
    const userId = client.data.user['id'];
    let user: User;
    let game: Game;

    try {
      user = await this.accountService.getUser(userId);
      game = await this.gamesService.getGame(gameId);
    } catch {
      client.emit('matchFail');
      return;
    }

    const userGame = await this.gamesService.getUserGame(userId, gameId);
    if (userGame === null) {
      client.emit('matchFail');
      return;
    }

    client.data.userId = userId;
    client.data.nickname = user.nickname;
    client.data.gameId = gameId;
    client.data.gameName = game.name;

    this.logger.log(
      `match start! --- game: ${game.name} --- name: ${user.nickname} --- id: ${userId}`,
    );
    this.gamesService.addPlayerToQueue(client);
  }

  @SubscribeMessage('gameFinish')
  async gameFinish(client: Socket, { gameWatchId }: GameWatchId) {
    this.logger.log('Game Finish');
    const userId = client.data.user['id'];
    const gameWatch = await this.gamesService.getGameWatch(userId, gameWatchId);

    if (gameWatch === null) {
      client.emit('matchFail');
      return;
    }
    this.gamesService.createGameHistory(gameWatch.gameWatchId, {
      winnerId: gameWatch.userGameId1,
      loserId: gameWatch.userGameId2,
      winnerScore: 11,
      loserScore: 1,
    });
  }

  // 게임 떠나기
  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(client: Socket) {
    const userId = client.data.user['id'];
    // 용도 물어보기
    client.emit('matchFail');
    this.gamesService.removePlayerToQueue(client, userId);
  }
}
