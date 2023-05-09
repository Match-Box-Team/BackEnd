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
import { Game, GameWatch, UserGame } from '@prisma/client';
import { PingpongService } from '../gameplays/pingpong.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserProfile, randomMatchDto } from '../repository/game.type';
import { GamesRepository } from '../repository/games.repository';

interface UserGameInfo {
  userId: string;
  gameId: string;
  userGameId: string;
  enemyUserId: string;
  enemyUserGameId: string;
  role: string;
}

interface roomInfo {
  userGameIdA: string;
  userGameIdB: string;
  gameWatchId: string;
  watchCount: number;
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
    private gameRepository: GamesRepository,
    private pingpongService: PingpongService,
    private eventEmitter: EventEmitter2,
  ) {}

  @WebSocketServer()
  server: Server;

  private logger = new Logger('GamesGateway');

  private sockets = new Map<string, Socket>();
  private gameWatchIds = new Map<string, roomInfo>();

  @SubscribeMessage('ready')
  async gameReady(client: Socket, info: any) {
    this.logger.log(`game ready -id: ${client.id}`);
    const gameWatchId = info.gameWatchId;
    if (info.gameWatchId) {
      this.gameWatchIds.set(gameWatchId, {
        ...this.gameWatchIds.get(gameWatchId),
        gameWatchId,
        watchCount: 0,
      });
    }

    let isHost: boolean;
    let isWatcher: boolean;

    if (client.data.role === 'host') {
      isHost = true;
      isWatcher = false;
      const speed = client.data.gameWatch.speed;
      this.pingpongService.InitGameInfo(gameWatchId, speed);
      this.pingpongService.setScoresZeros(gameWatchId);
      const userGameIdB = client.data.userGame.userGameId;
      this.gameWatchIds.set(gameWatchId, {
        ...this.gameWatchIds.get(gameWatchId),
        userGameIdB,
      });
      client.join(gameWatchId);
    } else if (client.data.role === 'guest') {
      isHost = false;
      isWatcher = false;
      const userGameIdA = client.data.userGame.userGameId;
      this.gameWatchIds.set(gameWatchId, {
        ...this.gameWatchIds.get(gameWatchId),
        userGameIdA,
      });
      client.join(gameWatchId);
    } else {
      this.logger.log(`Watcher -id: ${client.id}`);
      isHost = false;
      isWatcher = true;
      const tempRoomInfo = this.gameWatchIds.get(gameWatchId);
      this.gameWatchIds.set(gameWatchId, {
        ...tempRoomInfo,
        watchCount: tempRoomInfo.watchCount + 1,
      });
      await this.gameRepository.updateGameWatch(
        gameWatchId,
        tempRoomInfo.watchCount + 1,
      );
      client.data.gameWatchIdForWatcher = gameWatchId;
      client.join(gameWatchId);
    }
    this.sendToClientIsHost(client.id, {
      isHost: isHost,
      isWatcher: isWatcher,
    });
    if (!isWatcher) {
      this.sendToClientNickname(client, isHost);
    } else {
      this.sendNicknameForWatcher(client, gameWatchId);
    }
    const mapSize = this.pingpongService.getMapSize(gameWatchId);
    this.sendToClientMapSize(gameWatchId, mapSize);
  }

  // 플레이어의 경우
  private sendToClientNickname = async (client: Socket, isHost: boolean) => {
    const user = await this.accountService.getUser(client.data.user['id']);
    const enemy = await this.accountService.getUser(client.data.enemyUserId);
    client.data.enemyNickname = enemy.nickname;
    if (isHost) {
      this.server.to(client.id).emit('nickname', {
        nickname1: user.nickname,
        nickname2: enemy.nickname,
      });
    } else {
      this.server.to(client.id).emit('nickname', {
        nickname1: enemy.nickname,
        nickname2: user.nickname,
      });
    }
  };

  // 관전자의 경우
  private sendNicknameForWatcher = async (
    client: Socket,
    gameWatchId: string,
  ) => {
    const roomInfo: roomInfo = this.gameWatchIds.get(gameWatchId);
    if (!roomInfo.userGameIdA || !roomInfo.userGameIdB) {
      return;
    }
    const userA: UserProfile = await this.gameRepository.getUserProfile(
      roomInfo.userGameIdA,
    );
    const userB: UserProfile = await this.gameRepository.getUserProfile(
      roomInfo.userGameIdB,
    );
    client.emit('nickname', {
      nickname1: userB.nickname,
      nickname2: userA.nickname,
    });
  };

  private sendToClientIsHost(socketId: any, data: any) {
    this.server.to(socketId).emit('ishost', data);
  }

  private sendToClientMapSize(gameWatchId: string, mapSize: any) {
    this.server.to(gameWatchId).emit('mapSize', mapSize);
  }

  @SubscribeMessage('gamecontrolB')
  async gameControlB(client: Socket, control: any) {
    const gameWatchId = client.data.gameWatch.gameWatchId;
    if (client.data.role === 'host') {
      this.sendToClientControlB(gameWatchId, {
        position: this.pingpongService.updatePaddleBPosition(
          gameWatchId,
          control,
        ),
      });
    }
  }

  private sendToClientControlB(gameWatchId: string, control: any) {
    this.server.to(gameWatchId).emit('controlB', control);
  }

  @SubscribeMessage('gamecontrolA')
  async gameControlA(client: Socket, control: any) {
    const gameWatchId = client.data.gameWatch.gameWatchId;
    if (client.data.role === 'guest') {
      this.sendToClientControlA(gameWatchId, {
        position: this.pingpongService.updatePaddleAPosition(
          gameWatchId,
          control,
        ),
      });
    }
  }

  private sendToClientControlA(gameWatchId: string, control: any) {
    this.server.to(gameWatchId).emit('controlA', control);
  }

  onModuleInit() {
    setInterval(async () => {
      for (const gameWatchId of this.gameWatchIds.keys()) {
        const roomInfo: roomInfo = this.gameWatchIds.get(gameWatchId);
        if (
          roomInfo.gameWatchId !== '' &&
          roomInfo.gameWatchId !== undefined &&
          roomInfo.userGameIdA !== '' &&
          roomInfo.userGameIdA !== undefined &&
          roomInfo.userGameIdB !== '' &&
          roomInfo.userGameIdB !== undefined
        ) {
          this.sendToClientBall(roomInfo.gameWatchId, {
            ball: this.pingpongService.getBallInfo(roomInfo.gameWatchId),
          });
          this.sendToClientScores(roomInfo.gameWatchId, {
            scores: this.pingpongService.getScores(roomInfo.gameWatchId),
          });
          const winner = await this.pingpongService.getWinner(
            roomInfo.gameWatchId,
            roomInfo.userGameIdA,
            roomInfo.userGameIdB,
          );
          if (winner !== '') {
            this.sendToClientWinner(roomInfo.gameWatchId, {
              winner: winner,
            });
            this.gameWatchIds.delete(roomInfo.gameWatchId);
            // 유저 2명의 상태 online으로 업데이트
            this.eventEmitter.emit(
              'updateUserStateOnline',
              roomInfo.userGameIdA,
            );
            this.eventEmitter.emit(
              'updateUserStateOnline',
              roomInfo.userGameIdB,
            );
          }
        }
      }
    }, 1000 / 60); // 60FPS로 업데이트, 필요에 따라 조정 가능
  }

  private sendToClientWinner(gameWatchId: string, winner: any) {
    this.server.to(gameWatchId).emit('gameover', winner);
  }

  private sendToClientScores(gameWatchId: string, scores: any) {
    if (!scores || scores.scores === undefined) {
      return;
    }
    this.server.to(gameWatchId).emit('scores', scores);
  }

  sendToClientBall(gameWatchId: string, control: any) {
    if (!control || control.ball === undefined) {
      return;
    }
    this.server.to(gameWatchId).emit('ballcontrol', control);
  }

  // 게임 중 GG
  @SubscribeMessage('giveUp')
  async giveUp(client: Socket) {
    await this.giveUpFn(client);
  }

  private giveUpFn = async (client: Socket) => {
    if (!client.data.gameWatch) {
      return;
    }
    const gameWatchId = client.data.gameWatch.gameWatchId;
    const enemy = await this.accountService.getUser(client.data.enemyUserId);
    this.sendToClientWinner(gameWatchId, {
      winner: enemy.nickname,
    });
    // createGameHistory 내부에 gameWatch를 지우는 코드가 있음
    this.gamesService.createGameHistory(gameWatchId, {
      winnerId: client.data.enemyUserGameId,
      loserId: client.data.userGame.userGameId,
      winnerScore: 11,
      loserScore: 0,
    });
    this.gameWatchIds.delete(gameWatchId);
    // 유저 2명의 상태 online으로 업데이트
    this.eventEmitter.emit('cancelGame', client.data.gameWatch);
  };

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
    // 게임 플레이 중 나갔을 때 처리
    if (client.data.gameWatch) {
      const gameWatch = await this.gamesService.getGameWatchByGameWatchId(
        client.data.gameWatch.gameWatchId,
      );
      if (gameWatch) {
        await this.giveUpFn(client);
      }
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
    const userId = client.data.user['id'];
    const myUserGame: UserGame = await this.getMyUserGame(userId);
    if (!myUserGame) {
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
    } else if (myUserGame.userGameId === gameWatch.userGameId2) {
      client.data.role = 'guest';
      client.data.enemyUserGameId = gameWatch.userGameId1;
      client.data.enemyUserId = await this.gamesService.getUserByUserGameId(
        gameWatch.userGameId1,
      );
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
    data: { guestUserGameId: string; speed: number },
  ) {
    const enemySocket: Socket = this.findSocketByUserGameId(
      data.guestUserGameId,
    );
    if (!enemySocket) {
      client.emit('gameStartError');
    }
    client.data.gameWatch.speed = data.speed;
    client.join(client.data.gameWatch.gameWatchId);
    enemySocket.join(client.data.gameWatch.gameWatchId);
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
    client.emit('randomMatchStart');
    client.data.userId = userId;
    client.data.nickname = user.nickname;
    client.data.gameId = gameId;
    client.data.gameName = game.name;

    this.logger.log(
      `대기 --- game: ${game.name} --- name: ${user.nickname} --- id: ${userId}`,
    );
    this.gamesService.addPlayerToQueue(client);
  }

  // 게임 떠나기
  @SubscribeMessage('cancelRandomMatch')
  cancelRandomMatch(client: Socket) {
    const userId = client.data.user['id'];
    this.gamesService.removePlayerToQueue(client, userId);
  }

  @SubscribeMessage('gameWatch')
  async gameWatch(client: Socket, data) {
    if (this.gameWatchIds.size !== 0) {
      if (this.gameWatchIds.get(data.gameWatchId).watchCount < 10) {
        client.join(data.gameWatchId);
        client.emit('gameWatchSuccess', data.gameWatchId);
      } else {
        client.emit('gameWatchFull', '관전자가 꽉 찼습니다');
        return;
      }
    } else {
      client.emit('gameWatchFail', '게임이 존재하지 않습니다');
      console.error('Invalid game watch ID:', data.gameWatchId);
      return;
    }
  }
}

// if (this.gameWatchIds[gameWatchId] !== '') {
//   if (this.gameWatchIds[gameWatchId].watcherCount <= 4) {
//     client.join(gameWatchId);
//     client.emit('gameWatchSuccess', gameWatchId);
//     this.gameWatchIds[gameWatchId].watcherCount++;
//   } else {
//     client.emit('gameWatchFull', '관전자가 꽉 찼습니다');
//     return;
//   }

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
