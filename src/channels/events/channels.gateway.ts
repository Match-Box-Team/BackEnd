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
  message: string,
  time: Date
}

@WebSocketGateway({namespace: 'channel'})
export class ChannelsEventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private channelService: ChannelsService) {}

  private logger = new Logger('ChannelGateway');
  
  // 채팅방에 들어갈 경우
  @SubscribeMessage('enterChannel')
  enterChannel(client: Socket, { channelId }: EnterChannelMessage) {
    console.log(channelId);
    client.join(channelId);
  }

  // 채팅방 안에서 메시지 전송 및 수신
  @SubscribeMessage('chat')
  async chatMessage(client: Socket, { channelId, userId, message, time }: ChatMessage) {
    console.log("Enter => " + channelId);
    const user = await this.channelService.sendMessage(channelId, userId, message, time);
    client.to(channelId).emit('chat',  { channelId: channelId, user: user, message: message, time: time });
    return {
        channelId: channelId,
        user: user,
        message: message
    };
  }

  // 초기화 이후에 실행
  afterInit() {
    this.logger.log('채널 - 초기화 완료');
  }

  // 소켓이 연결되면 실행
  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} 소켓 연결`);
  }

  // 소켓 연결이 끊기면 실행
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} 소켓 연결 해제`);
  }
}
