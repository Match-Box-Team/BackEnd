import { Injectable } from '@nestjs/common';
import { ChannelsRepository } from './repository/channels.repository';

@Injectable()
export class ChannelsService {
  constructor(private repository: ChannelsRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */

  async getPublicList() {
    // userId 알아내는 로직 필요
    const userId = "7a68ed09-0036-440e-b187-5594e03457d9";
    const channel = await this.repository.findPublicList();
    return {channel: channel};
  }

  async getChatLog(channelId: string) {
    // userId 알아내는 로직 필요
    // get userChannel(userId, channelId)
    // if user(userId) not in channel(channelId)
    // => throw error
    //로직이 생기면 아래 코드 수정.
    const userId = "7a68ed09-0036-440e-b187-5594e03457d9";
    const userChannel = await this.repository.findOneUserChannel(userId, channelId);
    if (userChannel == null) {
      return "error"; // throw로 수정
    }
    const chats = await this.repository.findChannelLogs(userChannel.userChannelId);
    return { 
      channel: userChannel.channel,
      chat: chats
    };
  }

  async sendMessage(channelId: string, userId: string, message: string, time: Date) {
    const userChannel = await this.repository.findOneUserChannel(userId, channelId);
    if (userChannel == null) {
      return "error"; // throw로 수정
    }
    await this.repository.createChat(userChannel.userChannelId, message, time);
    console.log(userChannel.user);
    return {
      user: userChannel.user
    };
  }
}
