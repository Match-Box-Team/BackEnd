export interface GamesType {
  gameId: string;
  name: string;
  price: number;
  isPlayable: boolean;
  isBuy: boolean;
}

export interface GameIdType {
  gameId: string;
}

export interface UserIdType {
  userId: string;
}

export interface GameWatchesType {
  gameId: string;
  gameName: string;
  matches: {
    gameWatchId: string;
    currentViewer: number;
    user1: {
      userId: string;
      nickname: string;
      image: string;
    };
    user2: {
      userId: string;
      nickname: string;
      image: string;
    };
  }[];
}

export interface UserProfile {
  userId: string;
  nickname: string;
  image: string;
}
