import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelsRepository } from './repository/channels.repository';
import {
  ChannelCreateDto,
  ChannelInviteDto,
  ChannelPasswordDto,
  DmDto,
} from './dto/channels.dto';
import { Channel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class ChannelsService {
  constructor(
    private repository: ChannelsRepository,
    private accountService: AccountService,
  ) {}

  async getPublicList(userId: string) {
    const channels = await this.repository.findChannelsByPublic(userId);
    channels
      .sort((res1: FindPublicChannel, res2: FindPublicChannel): number => {
        return res1.count - res2.count;
      })
      .reverse();
    return { channel: channels };
  }

  async getMyChannelList(userId: string) {
    const userChannels = await this.repository.findUserChannelsWithChannel(
      userId,
    );
    const result = await Promise.all(
      userChannels.map(async (userChannel) => {
        const users = await this.repository.findUsersInChannel(
          userChannel.channel.channelId,
        );
        const chats = await this.repository.findChatsByChannelId(
          userChannel.channel.channelId,
        );
        let notReadCount = 0;
        let lastMessageTime: Date = userChannel.lastChatTime;

        if (chats.length !== 0) {
          chats.map((chat) => {
            if (chat.time > userChannel.lastChatTime) {
              notReadCount++;
            }
          });
          lastMessageTime = chats.at(0).time;
        }

        if (userChannel.channel.isDm) {
          const slash: number = userChannel.channel.channelName.indexOf('/');
          const nickname1: string = userChannel.channel.channelName.substring(
            0,
            slash,
          );
          const nickname2: string = userChannel.channel.channelName.substring(
            slash + 1,
          );

          if (nickname1 === userChannel.user.nickname) {
            userChannel.channel.channelName = nickname2;
          } else {
            userChannel.channel.channelName = nickname1;
          }
        }
        users.map((user) => {
          user.userChannelId = undefined;
          user.isAdmin = undefined;
        });
        userChannel.user = undefined;
        userChannel.lastChatTime = undefined;
        return {
          userChannel: userChannel,
          user: users.slice(0, 2),
          chat: {
            computedChatCount: notReadCount,
            time: lastMessageTime,
          },
        };
      }),
    );
    result
      .sort(
        (res1: ChannelListArrayType, res2: ChannelListArrayType): number => {
          return (
            new Date(res1.chat.time).getTime() -
            new Date(res2.chat.time).getTime()
          );
        },
      )
      .reverse();
    return { channel: result };
  }

  async createChannel(userId: string, dto: ChannelCreateDto) {
    if (dto.password === '') {
      dto.password = null;
    } else {
      // password 암호화
      dto.password = await this.encryptPassword(dto.password);
    }
    const newChannelData: CreateChannelData = {
      channelName: dto.channelName,
      password: dto.password,
      count: 1,
      isPublic: dto.isPublic,
      isDm: false,
    };
    const newChannel = await this.repository.createChannel(newChannelData);
    const userChannelData: CreateUserChannelData = {
      isOwner: true,
      isAdmin: true,
      isMute: false,
      lastChatTime: new Date(),
      userId: userId,
      channelId: newChannel.channelId,
    };
    await this.repository.createUserChannel(userChannelData);
  }

  async joinChannel(
    userId: string,
    channelId: string,
    dto: ChannelPasswordDto,
  ) {
    const channel = await this.validateChannel(channelId);
    const userChannel = await this.validateUserChannelNoThrow(
      userId,
      channel.channelId,
    );
    if (channel.isDm) {
      throw new ForbiddenException('This channel is for dm');
    }
    if (userChannel !== null) {
      throw new ConflictException('Already joined');
    }
    // password 복호화
    if (
      channel.password !== null &&
      !(await this.decryptPassword(dto.password, channel.password))
    ) {
      throw new BadRequestException('wrong password');
    }
    const userChannelData: CreateUserChannelData = {
      isOwner: false,
      isAdmin: false,
      isMute: false,
      lastChatTime: new Date(),
      userId: userId,
      channelId: channel.channelId,
    };
    await this.repository.createUserChannel(userChannelData);
    await this.repository.updateChannelCount(channel.channelId);
  }

  async getChatLog(userId: string, channelId: string) {
    const userChannel = await this.validateUserChannel(userId, channelId);
    const chats = await this.repository.findChatLogs(
      userChannel.channel.channelId,
    );
    userChannel.channel.isDm = undefined;
    userChannel.channel.count = undefined;
    return {
      channel: userChannel.channel,
      chat: chats,
    };
  }

  async searchUserForInvite(
    userId: string,
    channelId: string,
    nickname: string,
  ) {
    const userChannel = await this.validateUserChannel(userId, channelId);
    const user = await this.accountService.getUserByNickname(nickname);
    if (user === null) {
      throw new NotFoundException('Not existed user');
    }
    if (user.userId === userId) {
      throw new NotFoundException('Input nickname is my nickname');
    }
    const isOnChannel =
      (await this.validateUserChannelNoThrow(user.userId, channelId)) === null
        ? false
        : true;
    return {
      userId: user.userId,
      nickname: user.nickname,
      image: user.image,
      isOnChannel: isOnChannel,
    };
  }

  // 일반 유저도 다른 유저 초대 가능
  async inviteUser(userId: string, channelId: string, dto: ChannelInviteDto) {
    if (userId === dto.userId) {
      throw new NotFoundException('Input userId is my userId');
    }
    const user = await this.accountService.getUser(dto.userId);
    if (user === null) {
      throw new NotFoundException('Not existed user');
    }
    const userChannel = await this.validateUserChannel(userId, channelId);
    if (userChannel.channel.isDm) {
      throw new ForbiddenException('This channel is for dm');
    }
    if (
      (await this.validateUserChannelNoThrow(user.userId, channelId)) !== null
    ) {
      throw new ConflictException('Already joined');
    }
    const userChannelData: CreateUserChannelData = {
      isOwner: false,
      isAdmin: false,
      isMute: false,
      lastChatTime: new Date(),
      userId: user.userId,
      channelId: channelId,
    };
    await this.repository.createUserChannel(userChannelData);
    await this.repository.updateChannelCount(channelId);
  }

  async changeChannelPassword(
    userId: string,
    channelId: string,
    dto: ChannelPasswordDto,
  ) {
    // 오너만 비밀번호 변경 가능
    const userChannel = await this.validateUserChannel(userId, channelId);
    if (!userChannel.isOwner) {
      throw new ForbiddenException('Not a owner');
    }
    // 비밀번호 암호화
    if (dto.password === '') {
      dto.password = null;
    } else {
      dto.password = await this.encryptPassword(dto.password);
    }
    await this.repository.updateChannelPassword(channelId, dto.password);
  }

  async enterDm(userId: string, dto: DmDto) {
    if (userId === dto.buddyId) {
      throw new NotFoundException('Input buddyId is my userId');
    }
    const me = await this.accountService.getUser(userId);
    const buddy = await this.accountService.getUser(dto.buddyId);
    if (buddy === null) {
      throw new NotFoundException('Not existed buddy');
    }
    const meBuddy = me.nickname + '/' + buddy.nickname;
    const buddyMe = buddy.nickname + '/' + me.nickname;
    let channel: Channel = await this.repository.findDmChannelByChannelName(
      meBuddy,
      buddyMe,
    );
    console.log(channel);
    if (channel === null) {
      // 새로 만들 떄 친구와 본인 둘 다 userChannel에 넣기
      const newChannelData: CreateChannelData = {
        channelName: meBuddy,
        password: null,
        count: 2,
        isPublic: false,
        isDm: true,
      };
      channel = await this.repository.createChannel(newChannelData);
      const myUserChannelData: CreateUserChannelData = {
        isOwner: false,
        isAdmin: false,
        isMute: false,
        lastChatTime: new Date(),
        userId: me.userId,
        channelId: channel.channelId,
      };
      const buddyUserChannelData: CreateUserChannelData = {
        isOwner: false,
        isAdmin: false,
        isMute: false,
        lastChatTime: new Date(),
        userId: buddy.userId,
        channelId: channel.channelId,
      };
      await this.repository.createUserChannel(myUserChannelData);
      await this.repository.createUserChannel(buddyUserChannelData);
    }
    return {
      channel: {
        channelId: channel.channelId,
        channelName: buddy.nickname,
        isPublic: channel.isPublic,
        isDm: channel.isDm,
        count: channel.count,
      },
    };
  }

  async setUserMute(
    reqId: string,
    channelId: string,
    userId: string,
    isMute: boolean,
  ): Promise<UserChannelOne> {
    const userChannel = await this.validateUserChannel(reqId, channelId);
    if (userChannel === null) {
      throw new NotFoundException('not joined channel');
    }
    if (userChannel.isAdmin === false) {
      throw new ForbiddenException('not admin user');
    }

    const userChannel2 = await this.validateUserChannel(userId, channelId);
    if (userChannel2 === null) {
      throw new NotFoundException('no such user');
    }
    if (userChannel2.isOwner === true) {
      throw new ForbiddenException('cannot mute owner');
    }

    await this.repository.setUserMute(userId, channelId, isMute);
    return userChannel;
  }

  async setAdmin(reqId: string, userId: string, channelId: string) {
    const userChannel = await this.validateUserChannel(reqId, channelId);
    if (userChannel.isOwner === false) {
      throw new ForbiddenException('not channel owner');
    }
    const adminCandiadate = await this.validateUserChannel(userId, channelId);
    if (adminCandiadate.isAdmin === true) {
      throw new ForbiddenException('already admin');
    }
    await this.repository.setAdmin(userId, channelId, true);
  }

  async memberListInChannel(userId: string, channelId: string) {
    const userChannel = await this.validateUserChannel(userId, channelId);
    const memberList = await this.repository.findUsersInChannel(channelId);
    const result = await Promise.all(
      memberList.map(async (member) => {
        let isFriend = false;

        if (
          await this.repository.findFriendByUserIdAndBuddyId(userId, channelId)
        ) {
          isFriend = true;
        }
        return {
          isAdmin: member.isAdmin,
          user: member.user,
          isFriend: isFriend,
        };
      }),
    );
    return { userChannel: result };
  }

  async goOutChannel(userId: string, channelId: string) {
    const userChannel = await this.validateUserChannel(userId, channelId);

    if (userChannel.channel.count === 1) {
      // 만약 나가는 사람이 마지막 사람이라면 채널 삭제
      await this.repository.deleteChannel(channelId);
    } else {
      if (userChannel.isOwner) {
        const users = await this.repository.findUsersInChannel(channelId);
        let userChannelId: string | null = null;
        const admin = users.find(
          (user) => user.isAdmin === true && user.user.userId !== userId,
        );

        if (admin !== undefined) {
          // 나가는 사람이 오너이면 오너 직책을 관리자에게 넘겨주고
          userChannelId = admin.userChannelId;
        } else {
          // 만약 관리자가 없으며 그냥 아무한테 넘겨주고
          const normal = users.find((user) => user.isAdmin === false);
          userChannelId = normal.userChannelId;
        }
        await this.repository.updateOwner(userChannelId);
        await this.repository.deleteUserChannel(userChannel.userChannelId);
        await this.repository.removeUserCountInChannel(channelId);
      } else {
        // 그게 아니면 그냥 나가고
        await this.repository.deleteUserChannel(userChannel.userChannelId);
        await this.repository.removeUserCountInChannel(channelId);
      }
    }
  }

  async kickUser(
    userId: string,
    targetId: string,
    channelId: string,
  ): Promise<UserChannelOne> {
    const userChannel = await this.validateUserChannel(userId, channelId);
    const targetChannel = await this.validateUserChannel(targetId, channelId);

    // 관리자나 오너인지 확인
    if (userChannel.isOwner !== true && userChannel.isAdmin !== true) {
      throw new BadRequestException('사용자가 오너이거나 관리자가 아닙니다');
    }

    // 킥하려는 대상이 운영자일 때 예외처리
    if (targetChannel.isOwner === true && userId != targetId) {
      throw new BadRequestException('오너를 쫒아낼 수 없습니다');
    }

    // 한 명 밖에 안 남았을 땐 채널 삭제
    if (userChannel.channel.count === 1) {
      await this.repository.deleteChannel(channelId);
      return;
    }

    // 오너일 경우 다른 사람에게 오너를 부여
    if (targetChannel.isOwner === true) {
      const users = await this.repository.findUsersInChannel(channelId);
      let userChannelId: string | null = null;
      const admin = users.find(
        (user) => user.isAdmin === true && user.user.userId !== targetId,
      );

      if (admin !== undefined) {
        // 오너 직책을 관리자에게 넘겨주고
        userChannelId = admin.userChannelId;
      } else {
        // 만약 관리자가 없으며 그냥 아무한테 넘겨주고
        const normal = users.find((user) => user.isAdmin === false);
        userChannelId = normal.userChannelId;
      }

      await this.repository.updateOwner(userChannelId);
    }

    await this.repository.deleteUserChannel(targetChannel.userChannelId);
    await this.repository.removeUserCountInChannel(channelId);
  }

  /**
   * 소켓에서 사용하는 메소드
   */

  async sendMessage(
    userChannel: UserChannelOne,
    message: string,
    time: Date,
  ): Promise<UserOne> {
    await this.repository.createChat(userChannel.userChannelId, message, time);
    return {
      user: userChannel.user,
    };
  }

  async updateLastViewTime(userChannelId: string) {
    const lastTime = new Date();
    await this.repository.updateLastChatTime(userChannelId, lastTime);
  }

  async isBanBuddyInDm(
    userId: string,
    channelId: string,
    myUserChannelId: string,
  ): Promise<string | null> {
    const buddy = await this.repository.findBuddyInfoByChannelId(
      channelId,
      myUserChannelId,
    );
    if (buddy === null) {
      return 'wrong data';
    }
    const banEachother = await this.repository.findBanEachOtherByBuddyId(
      userId,
      buddy.user.userId,
    );
    if (banEachother.length > 0) {
      let banFriend = false;
      banEachother.map((ban) => {
        if (ban.myId === userId) {
          banFriend = true;
        }
      });
      if (banFriend) {
        return 'you ban friend';
      }
      return 'friend ban you';
    }
    return null;
  }

  /**
   * validation(검증) 메소드
   */
  async validateUserChannel(
    userId: string,
    channelId: string,
  ): Promise<UserChannelOne> {
    const userChannel = await this.repository.findOneUserChannel(
      userId,
      channelId,
    );
    if (userChannel === null) {
      throw new NotFoundException('User is not existed channel');
    }
    return userChannel;
  }

  async validateUserChannelNoThrow(
    userId: string,
    channelId: string,
  ): Promise<UserChannelOne | null> {
    const userChannel = await this.repository.findOneUserChannel(
      userId,
      channelId,
    );
    return userChannel;
  }

  async validateChannel(channelId: string): Promise<Channel> {
    const channel = await this.repository.findChannelByChannelId(channelId);
    if (channel === null) {
      throw new NotFoundException('Not existed channel');
    }
    return channel;
  }

  /**
   * 그 외의 메소드
   */
  private async encryptPassword(password: string): Promise<string> {
    const encrypt = await bcrypt.hash(password, 10);
    return encrypt;
  }

  private async decryptPassword(
    plainPassword: string,
    hasedPassword: string,
  ): Promise<boolean> {
    const isSame = await bcrypt.compare(plainPassword, hasedPassword);
    return isSame;
  }
}
