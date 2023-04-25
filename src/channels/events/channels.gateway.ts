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
import { ChannelsService } from '../channels.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';

interface EnterChannelMessage {
  channelId: string;
}

interface ChatMessage {
  channelId: string;
  message: string;
  time: Date;
}

@UseGuards(AuthGuard)
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
  async enterChannel(client: Socket, enterChannelData: EnterChannelMessage) {
    const userId = client.data.user['id'];
    const userChannel = await this.channelService.validateUserChannelNoThrow(
      userId,
      enterChannelData.channelId,
    );
    if (userChannel === null) {
      this.errorEmit(client, 'You are not in channel');
      return;
    }
    client.data.userChannelId = userChannel.userChannelId;
    client.join(enterChannelData.channelId);
    client.emit('message', { message: 'Success' });
  }

  // 채팅방 안에서 메시지 전송 및 수신
  @SubscribeMessage('chat')
  async chatMessage(client: Socket, createChatData: ChatMessage) {
    const userId = client.data.user['id'];
    const userChannelId = client.data.userChannelId;
    if (userChannelId === undefined) {
      this.errorEmit(client, 'You are not in channel');
      return;
    }
    const userChannel = await this.channelService.validateUserChannelNoThrow(
      userId,
      createChatData.channelId,
    );
    if (userChannel === null || userChannelId !== userChannel.userChannelId) {
      this.errorEmit(client, 'You are not in channel');
      return;
    }
    if (userChannel.channel.isDm) {
      let banMessage: string | null = await this.channelService.isBanBuddyInDm(
        userId,
        createChatData.channelId,
        userChannel.userChannelId,
      );
      if (banMessage !== null) {
        this.errorEmit(client, banMessage);
        return;
      }
    } else {
      if (userChannel.isMute) {
        this.errorEmit(client, 'You are muted');
        return;
      }
    }
    const user = await this.channelService.sendMessage(
      userChannel,
      createChatData.message,
      createChatData.time,
    );
    client.to(createChatData.channelId).emit('chat', {
      channelId: createChatData.channelId,
      user: user,
      message: createChatData.message,
      time: createChatData.time,
    });
    return {
      channelId: createChatData.channelId,
      user: user,
      message: createChatData.message,
      time: createChatData.time,
    };
  }

  private errorEmit(client: Socket, message: string) {
    client.emit('error', {
      NotFoundException: message,
    });
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
    const user = client.data.user;
    const userChannelId = client.data.userChannelId;
    if (user !== undefined && userChannelId !== undefined) {
      this.channelService.updateLastViewTime(userChannelId);
    }
  }
}
