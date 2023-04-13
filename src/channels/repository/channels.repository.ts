import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ChannelsRepository {
  constructor(private prisma: PrismaService) {}

  // 쿼리 작성
  async findPublicList(): Promise<FindPublicChannels[]> {
    return this.prisma.channel.findMany({
      where: {
        isPublic: true,
        isDm: false
      },
      select: {
        channelId: true,
        channelName: true
      }
    });
  }

  async findOneUserChannel(userId: string, channelId: string): Promise<UserChannelOne> {
    return await this.prisma.userChannel.findFirst({
      where: {
        userId: userId,
        channelId: channelId
      },
      select: {
        userChannelId: true,
        channel: {
          select: {
            channelId: true,
            channelName: true,
          }
        },
        user: {
          select: {
            userId: true,
            nickname: true,
            image: true,
          }
        }
      }
    });
  }

  async findChatLogs(channelId: string): Promise<FindChatLogs[]> {
    return await this.prisma.chat.findMany({
      where: {
        userChannel: {
          channel: {
            channelId: channelId
          }
        }
      },
      select: {
        chatId: true,
        message: true,
        time: true,
        userChannel: {
          select: {
            isAdmin: true,
            isMute: true,
            user: {
              select: {
                userId: true,
                nickname: true,
                image: true,
              }
            }
          },
        },
      },
      orderBy: [{
        time: 'asc'
      }]
    });
  }

  /**
   * Create, Delete, Update
   */
  async createChat(userChannelId: string, message: string, time: Date) {
    await this.prisma.chat.create({
      data: {
        userChannelId: userChannelId,
        message: message,
        time: time
      }
    });
  }

  async updateLastChatTime(userChannelId: string, lastTime: Date) {
    await this.prisma.userChannel.update({
      where: {
        userChannelId: userChannelId
      },
      data: {
        lastChatTime: lastTime
      }
    });
  }
}
