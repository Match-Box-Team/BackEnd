interface UserChannelOne {
    userChannelId: string,
    isMute: boolean,
    channel: {
        channelId: string,
        channelName: string,
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

interface FindUsersInChannel {
    user: {
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