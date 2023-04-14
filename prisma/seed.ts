import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      userId: uuidv4(),
      nickname: 'jinho',
      status: 'game',
      email: uuidv4(),
      image: '127.0.0.1/image/jinho',
      intraId: uuidv4(),
      phoneNumber: '+82 10 4847 8113',
    },
    {
      userId: uuidv4(),
      nickname: 'jibang',
      status: 'game',
      email: uuidv4(),
      image: '127.0.0.1/image/jibang',
      intraId: uuidv4(),
      phoneNumber: '인트라에 안 뜸',
    },
    {
      userId: uuidv4(),
      nickname: 'jokang',
      status: 'online',
      email: uuidv4(),
      image: '127.0.0.1/image/chaekim',
      intraId: uuidv4(),
      phoneNumber: '인트라에 안 뜸',
    },
    {
      userId: uuidv4(),
      nickname: 'chaekim',
      status: 'online',
      email: uuidv4(),
      image: '127.0.0.1/image/jokang',
      intraId: uuidv4(),
      phoneNumber: '인트라에 안 뜸',
    },
  ];

  const games = [
    {
      gameId: uuidv4(),
      name: '핑퐁핑퐁',
      price: 5000,
      isPlayable: true,
    },
    {
      gameId: uuidv4(),
      name: '테트리스',
      price: 7000,
      isPlayable: false,
    },
    {
      gameId: uuidv4(),
      name: '퍼즐팡팡',
      price: 6000,
      isPlayable: false,
    },
    {
      gameId: uuidv4(),
      name: '좀비좀비',
      price: 8000,
      isPlayable: false,
    },
  ];

  const userGames = [
    {
      userGameId: uuidv4(),
      userId: users[0].userId,
      gameId: games[0].gameId,
    },
    {
      userGameId: uuidv4(),
      userId: users[1].userId,
      gameId: games[0].gameId,
    },
    {
      userGameId: uuidv4(),
      userId: users[2].userId,
      gameId: games[0].gameId,
    },
    {
      userGameId: uuidv4(),
      userId: users[3].userId,
      gameId: games[0].gameId,
    },
  ];

  const gameWatches = [
    {
      currentViewer: 2,
      score1: 0,
      score2: 0,
      userGameId1: userGames[0].userGameId,
      userGameId2: userGames[1].userGameId,
    },
    {
      currentViewer: 2,
      score1: 10,
      score2: 5,
      userGameId1: userGames[2].userGameId,
      userGameId2: userGames[3].userGameId,
    },
  ];

  const gameHistories = [
    {
      winnerUserGameId: userGames[0].userGameId,
      loserUserGameId: userGames[1].userGameId,
    },
    {
      winnerUserGameId: userGames[1].userGameId,
      loserUserGameId: userGames[0].userGameId,
    },
  ];

  const friends = [
    {
      isBan: false,
      myId: users[0].userId,
      buddyId: users[1].userId,
    },
    {
      isBan: false,
      myId: users[1].userId,
      buddyId: users[2].userId,
    },
    {
      isBan: true,
      myId: users[1].userId,
      buddyId: users[3].userId,
    },
    {
      isBan: false,
      myId: users[2].userId,
      buddyId: users[3].userId,
    },
    {
      isBan: false,
      myId: users[3].userId,
      buddyId: users[2].userId,
    },
  ];

  const channels = [
    {
      channelId: uuidv4(),
      channelName: '_announcement 공개방',
      password: '',
      count: 1000,
      isPublic: true,
      isDm: false,
    },
    {
      channelId: uuidv4(),
      channelName: '_announcement 비밀방',
      password: 'abcd1234',
      count: 100,
      isPublic: false,
      isDm: false,
    },
    {
      channelId: uuidv4(),
      channelName: 'matchbox 회의방',
      password: '',
      count: 200,
      isPublic: true,
      isDm: false,
    },
    {
      channelId: uuidv4(),
      channelName: 'unknown과의 개인 채팅',
      password: '',
      count: 50,
      isPublic: false,
      isDm: true,
    },
  ];

  const userChannels = [
    {
      userChannelId: uuidv4(),
      isOwner: true,
      isAdmin: true,
      isMute: false,
      userId: users[0].userId,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: uuidv4(),
      isOwner: false,
      isAdmin: true,
      isMute: false,
      userId: users[1].userId,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: uuidv4(),
      isOwner: false,
      isAdmin: false,
      isMute: true,
      userId: users[2].userId,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: uuidv4(),
      isOwner: false,
      isAdmin: false,
      isMute: false,
      userId: users[2].userId,
      channelId: channels[3].channelId,
    },
    {
      userChannelId: uuidv4(),
      isOwner: false,
      isAdmin: false,
      isMute: false,
      userId: users[3].userId,
      channelId: channels[3].channelId,
    },
  ];

  const chats = [
    {
      message: 'Jinho: Hello, Jibang!',
      userChannelId: userChannels[0].userChannelId,
    },
    {
      message: 'Jibang: Hello, Jinho!',
      userChannelId: userChannels[0].userChannelId,
    },
    {
      message: 'jinho: 헤헤헤 된다',
      userChannelId: userChannels[0].userChannelId,
    },
    {
      message: 'Chaekim: Hello, Jokang!',
      userChannelId: userChannels[3].userChannelId,
    },
    {
      message: 'Jokang: Hello, Chaekim!',
      userChannelId: userChannels[3].userChannelId,
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  for (const game of games) {
    await prisma.game.create({
      data: game,
    });
  }

  for (const userGame of userGames) {
    await prisma.userGame.create({
      data: userGame,
    });
  }

  for (const gameWatch of gameWatches) {
    await prisma.gameWatch.create({
      data: gameWatch,
    });
  }

  for (const friend of friends) {
    await prisma.friend.create({
      data: friend,
    });
  }

  for (const channel of channels) {
    await prisma.channel.create({
      data: channel,
    });
  }

  for (const userChannel of userChannels) {
    await prisma.userChannel.create({
      data: userChannel,
    });
  }

  for (const chat of chats) {
    await prisma.chat.create({
      data: chat,
    });
  }

  for (const gameHistory of gameHistories) {
    await prisma.gameHistory.create({
      data: gameHistory,
    });
  }

  console.log('Seed data successfully created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
