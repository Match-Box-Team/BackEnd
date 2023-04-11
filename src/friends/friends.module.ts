import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './repository/friends.repository';
// import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FriendsController],
  providers: [FriendsRepository, FriendsService],
  // providers: [FriendsRepository, FriendsService,
  // {
  //   provide: PrismaService,
  //   useClass: PrismaService,
  // }]
})
export class FriendsModule {}
