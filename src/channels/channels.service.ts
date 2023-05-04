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
        // 가장 최신 채팅 시간과 안읽은 채팅 개수
        const chats = await this.repository.findChatsByChannelId(
          userChannel.channel.channelId,
        );
        let notReadCount = 0;

        let lastMessageTime: Date;
        if (chats.length !== 0) {
          lastMessageTime = chats.at(0)?.time;

          if (chats.length !== 1) {
            chats.map((chat) => {
              if (chat.time > userChannel.lastChatTime) {
                notReadCount++;
              }
            });
            lastMessageTime = chats.at(-1)?.time;
          }
        } else {
          lastMessageTime = new Date();
        }

        // 채널이 dm일 경우 상대방 이름 추출
        if (userChannel.channel.isDm === true) {
          const nicknames = userChannel.channel.channelName.split('/');
          if (nicknames[0] === userChannel.user.nickname) {
            userChannel.channel.channelName = nicknames[1];
          } else {
            userChannel.channel.channelName = nicknames[0];
          }
        }
        // 채널의 멤버 최대 2명 추출
        const users = await this.repository.findUsersInChannel(
          userChannel.channel.channelId,
        );
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
    const userChannel = await this.repository.createUserChannel(
      userChannelData,
    );
    // 채널 목록에서 각 채널의 최신 메시지 시간과 안읽은 채팅 개수를 세서 표시해준다.
    // 이때 최신 메시지 시간은 채팅 내역 중 가장 최신 채팅의 시간을 표시해준다.
    // 이렇게 할 경우, 채팅 내역이 아무것도 없을 때 last_chat_time로 대신 보여주는데,
    // 채팅방을 들어가고(소켓연결) 채팅방 나올 때(소켓 연결 끊김)마다 last_chat_time을 업데이트해주므로 적합하지 않다.
    // => 채팅방을 생성하자마자 "fake message" chat 테이블에 넣는 방법을 선택
    const user = await this.accountService.getUser(userId);
    await this.repository.createChat(
      userChannel.userChannelId,
      'Fake Message',
      new Date(),
      user.nickname,
      newChannel.channelId,
    );
    return { channelId: newChannel.channelId };
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
    await this.repository.addUserCountInChannel(channel.channelId);
  }

  async getChatLog(userId: string, channelId: string) {
    const userChannel = await this.validateUserChannel(userId, channelId);
    const chats = await this.repository.findChatLogs(
      userChannel.channel.channelId,
    );
    // 채팅방 생성 시 만든 fake message 빼고 로그 반환
    //  - 채팅방을 만들자마자 넣은 데이터이므로 가장 첫번째로 들어가있음.
    chats.shift();
    chats.map((chat) => {
      if (chat.userChannel === null) {
        chat.userChannel = {
          isAdmin: false,
          isMute: false,
          user: {
            userId: '',
            intraId: '',
            nickname: chat.nickname,
            image: '',
          },
        };
      }
    });
    userChannel.channel.count = undefined;
    if (userChannel.channel.isDm === true) {
      const nicknames = userChannel.channel.channelName.split('/');
      if (nicknames[0] === userChannel.user.nickname) {
        userChannel.channel.channelName = nicknames[1];
      } else {
        userChannel.channel.channelName = nicknames[0];
      }
    }
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
    await this.repository.addUserCountInChannel(channelId);
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
    const meBuddy = me.nickname + '/' + buddy.nickname;
    const buddyMe = buddy.nickname + '/' + me.nickname;
    let channel: Channel = await this.repository.findDmChannelByChannelName(
      meBuddy,
      buddyMe,
    );
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
      const userChannel = await this.repository.createUserChannel(
        myUserChannelData,
      );
      await this.repository.createUserChannel(buddyUserChannelData);
      await this.repository.createChat(
        userChannel.userChannelId,
        'Fake Message',
        new Date(),
        me.nickname,
        channel.channelId,
      );
    } else {
      // 이전에 dm방을 나갔다가 다시 들어간 경우
      if (
        (await this.validateUserChannelNoThrow(userId, channel.channelId)) ===
        null
      ) {
        const myUserChannelData: CreateUserChannelData = {
          isOwner: false,
          isAdmin: false,
          isMute: false,
          lastChatTime: new Date(),
          userId: me.userId,
          channelId: channel.channelId,
        };
        const userChannel = await this.repository.createUserChannel(
          myUserChannelData,
        );
      }
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
    userId: string,
    channelId: string,
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

        const friend = await this.repository.findFriendByUserIdAndBuddyId(
          userId,
          member.user.userId,
        );
        if (friend) {
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

  async getIsAdminAndIsMute(userId: string, channelId: string) {
    const userChannel = await this.validateUserChannel(userId, channelId);
    return {
      isAdmin: userChannel.isAdmin,
      isMute: userChannel.isMute,
    };
  }

  /**
   * 소켓에서 사용하는 메소드
   */

  async sendMessage(
    userChannel: UserChannelOne,
    message: string,
    time: Date,
  ): Promise<UserOne> {
    await this.repository.createChat(
      userChannel.userChannelId,
      message,
      time,
      userChannel.user.nickname,
      userChannel.channel.channelId,
    );
    return {
      userId: userChannel.user.userId,
      nickname: userChannel.user.nickname,
      image: userChannel.user.image,
      isAdmin: userChannel.isAdmin,
      isMute: userChannel.isMute,
    };
  }

  async createNewChatAndGetChatId(
    userChannelId: string,
    message: string,
    time: Date,
    nickname: string,
    channelId: string,
  ): Promise<NewChat> {
    const newChat = await this.repository.createChat(
      userChannelId,
      message,
      time,
      nickname,
      channelId,
    );
    return newChat;
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
      return null;
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
