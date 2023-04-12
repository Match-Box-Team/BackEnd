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
import { ChannelsService } from '../channels.service';

interface EnterChannelMessage {
  channelId: string
}

interface ChatMessage {
  channelId: string,
  userId: string,
  message: string
}

@WebSocketGateway()
export class ChannelsEventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private channelService: ChannelsService) {}

  private logger = new Logger('ChannelGateway');
  
  @SubscribeMessage('enterChannel')
  enterChannel(client: Socket, { channelId }: EnterChannelMessage) {
    console.log(channelId);
    client.join(channelId);
  }

  @SubscribeMessage('chat')
  chatMessage(client: Socket, { channelId, userId, message }: ChatMessage) {
    console.log(channelId);

    client.to(channelId).emit('chat',  { channelId: channelId, userId: userId, message: message });
    this.channelService.sendMessage();
    // chat 로직 구현
    return {
        channelId: channelId,
        userId: userId,
        message: message
    };
  }

  // 초기화 이후에 실행
  afterInit() {
    this.logger.log('채널 - 초기화 완료');
  }

  // 소켓이 연결되면 실행
  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결`);

    socket.broadcast.emit('message', {
      message: `${socket.id}가 들어왔습니다.`,
    });
  }

  // 소켓 연결이 끊기면 실행
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결 해제`);
  }
}
