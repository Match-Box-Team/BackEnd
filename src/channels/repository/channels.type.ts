interface UserChannelOne {
    userChannelId: string,
    isOwner: boolean,
    isMute: boolean,
    channel: {
        channelId: string,
        channelName: string,
        isDm: boolean,
        count: number
    },
    user: {
        userId: string,
        nickname: string,
        image: string,
    }
}

interface FindChatLogs {
    chatId: string,
    message: string,
    time: Date,
    userChannel: {
        isAdmin: boolean,
        isMute: boolean,
        user: {
            userId: string,
            nickname: string,
            image: string,
        }
    }
}

interface FindPublicChannel {
    channelId: string,
    channelName: string,
    count: number
}

interface FindUsersInChannel {
    userChannelId: string,
    isAdmin: boolean,
    user: {
        userId: string,
        nickname: string,
        image: string
    }
}

interface FindUserChannelsWithChannel {
    userChannelId: string,
    lastChatTime: Date,
    channel: {
        channelId: string,
        channelName: string,
        isPublic: boolean,
        isDm: boolean,
        count: number
    },
    user: {
        nickname: string,
    }
}

interface CreateUserChannelData {
    isOwner: boolean,
    isAdmin: boolean,
    isMute: boolean,
    lastChatTime: Date,
    userId: string,
    channelId:string,
}

interface ChannelListArrayType {
    userChannel: FindUserChannelsWithChannel;
    user: FindUsersInChannel[];
    chat: {
        computedChatCount: number;
        time: Date;
    };
}

interface CreateChannelData {
    channelName: string,
    password: string,
    count: number,
    isPublic: boolean,
    isDm: boolean
}

interface UserToken {
    id: string
  }