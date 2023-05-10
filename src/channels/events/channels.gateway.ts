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

interface KickMessage {
  channelId: string;
  targetId: string;
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
      this.errorOut(client, '해당 채널에 참여하지 않았습니다.');
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
      this.errorOut(client, '해당 채널에 참여하지 않았습니다.');
      return;
    }
    const userChannel = await this.channelService.validateUserChannelNoThrow(
      userId,
      createChatData.channelId,
    );
    if (userChannel === null || userChannelId !== userChannel.userChannelId) {
      this.errorOut(client, '해당 채널에 참여하지 않았습니다.');
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
        this.errorEmit(client, '음소거된 상태입니다.');
        return;
      }
    }

    const newChat = await this.channelService.createNewChatAndGetChatId(
      userChannelId,
      createChatData.message,
      createChatData.time,
      userChannel.user.nickname,
      userChannel.channel.channelId,
    );

    const response = {
      chatId: newChat.chatId,
      message: newChat.message,
      time: newChat.time,
      userChannel: {
        isAdmin: userChannel.isAdmin,
        isMute: userChannel.isMute,
        user: {
          userId: userChannel.user.userId,
          nickname: userChannel.user.nickname,
          image: userChannel.user.image,
        },
      },
    };

    client.to(createChatData.channelId).emit('chat', response);

    return response;
  }

  // 킥하기
  @SubscribeMessage('kick')
  async kick(client: Socket, kickData: KickMessage) {
    const userId = client.data.user['id'];
    const userChannelId = client.data.userChannelId;
    if (userChannelId === undefined) {
      this.errorOut(client, '해당 채널에 참여하지 않았습니다.');
      return;
    }
    const message = await this.channelService.kickUser(
      userId,
      kickData.targetId,
      kickData.channelId,
    );
    if (message === null) {
      client.to(kickData.channelId).emit('kicked', kickData);
    } else {
      this.errorEmit(client, message);
    }
    return;
  }

  private errorEmit(client: Socket, message: string) {
    client.emit('error', {
      NotFoundException: message,
    });
  }

  private errorOut(client: Socket, message: string) {
    client.emit('error', {
      NotFoundExceptionOut: message,
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
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} 소켓 연결 해제`);
    const user = client.data.user;
    const userChannelId = client.data.userChannelId;
    if (user === undefined || userChannelId === undefined) {
      return;
    }
    const userChannel = await this.channelService.validateKidkcedUserChannel(
      user.userId,
      userChannelId,
    );
    if (userChannel === null || userChannelId !== userChannel.userChannelId) {
      return;
    }
    await this.channelService.updateLastViewTime(userChannelId);
  }
}
