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
  channelId: string;
  userId: string;
}

interface ChatMessage {
  channelId: string;
  userId: string;
  message: string;
  time: Date;
}

@WebSocketGateway({ cors: true, namespace: 'channel' })
export class ChannelsEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private channelService: ChannelsService) {}

  private logger = new Logger('ChannelGateway');

  // 채팅방에 들어갈 경우
  @SubscribeMessage('enterChannel')
  async enterChannel(client: Socket, aa: EnterChannelMessage) {
    const userChannel = await this.channelService.validateUserChannelNoThrow(
      aa.userId,
      aa.channelId,
    );
    if (userChannel !== null) {
      client.data.userChannelId = userChannel.userChannelId;
      client.join(aa.channelId);
      return { return: 'Success' };
    }
    return { return: 'Not Found' };
  }

  // 채팅방 안에서 메시지 전송 및 수신
  @SubscribeMessage('chat')
  async chatMessage(
    client: Socket,
    { channelId, userId, message, time }: ChatMessage,
  ) {
    const userChannel = await this.channelService.validateUserChannelNoThrow(
      userId,
      channelId,
    );
    if (client.data.userChannelId === userChannel.userChannelId) {
      if (userChannel.channel.isDm) {
        let banMessage: string | null =
          await this.channelService.isBanBuddyInDm(
            userId,
            channelId,
            userChannel.userChannelId,
          );
        if (banMessage !== null) {
          return { cannotSend: banMessage };
        }
      } else {
        if (userChannel.isMute) {
          return { cannotSend: 'is mute' };
        }
      }
      const user = await this.channelService.sendMessage(
        userChannel,
        message,
        time,
      );
      client.to(channelId).emit('chat', {
        channelId: channelId,
        user: user,
        message: message,
        time: time,
      });
      return {
        channelId: channelId,
        user: user,
        message: message,
      };
    }
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
    const userChannelId = client.data.userChannelId;
    if (userChannelId !== undefined) {
      this.channelService.updateLastViewTime(userChannelId);
    }
  }
}
