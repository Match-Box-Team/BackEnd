interface UserOne {
  user: {
    userId: string;
    nickname: string;
    image: string;
  };
}

interface NewChat {
  chatId: string;
  userChannelId: string;
  message: string;
  time: Date;
}
