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
import { GameHistory } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AccountService } from 'src/account/account.service';
import { GameHistoryDto, gameWatchIdDto } from '../dto/games.dto';
import { GamesService } from '../games.service';

interface randomMatchProps {
  userId: string;
  gameId: string;
}

// cors 꼭꼭 해주기!
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
  async randomMatch(client: Socket, { userId, gameId }: randomMatchProps) {
    const userGame = await this.accountService.getUserGame(userId, gameId);
    if (userGame === null) {
      client.emit('matchFail');
      return;
    }
    const user = await this.accountService.getUser(userId);
    const game = await this.gamesService.getGame(gameId);
    if (game.isPlayable === false) {
      client.emit('matchFail');
    }

    client.data.userId = userId;
    client.data.nickname = user.nickname;
    client.data.gameId = gameId;
    client.data.gameName = game.name;

    console.log(
      `match start! --- game: ${game.name} --- name: ${user.nickname} --- id: ${userId}`,
    );
    this.gamesService.addPlayerToQueue(client);
  }

  @SubscribeMessage('gameFinish')
  async gameFinish(client: Socket, gameWatchId: string) {
    console.log("Game Finish");
    const gameWatch = await this.gamesService.getGameWatch(gameWatchId);
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
    this.gamesService.removePlayerToQueue(client);
  }
}
