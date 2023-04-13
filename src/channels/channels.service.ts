import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelsRepository } from './repository/channels.repository';

@Injectable()
export class ChannelsService {
  constructor(private repository: ChannelsRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */

  async getPublicList(): Promise<PublicChannels> {
    // userId 알아내는 로직 필요
    const userId = "";
    const channel = await this.repository.findPublicList();
    return {channel: channel};
  }

  async getChatLog(channelId: string): Promise<ChatLog> {
    // userId 알아내는 로직 필요
    const userId = "";
    const userChannel =  await this.validateUserChannel(userId, channelId);
    const chats = await this.repository.findChatLogs(userChannel.channel.channelId);
    return { 
      channel: userChannel.channel,
      chat: chats
    };
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
      throw new NotFoundException();
    }
    return userChannel;
  }

  async validateUserChannelNoThrow(userId: string, channelId: string): Promise<UserChannelOne | null> {
    const userChannel = await this.repository.findOneUserChannel(userId, channelId);
    return userChannel;
  }
}
