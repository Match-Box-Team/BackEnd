import { Injectable } from '@nestjs/common';
import { Channel, Chat, User, UserChannel } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ChannelCreateDto } from '../dto/channels.dto';

@Injectable()
export class ChannelsRepository {
  constructor(private prisma: PrismaService) {}

  // 쿼리 작성
  async findChannelsByPublic(): Promise<Channel[]> {
    return this.prisma.channel.findMany({
      where: {
        isPublic: true,
        isDm: false
      }
    });
  }

  async findUserChannelsWithChannel(userId: string): Promise<FindUserChannelsWithChannel[]> {
    return this.prisma.userChannel.findMany({
      where: {
        userId: userId
      },
      select: {
        userChannelId: true,
        lastChatTime: true,
        channel: {
          select: {
            channelId: true,
            channelName: true,
            isPublic: true,
            isDm: true,
            count: true
          }
        }
      }
    });
  }

  async findUsersInChannel(channelId: string): Promise<FindUsersInChannel[]> {
    return await this.prisma.userChannel.findMany({
      where: {
        channelId: channelId
      },
      select: {
        user: {
          select: {
            nickname: true,
            image: true
          }
        }
      }
    });
  }

  async findChatsByChannelId(channelId: string): Promise<Chat[]> {
    return await this.prisma.chat.findMany({
      where: {
        userChannel: {
          channelId: channelId
        },
      },
      orderBy: [{
        time: 'desc'
      }]
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
        isMute: true,
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

  async findChannelByChannelId(channelId: string): Promise<Channel> {
    return await this.prisma.channel.findFirst({
      where: {
        channelId: channelId
      }
    });
  }

  async findUserByNickname(nickname: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        nickname: nickname
      }
    });
  }

  async findUserByUserId(userId: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        userId: userId
      }
    });
  }

  /**
   * Create, Delete, Update
   */
  async createChannel(dto: ChannelCreateDto): Promise<Channel> {
    return await this.prisma.channel.create({
      data: {
        channelName: dto.channelName,
        password: dto.password,
        count: 1,
        isPublic: dto.isPublic,
        isDm: false
      }
    });
  }

  async createUserChannel(userChannelData: CreateUserChannelData) {
    await this.prisma.userChannel.create({
      data: {
        isOwner: userChannelData.isOwner,
        isAdmin: userChannelData.isAdmin,
        isMute: userChannelData.isMute,
        lastChatTime: userChannelData.lastChatTime,
        userId: userChannelData.userId,
        channelId: userChannelData.channelId
      }
    })
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

  async updateChannelCount(channelId: string) {
    await this.prisma.channel.update({
      where: {
        channelId: channelId
      },
      data: {
        count: {
          increment: 1
        }
      }
    });
  }
}
