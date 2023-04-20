export interface FriendsInfoData {
  friendId: string;
  buddyId: string;
  buddy: {
    nickname: string;
    image: string;
    status: string;
  };
}

export interface FriendUserInfo {
  nickname: string;
  intraId: string;
  image: string;
}
