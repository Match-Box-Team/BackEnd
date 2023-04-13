interface UserChannelOne {
    userChannelId: string,
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

interface FindPublicChannels {
    channelId: string,
    channelName: string
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