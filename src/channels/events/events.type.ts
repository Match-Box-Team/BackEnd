interface UserOne {
  userId: string;
  nickname: string;
  image: string;
  isAdmin: boolean;
  isMute: boolean;
}

interface NewChat {
  chatId: string;
  userChannelId: string;
  message: string;
  time: Date;
}
