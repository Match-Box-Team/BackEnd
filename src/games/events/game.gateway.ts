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
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Game, GameWatch, User, UserGame } from '@prisma/client';
import { PingpongService } from '../gameplays/pingpong.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomMatchDto } from '../repository/game.type';

interface UserGameInfo {
  userId: string;
  gameId: string;
  userGameId: string;
  enemyUserId: string;
  enemyUserGameId: string;
  role: string;
}

// cors 꼭꼭 해주기!
@UseGuards(AuthGuard)
@WebSocketGateway({ namespace: 'game', cors: true })
export class GameEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private accountService: AccountService,
    private gamesService: GamesService,
    private pingpongService: PingpongService,
    private eventEmitter: EventEmitter2,
  ) {}

  @WebSocketServer()
  server: Server;

  private logger = new Logger('GamesGateway');

  private sockets = new Map<string, Socket>();
  private userGameIdA = '';
  private userGameIdB = '';
  private gameWatchId = '';
  // private gameWatchIds = new Map<string, string>;
  private gameWatchIds = [];

  @SubscribeMessage('ready')
  async gameReady(client: Socket, info: any) {
    console.log('connected');
    console.log(info);
    console.log(client.data.gameWatch);
    this.gameWatchId = client.data.gameWatch.gameWatchId;
    this.gameWatchIds.push(client.data.gameWatch.gameWatchId);

    this.pingpongService.InitGameInfo(this.gameWatchId);
    this.pingpongService.setScoresZeros(this.gameWatchId);

    // console.log('gamewatch: ', client.data.gameWatch);
    // console.log('info : ', client.data.userGameInfo);
    // console.log('role : ', client.data.role);
    // console.log('gameWatchId : ', client.data.gameWatch.gameWatchId);
    client.join(this.gameWatchId);
    let isHost: boolean;
    let isWatcher: boolean;

    if (client.data.role === 'host') {
      isHost = true;
      isWatcher = false;
      this.userGameIdB = client.data.userGame.userGameId;
    } else if (client.data.role === 'guest') {
      isHost = false;
      isWatcher = false;
      this.userGameIdA = client.data.userGame.userGameId;
    } else {
      isHost = false;
      isWatcher = true;
      console.log("I'm watcher");
    }

    this.sendToClientIsHost(client.id, {
      isHost: isHost,
      isWatcher: isWatcher,
    });
    this.sendToClientMapSize(this.pingpongService.getMapSize(this.gameWatchId));
  }

  private sendToClientIsHost(socketId: any, data: any) {
    // this.server.to(this.gameWatchId).emit('ishost', data);
    this.server.to(socketId).emit('ishost', data);
  }

  private sendToClientMapSize(mapSize: any) {
    this.server.to(this.gameWatchId).emit('mapSize', mapSize);
  }

  @SubscribeMessage('gamecontrolB')
  async gameControlB(client: Socket, control: any) {
    this.gameWatchId = client.data.gameWatch.gameWatchId;
    if (client.data.role === 'host') {
      this.sendToClientControlB({
        position: this.pingpongService.updatePaddleBPosition(
          this.gameWatchId,
          control,
        ),
      });
    }
  }

  private sendToClientControlB(control: any) {
    this.server.to(this.gameWatchId).emit('controlB', control);
  }

  @SubscribeMessage('gamecontrolA')
  async gameControlA(client: Socket, control: any) {
    this.gameWatchId = client.data.gameWatch.gameWatchId;
    if (client.data.role === 'guest') {
      this.sendToClientControlA({
        position: this.pingpongService.updatePaddleAPosition(
          this.gameWatchId,
          control,
        ),
      });
    }
  }

  private sendToClientControlA(control: any) {
    this.server.to(this.gameWatchId).emit('controlA', control);
  }

  async onModuleInit() {
    setInterval(async () => {
      if (this.userGameIdA !== '' && this.userGameIdB !== '') {
        this.sendToClientBall({
          ball: this.pingpongService.getBallInfo(this.gameWatchId),
        });
        this.sendToClientScores({
          scores: this.pingpongService.getScores(this.gameWatchId),
        });
        const winner = this.pingpongService.getWinner(
          this.gameWatchId,
          this.userGameIdA,
          this.userGameIdB,
        );
        if (winner !== '') {
          this.sendToClientWinner({
            winner: winner,
          });

          this.userGameIdA = '';
          this.userGameIdB = '';
        }
      }
    }, 1000 / 60); // 60FPS로 업데이트, 필요에 따라 조정 가능
  }

  private sendToClientWinner(winner: any) {
    this.server.to(this.gameWatchId).emit('gameover', winner);
  }

  private sendToClientScores(scores: any) {
    this.server.to(this.gameWatchId).emit('scores', scores);
  }

  sendToClientBall(control: any) {
    this.server.to(this.gameWatchId).emit('ballcontrol', control);
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
    // 매칭 큐에서 제거
    if (client.data.userId) {
      this.gamesService.removePlayerToQueue(client, client.data.userId);
    }
    if (this.sockets.get(client.id)) {
      this.sockets.delete(client.id);
    }
    this.logger.log(`${client.id} 게임 소켓 연결 해제`);
  }

  /*
   ** 게임 준비
   */
  private getMyUserGame = async (userId: string): Promise<UserGame> => {
    const games: Game[] = await this.gamesService.getGames();
    const pong: Game = games.filter((game) => game.name === '핑퐁핑퐁')[0];
    const userPong: UserGame = await this.gamesService.getUserGame(
      userId,
      pong.gameId,
    );
    return userPong;
  };

  private findSocketByUserGameId = (userGameId: string): Socket | null => {
    for (const socketId of this.sockets.keys()) {
      const socket = this.sockets.get(socketId);
      if (socket.data.userGame.userGameId === userGameId) {
        return socket;
      }
    }
    return null;
  };

  // 게임 준비
  @SubscribeMessage('startReadyGame')
  async startGameReady(client: Socket, gameWatch: GameWatch) {
    console.log('startReadyGame');
    const userId = client.data.user['id'];
    const myUserGame: UserGame = await this.getMyUserGame(userId);
    if (!myUserGame) {
      console.log('userGame이 없는 유저입니다');
      client.emit('gameError', { message: 'userGame이 없는 유저입니다' });
    }
    client.data.userGame = myUserGame;
    client.data.gameWatch = gameWatch;
    if (myUserGame.userGameId === gameWatch.userGameId1) {
      client.data.role = 'host';
      client.data.enemyUserGameId = gameWatch.userGameId2;
      client.data.enemyUserId = await this.gamesService.getUserByUserGameId(
        gameWatch.userGameId2,
      );
      console.log('방장 유저입니다');
    } else if (myUserGame.userGameId === gameWatch.userGameId2) {
      client.data.role = 'guest';
      client.data.enemyUserGameId = gameWatch.userGameId1;
      client.data.enemyUserId = await this.gamesService.getUserByUserGameId(
        gameWatch.userGameId1,
      );
      console.log('방장이 아닌 유저입니다');
    }
    const userGameInfo: UserGameInfo = {
      ...myUserGame,
      enemyUserId: client.data.enemyUserId,
      enemyUserGameId: client.data.enemyUserGameId,
      role: client.data.role,
    };
    this.sockets.set(client.id, client);
    client.emit('startReadyGame', userGameInfo);
  }

  // 게임 준비 취소
  @SubscribeMessage('cancelReadyGame')
  async cancelReadyGame(
    client: Socket,
    data: { gameWatch: GameWatch; enemyUserGameId: string },
  ) {
    const enemySocket: Socket = this.findSocketByUserGameId(
      data.enemyUserGameId,
    );
    client.emit('cancelReadyGame');
    client.to(enemySocket.id).emit('cancelReadyGame');
    this.eventEmitter.emit('cancelGame', data.gameWatch);
  }

  // 게임 준비 스피드 업데이트
  @SubscribeMessage('speedUpdate')
  async speedUpdate(
    client: Socket,
    data: { guestUserGameId: string; speed: string },
  ) {
    const enemySocket: Socket = this.findSocketByUserGameId(
      data.guestUserGameId,
    );
    client.to(enemySocket.id).emit('speedUpdate', data.speed);
  }

  // 게임 시작
  @SubscribeMessage('gameStart')
  async gameStart(
    client: Socket,
    data: { guestUserGameId: string; speed: string },
  ) {
    const enemySocket: Socket = this.findSocketByUserGameId(
      data.guestUserGameId,
    );
    client.join(client.data.gameWatch.gameWatchId);
    enemySocket.join(client.data.gameWatch.gameWatchId);
    // console.log('--------------------------------');
    // console.log(client.id);
    // console.log(client.rooms);
    // console.log(enemySocket.id);
    // console.log(enemySocket.rooms);
    // console.log('--------------------------------');
    client.emit('gameStart');
    client.to(enemySocket.id).emit('gameStart');
  }

  // 랜덤 게임 매칭
  @SubscribeMessage('randomMatch')
  async randomMatch(client: Socket, { gameId }: randomMatchDto) {
    const userId = client.data.user['id'];
    const user = await this.accountService.getUser(userId);
    const game = await this.gamesService.getGame(gameId);
    if (!user || !game) {
      client.emit('randomMatchError', '유저 또는 게임이 없습니다');
      return;
    }
    const userGame = await this.gamesService.getUserGame(userId, gameId);
    if (userGame === null) {
      client.emit('randomMatchError', '게임을 구매한 사람이 아닙니다');
      return;
    }

    client.data.userId = userId;
    client.data.nickname = user.nickname;
    client.data.gameId = gameId;
    client.data.gameName = game.name;

    this.logger.log(
      `대기 --- game: ${game.name} --- name: ${user.nickname} --- id: ${userId}`,
    );
    this.gamesService.addPlayerToQueue(client);
  }

  // @SubscribeMessage('gameFinish')
  // async gameFinish(client: Socket, { gameWatchId }: GameWatchId) {
  //   this.logger.log('Game Finish');
  //   const userId = client.data.user['id'];
  //   const gameWatch = await this.gamesService.getGameWatch(userId, gameWatchId);

  //   if (gameWatch === null) {
  //     client.emit('matchFail');
  //     return;
  //   }
  //   this.gamesService.createGameHistory(gameWatch.gameWatchId, {
  //     winnerId: gameWatch.userGameId1,
  //     loserId: gameWatch.userGameId2,
  //     winnerScore: 11,
  //     loserScore: 1,
  //   });
  // }

  // // 게임 떠나기
  // @SubscribeMessage('leaveMatch')
  // handleLeaveMatch(client: Socket) {
  //   const userId = client.data.user['id'];
  //   // 용도 물어보기
  //   client.emit('matchFail');
  //   this.gamesService.removePlayerToQueue(client, userId);
  // }
}
