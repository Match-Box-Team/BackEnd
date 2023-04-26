export interface UserEmail {
  email: string;
}

export interface IntraId {
  intraId: string;
}

export interface UserInfo {
  userId: string;
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
      winCount: number;
      loseCount: number;
    };
  }[];
}
