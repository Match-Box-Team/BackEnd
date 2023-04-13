interface UserOne {
    user: {
        userId: string;
        nickname: string;
        image: string;
    }
}

interface ChatLog {
    channel: {
        channelId: string;
        channelName: string;
    },
    chat: {
        chatId: string;
        message: string;
        time: Date;
        userChannel: {
            isAdmin: boolean;
            isMute: boolean;
            user: {
                userId: string;
                nickname: string;
                image: string;
            };
        };
    }[]
}

interface PublicChannels {
    channel: {
        channelId: string;
        channelName: string;
    }[]
}