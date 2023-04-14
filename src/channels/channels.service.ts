import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ChannelsRepository } from './repository/channels.repository';
import { ChannelCreateDto, ChannelInviteDto, ChannelPasswordDto } from './dto/channels.dto';
import { Channel } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(private repository: ChannelsRepository) {}

  private getUserId() {
    return "05eafb5c-7259-4945-a718-d526f3007ca9";
  }
  async getPublicList() {
    // userId 알아내는 로직 필요
    // 유저가 속한 채널은 제외하는 로직 만들기
    const userId = this.getUserId();
    const channel = await this.repository.findChannelsByPublic();
    const list = channel.map(
      ({channelId, channelName}) => ({channelId, channelName})
    );
    return {channel: list};
  }

  async getMyChannelList() {
    // userId 알아내는 로직 필요
    const userId = this.getUserId();
    const userChannels = await this.repository.findUserChannelsWithChannel(userId);
    const result = await Promise.all(userChannels.map(async (userChannel) => {
      const users = await this.repository.findUsersInChannel(userChannel.channel.channelId);
      const chats = await this.repository.findChatsByChannelId(userChannel.channel.channelId);
      let notReadCount: number = 0;
      let lastMessageTime: Date = userChannel.lastChatTime;

      if (chats.length !== 0) {
        chats.map(chat => {
          if (chat.time > userChannel.lastChatTime) {
            notReadCount++;
          }
        });
        lastMessageTime = chats.at(0).time;
      }
      userChannel.lastChatTime = undefined;
      return {
        userChannel: userChannel,
        user: users.slice(0, 2),
        chat: {
          computedChatCount: notReadCount,
          time: lastMessageTime,
        }
      };
    }));
    result.sort((res1: ChannelListArrayType, res2: ChannelListArrayType): number => {
      return new Date(res1.chat.time).getTime() - new Date(res2.chat.time).getTime();
    }).reverse();
    return { channel: result };
  }

  async createChannel(dto: ChannelCreateDto) {
    // userId 알아내는 로직 필요
    const userId = this.getUserId();
    let channelPassword: string = null;
    // password 암호화
    if (dto.password !== undefined) {
      channelPassword = dto.password;
    }
    dto.password = channelPassword;
    const newChannel = await this.repository.createChannel(dto);
    const userChannelData: CreateUserChannelData = {
      isOwner: true,
      isAdmin: true,
      isMute: false,
      lastChatTime: new Date(),
      userId: userId,
      channelId: newChannel.channelId
    }
    await this.repository.createUserChannel(userChannelData);
  }

  async joinChannel(channelId: string, dto: ChannelPasswordDto) {
    // userId 알아내는 로직 필요
    const userId = this.getUserId();
    const channel = await this.validateChannel(channelId);
    const userChannel = await this.validateUserChannelNoThrow(userId, channel.channelId);
    if (userChannel !== null) {
      throw new ConflictException("Already joined");
    }
    // password 복호화?, 패스워드 없을 떄 수정
    if (channel.password !== null && dto.password !== channel.password) {
      throw new BadRequestException("wrong password");
    }
    const userChannelData: CreateUserChannelData = {
      isOwner: false,
      isAdmin: false,
      isMute: false,
      lastChatTime: new Date(),
      userId: userId,
      channelId: channel.channelId
    }
    await this.repository.createUserChannel(userChannelData);
    await this.repository.updateChannelCount(channel.channelId);
  }

  async getChatLog(channelId: string) {
    // userId 알아내는 로직 필요
    const userId = this.getUserId();
    const userChannel =  await this.validateUserChannel(userId, channelId);
    const chats = await this.repository.findChatLogs(userChannel.channel.channelId);
    return { 
      channel: userChannel.channel,
      chat: chats
    };
  }

  async searchUserForInvite(channelId: string, nickname: string) {
    // userId 알아내는 로직 필요
    const userId = this.getUserId();
    const userChannel =  await this.validateUserChannel(userId, channelId);
    const user = await this.repository.findUserByNickname(nickname);
    if (!user) {
      throw new NotFoundException("Not existed user");
    }
    const isOnChannel = await this.validateUserChannelNoThrow(user.userId, channelId) === null ? false : true;
    return {
      userId: user.userId,
      nickname: user.nickname,
      image: user.image,
      isOnChannel: isOnChannel
    }
  }

  async inviteUser(channelId: string, dto: ChannelInviteDto) {
    // userId 알아내는 로직 필요
    const userId = this.getUserId();
    const userChannel =  await this.validateUserChannel(userId, channelId);
    const user = await this.repository.findUserByUserId(dto.userId);
    if (!user) {
      throw new NotFoundException("Not existed user");
    }
    if (await this.validateUserChannelNoThrow(user.userId, channelId) !== null) {
      throw new ConflictException("Already joined");
    }
    const userChannelData: CreateUserChannelData = {
      isOwner: false,
      isAdmin: false,
      isMute: false,
      lastChatTime: new Date(),
      userId: user.userId,
      channelId: channelId
    }
    await this.repository.createUserChannel(userChannelData);
    await this.repository.updateChannelCount(channelId);
  }

  async changeChannelPassword(channelId: string, dto: ChannelPasswordDto) {
    // 오너? 관리자?
  }

  /**
   * 소켓에서 사용하는 메소드
   */

  async sendMessage(userChannel: UserChannelOne, message: string, time: Date): Promise<UserOne> {
    await this.repository.createChat(userChannel.userChannelId, message, time);
    return {
      user: userChannel.user
    };
  }

  async updateLastViewTime(userChannelId: string) {
    const lastTime = new Date();
    await this.repository.updateLastChatTime(userChannelId, lastTime);
  }

  /**
   * validation(검증) 메소드
   */
  async validateUserChannel(userId: string, channelId: string): Promise<UserChannelOne> {
    const userChannel = await this.repository.findOneUserChannel(userId, channelId);
    if (userChannel === null) {
      throw new NotFoundException("Not existed channel");
    }
    return userChannel;
  }

  async validateUserChannelNoThrow(userId: string, channelId: string): Promise<UserChannelOne | null> {
    const userChannel = await this.repository.findOneUserChannel(userId, channelId);
    return userChannel;
  }

  async validateChannel(channelId: string): Promise<Channel> {
    const channel = await this.repository.findChannelByChannelId(channelId);
    if (channel === null) {
      throw new NotFoundException("Not existed channel");
    }
    return channel;
  }
}
