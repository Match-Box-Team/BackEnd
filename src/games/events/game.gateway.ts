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
  ) {}

  private logger = new Logger('GamesGateway');
  private mapSize = { width: 300, height: 475 };
  private paddleAPosition = 100;
  private paddleBPosition = 100;
  private paddleInfo = {
    width: 100,
    height: 10,
    paddleAX: 100,
    paddleBX: 100,
    paddleAY: 30,
    paddleBY: 445,
    speed: 4,
  };
  private ball = {
    x: 150,
    y: 75,
    radius: 6,
    velocityX: 5,
    velocityY: 5,
    color: 'white',
  };

  @SubscribeMessage('ready')
  async gameReady(client: Socket, info: any) {
    console.log('connected');
    console.log(info);
    if (this.mapSize.width === 0 || this.mapSize.width === undefined) {
      this.mapSize.width = info.width;
      this.mapSize.height = info.height;
    } else {
      console.log('init : ', this.mapSize);
    }
  }

  @SubscribeMessage('gamecontrolB')
  async gameControlB(client: Socket, control: any) {
    console.log('gamecontrolB');
    console.log(control);
    // Calculate the new paddle position
    this.paddleBPosition += 4 * control.direction;

    if (this.paddleBPosition < 0) {
      this.paddleBPosition = 0;
    }
    if (this.paddleBPosition + this.paddleInfo.width >= 325) {
      this.paddleBPosition = this.mapSize.width + 25 - this.paddleInfo.width;
    }
    this.sendToClientControlB({ position: this.paddleBPosition });
  }
  sendToClientControlB(control: any) {
    this.server.emit('gamecontrolB', control);
  }

  @SubscribeMessage('gamecontrolA')
  async gameControlA(client: Socket, control: any) {
    console.log('gamecontrolA');
    console.log(control);
    // Calculate the new paddle position
    this.paddleAPosition += 4 * control.direction;
    if (this.paddleAPosition < 0) {
      this.paddleAPosition = 0;
    }
    if (this.paddleAPosition + this.paddleInfo.width >= 325) {
      this.paddleAPosition = this.mapSize.width + 25 - this.paddleInfo.width;
    }
    console.log(this.paddleAPosition);
    this.sendToClientControlA({ position: this.paddleAPosition });
  }

  sendToClientControlA(control: any) {
    this.server.emit('gamecontrolA', control);
  }

  // @SubscribeMessage('ballcontrol')
  // async ballControl(client: Socket, data: any) {
  //   console.log('ballcontrol');
  //   console.log(data);
  //   // Calculate the new paddle position
  //   this.ball.x += this.ball.velocityX;
  //   this.ball.y += this.ball.velocityY;

  //   if (
  //     this.ball.x + this.ball.radius > this.mapSize.width ||
  //     this.ball.x - this.ball.radius < 0
  //   ) {
  //     this.ball.velocityX = -this.ball.velocityX;
  //   }

  //   if (
  //     this.ball.y + this.ball.radius > this.mapSize.height ||
  //     this.ball.y - this.ball.radius < 0
  //   ) {
  //     this.ball.velocityY = -this.ball.velocityY;
  //   }

  //   this.sendToClientBall({ ball: this.ball });
  // }

  // sendToClientBall(control: any) {
  //   this.server.emit('ballcontrol', control);
  // }

  async ballControl() {
    // Calculate the new ball position
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    if (
      this.ball.x + this.ball.radius / 2 > this.mapSize.width + 25 ||
      this.ball.x - this.ball.radius / 2 < 0
    ) {
      this.ball.velocityX = -this.ball.velocityX;
    }

    if (
      this.ball.y + this.ball.radius / 2 > this.mapSize.height ||
      this.ball.y - this.ball.radius / 2 < 0
    ) {
      this.ball.velocityY = -this.ball.velocityY;
    }

    if (
      (this.ball.y - this.ball.radius / 2 <
        this.paddleInfo.paddleAY + this.paddleInfo.height &&
        this.ball.y + this.ball.radius / 2 > this.paddleInfo.paddleAY &&
        this.ball.x - this.ball.radius / 2 <
          this.paddleAPosition + this.paddleInfo.width &&
        this.ball.x + this.ball.radius / 2 > this.paddleAPosition) ||
      (this.ball.y - this.ball.radius / 2 <
        this.paddleInfo.paddleBY + this.paddleInfo.height &&
        this.ball.y + this.ball.radius / 2 > this.paddleInfo.paddleBY &&
        this.ball.x - this.ball.radius / 2 <
          this.paddleBPosition + this.paddleInfo.width &&
        this.ball.x + this.ball.radius / 2 > this.paddleBPosition)
    ) {
      this.ball.velocityY = -this.ball.velocityY;
    }
  }

  onModuleInit() {
    // 메서드 이름 변경
    setInterval(() => {
      this.ballControl();
      // console.log(this.ball);
      this.sendToClientBall({ ball: this.ball });
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
