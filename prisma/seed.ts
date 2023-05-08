import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      userId: uuidv4(),
      nickname: 'jinhokim1',
      status: 'game',
      email: 'jinhokim@student.42seoul.kr',
      image: '127.0.0.1/image/jinho',
      intraId: 'jinhokim',
      phoneNumber: '+82 10 4847 8113',
    },
    {
      userId: uuidv4(),
      nickname: 'jibang1',
      status: 'game',
      email: 'jibang@student.42seoul.kr',
      image: '127.0.0.1/image/jibang',
      intraId: 'jibang',
      phoneNumber: '인트라에 안 뜸',
    },
    {
      userId: uuidv4(),
      nickname: 'jokang1',
      status: 'online',
      email: 'jokang@student.42seoul.kr',
      image: '127.0.0.1/image/jokang',
      intraId: 'jokang',
      phoneNumber: '인트라에 안 뜸',
    },
    {
      userId: uuidv4(),
      nickname: 'chaekim1',
      status: 'offline',
      email: 'chaekim@student.42seoul.kr',
      image: '127.0.0.1/image/chaekim1',
      intraId: 'chaekim',
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

  // const gameWatches = [
  //   {
  //     currentViewer: 2,
  //     userGameId1: userGames[0].userGameId,
  //     userGameId2: userGames[1].userGameId,
  //   },
  //   {
  //     currentViewer: 2,
  //     userGameId1: userGames[2].userGameId,
  //     userGameId2: userGames[3].userGameId,
  //   },
  // ];

  const gameHistories = [
    {
      winnerUserGameId: userGames[0].userGameId,
      loserUserGameId: userGames[1].userGameId,
      winnerScore: 11,
      loserScore: 5,
    },
    {
      winnerUserGameId: userGames[2].userGameId,
      loserUserGameId: userGames[3].userGameId,
      winnerScore: 11,
      loserScore: 7,
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
      password: null,
      count: 1000,
      isPublic: true,
      isDm: false,
    },
    {
      channelId: uuidv4(),
      channelName: '_announcement 비밀방',
      password: null,
      count: 100,
      isPublic: false,
      isDm: false,
    },
    {
      channelId: uuidv4(),
      channelName: 'matchbox 회의방',
      password: null,
      count: 200,
      isPublic: true,
      isDm: false,
    },
    {
      channelId: uuidv4(),
      channelName: 'unknown과의 개인 채팅',
      password: null,
      count: 50,
      isPublic: false,
      isDm: false,
    },
  ];

  const userChannels = [
    // channel 0
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
    // channel 1
    {
      userChannelId: uuidv4(),
      isOwner: true,
      isAdmin: true,
      isMute: false,
      userId: users[1].userId,
      channelId: channels[1].channelId,
    },
    {
      userChannelId: uuidv4(),
      isOwner: true,
      isAdmin: true,
      isMute: false,
      userId: users[2].userId,
      channelId: channels[1].channelId,
    },
    // channel 2
    {
      userChannelId: uuidv4(),
      isOwner: true,
      isAdmin: true,
      isMute: false,
      userId: users[3].userId,
      channelId: channels[2].channelId,
    },
    {
      userChannelId: uuidv4(),
      isOwner: false,
      isAdmin: false,
      isMute: false,
      userId: users[1].userId,
      channelId: channels[2].channelId,
    },
    // channel 3
    {
      userChannelId: uuidv4(),
      isOwner: true,
      isAdmin: true,
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
    // fake message
    {
      userChannelId: userChannels[0].userChannelId,
      message: 'Fake Message',
      nickname: users[0].nickname,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: userChannels[3].userChannelId,
      message: 'Fake Message',
      nickname: users[1].nickname,
      channelId: channels[1].channelId,
    },
    {
      userChannelId: userChannels[5].userChannelId,
      message: 'Fake Message',
      nickname: users[3].nickname,
      channelId: channels[2].channelId,
    },
    {
      userChannelId: userChannels[7].userChannelId,
      message: 'Fake Message',
      nickname: users[2].nickname,
      channelId: channels[3].channelId,
    },

    // normal message
    {
      userChannelId: userChannels[0].userChannelId,
      message: 'Jinho: Hello, Jibang!',
      nickname: users[0].nickname,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: userChannels[0].userChannelId,
      message: 'Jinho: Hello, Jibang!',
      nickname: users[0].nickname,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: userChannels[0].userChannelId,
      message: 'Jibang: Hello, Jinho!',
      nickname: users[0].nickname,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: userChannels[0].userChannelId,
      message: 'jinho: 헤헤헤 된다',
      nickname: users[0].nickname,
      channelId: channels[0].channelId,
    },
    {
      userChannelId: userChannels[7].userChannelId,
      message: 'Chaekim: Hello, Jokang!',
      nickname: users[2].nickname,
      channelId: channels[3].channelId,
    },
    {
      userChannelId: userChannels[7].userChannelId,
      message: 'Jokang: Hello, Chaekim!',
      nickname: users[2].nickname,
      channelId: channels[3].channelId,
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

  // for (const gameWatch of gameWatches) {
  //   await prisma.gameWatch.create({
  //     data: gameWatch,
  //   });
  // }

  for (const gameHistory of gameHistories) {
    await prisma.gameHistory.create({
      data: gameHistory,
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

  // fake message
  for (let i = 0; i < 4; i++) {
    await prisma.chat.create({
      data: chats[i],
    });
  }

  for (const userChannel of userChannels) {
    await prisma.userChannel.update({
      where: {
        userChannelId: userChannel.userChannelId,
      },
      data: {
        lastChatTime: new Date(),
      },
    });
  }

  for (let i = 4; i < 10; i++) {
    await prisma.chat.create({
      data: chats[i],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
