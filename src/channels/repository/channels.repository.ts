import { Injectable } from '@nestjs/common';
import { Channel, Chat } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ChannelsRepository {
  constructor(private prisma: PrismaService) {}

  // 쿼리 작성
  async findPublicList() {
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

  async findOneUserChannel(userId: string, channelId: string) {
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

  async findChannelLogs(userChannelId: string) {
    return await this.prisma.chat.findMany({
      where: {
        userChannel: {
          userChannelId: userChannelId
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
      orderBy: {
        time: 'desc'
      }
    });
  }

  async createChat(userChannelId: string, message: string, time: Date) {
    await this.prisma.chat.create({
      data: {
        userChannelId: userChannelId,
        message: message,
        time: time
      }
    });
  }
}
