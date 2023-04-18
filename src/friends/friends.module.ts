import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './repository/friends.repository';
import { PrismaService } from 'prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from 'src/account/account.service';
import { AccountRepository } from 'src/account/repository/account.repository';
import { GamesService } from 'src/games/games.service';
import { GamesRepository } from 'src/games/repository/games.repository';

@Module({
  imports: [AuthModule],
  controllers: [FriendsController],
  providers: [
    FriendsRepository,
    FriendsService,
    PrismaService,
    JwtService,
    AccountService,
    AccountRepository,
    GamesService,
    GamesRepository,
  ],
})
export class FriendsModule {}
