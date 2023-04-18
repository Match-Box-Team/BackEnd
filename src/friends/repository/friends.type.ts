interface FriendsInfoData {
  friendId: string;
  buddyId: string;
  buddy: {
    nickname: string;
    image: string;
    status: string;
  };
}
