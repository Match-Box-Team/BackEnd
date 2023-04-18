export interface UserEmail {
  email: string;
}

export interface UserInfo {
  nickname: string;
  intraId: string;
  image: string;
  phoneNumber: string;
  email: string;
}

export interface MyPage {
  user: UserInfo;
  userGame: {
    game: {
      gameId: string;
      name: string;
    };
    gameHistory: {
      wincounts: number;
      losecounts: number;
    };
  }[];
}
