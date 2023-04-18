import { Injectable } from '@nestjs/common';
import { Channel, Chat, Friend, User, UserChannel } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ChannelCreateDto } from '../dto/channels.dto';

@Injectable()
export class ChannelsRepository {
  constructor(private prisma: PrismaService) {}

  async findChannelsByPublic(userId: string): Promise<FindPublicChannel[]> {
    return this.prisma.channel.findMany({
      where: {
        AND: [
          { isPublic: true },
          { isDm: false },
          {
            NOT: {
              userChannels: {
                some: { userId: userId },
              },
            },
          },
        ],
      },
      select: {
        channelId: true,
        channelName: true,
        count: true,
      },
    });
  }

  async findUserChannelsWithChannel(
    userId: string,
  ): Promise<FindUserChannelsWithChannel[]> {
    return this.prisma.userChannel.findMany({
      where: {
        userId: userId,
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
            count: true,
          },
        },
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });
  }

  async findUsersInChannel(channelId: string): Promise<FindUsersInChannel[]> {
    return await this.prisma.userChannel.findMany({
      where: {
        channelId: channelId,
      },
      select: {
        userChannelId: true,
        isAdmin: true,
        user: {
          select: {
            userId: true,
            nickname: true,
            image: true,
          },
        },
      },
    });
  }

  async findChatsByChannelId(channelId: string): Promise<Chat[]> {
    return await this.prisma.chat.findMany({
      where: {
        userChannel: {
          channelId: channelId,
        },
      },
      orderBy: [
        {
          time: 'desc',
        },
      ],
    });
  }

  async findOneUserChannel(
    userId: string,
    channelId: string,
  ): Promise<UserChannelOne> {
    return await this.prisma.userChannel.findFirst({
      where: {
        AND: [{ userId: userId }, { channelId: channelId }],
      },
      select: {
        userChannelId: true,
        isOwner: true,
        isAdmin: true,
        isMute: true,
        channel: {
          select: {
            channelId: true,
            channelName: true,
            isDm: true,
            count: true,
          },
        },
        user: {
          select: {
            userId: true,
            nickname: true,
            image: true,
          },
        },
      },
    });
  }

  async findChatLogs(channelId: string): Promise<FindChatLogs[]> {
    return await this.prisma.chat.findMany({
      where: {
        userChannel: {
          channel: {
            channelId: channelId,
          },
        },
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
              },
            },
          },
        },
      },
      orderBy: [
        {
          time: 'asc',
        },
      ],
    });
  }

  async findChannelByChannelId(channelId: string): Promise<Channel> {
    return await this.prisma.channel.findFirst({
      where: {
        channelId: channelId,
      },
    });
  }

  async findUserByNickname(nickname: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        nickname: nickname,
      },
    });
  }

  async findUserByUserId(userId: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });
  }

  async findBuddyInfoByChannelId(
    channelId: string,
    userChannelId: string,
  ): Promise<FindUsersInChannel> {
    return await this.prisma.userChannel.findFirst({
      where: {
        AND: [
          { channelId: channelId },
          { userChannelId: { not: userChannelId } },
        ],
      },
      select: {
        userChannelId: true,
        isAdmin: true,
        user: true,
      },
    });
  }

  async findBanEachOtherByBuddyId(
    userId: string,
    buddyId: string,
  ): Promise<Friend[]> {
    return await this.prisma.friend.findMany({
      where: {
        OR: [
          {
            AND: [{ myId: userId }, { buddyId: buddyId }, { isBan: true }],
          },
          {
            AND: [{ myId: buddyId }, { buddyId: userId }, { isBan: true }],
          },
        ],
      },
    });
  }

  async findFriendByUserIdAndBuddyId(
    userId: string,
    buddyId: string,
  ): Promise<Friend> {
    return await this.prisma.friend.findFirst({
      where: {
        AND: [{ myId: userId }, { buddyId: buddyId }],
      },
    });
  }

  async findDmChannelByChannelName(
    meBuddy: string,
    buddyMe: string,
  ): Promise<Channel> {
    return await this.prisma.channel.findFirst({
      where: {
        OR: [{ channelName: meBuddy }, { channelName: buddyMe }],
      },
    });
  }

  /**
   * Create, Delete, Update
   */
  async createChannel(data: CreateChannelData): Promise<Channel> {
    return await this.prisma.channel.create({
      data: {
        channelName: data.channelName,
        password: data.password,
        count: data.count,
        isPublic: data.isPublic,
        isDm: data.isDm,
      },
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
        channelId: userChannelData.channelId,
      },
    });
  }

  async createChat(userChannelId: string, message: string, time: Date) {
    await this.prisma.chat.create({
      data: {
        userChannelId: userChannelId,
        message: message,
        time: time,
      },
    });
  }

  async updateLastChatTime(userChannelId: string, lastTime: Date) {
    await this.prisma.userChannel.update({
      where: {
        userChannelId: userChannelId,
      },
      data: {
        lastChatTime: lastTime,
      },
    });
  }

  async updateChannelCount(channelId: string) {
    await this.prisma.channel.update({
      where: {
        channelId: channelId,
      },
      data: {
        count: {
          increment: 1,
        },
      },
    });
  }

  async updateChannelPassword(channelId: string, password: string) {
    await this.prisma.channel.update({
      where: {
        channelId: channelId,
      },
      data: {
        password: password,
      },
    });
  }

  async setUserMute(targetId: string, channelId: string, isMute: boolean) {
    const userChannelOne: any = await this.findOneUserChannel(
      targetId,
      channelId,
    );
    const userChannelId = userChannelOne.userChannelId;
    await this.prisma.userChannel.update({
      where: {
        userChannelId: userChannelId,
      },
      data: {
        isMute: isMute,
      },
    });
  }

  async deleteChannel(channelId: string) {
    await this.prisma.channel.delete({
      where: {
        channelId: channelId,
      },
    });
  }

  async deleteUserChannel(userChannelId: string) {
    await this.prisma.userChannel.delete({
      where: {
        userChannelId: userChannelId,
      },
    });
  }

  async updateOwner(userChannelId: string) {
    await this.prisma.userChannel.update({
      where: {
        userChannelId: userChannelId,
      },
      data: {
        isOwner: true,
        isAdmin: true,
      },
    });
  }

  async setAdmin(targetId: string, channelId: string, isAdmin: boolean) {
    const userChannelOne: UserChannelOne = await this.findOneUserChannel(
      targetId,
      channelId,
    );
    const userChannelId = userChannelOne.userChannelId;
    await this.prisma.userChannel.update({
      where: {
        userChannelId: userChannelId,
      },
      data: {
        isAdmin: isAdmin,
      },
    });
  }
}
