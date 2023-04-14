import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PrismaService } from 'prisma/prisma.service';
import { GamesRepository } from './repository/games.repository';
import { GameEventsGateway } from './events/game.gateway';
import { AccountService } from 'src/account/account.service';
import { AccountRepository } from 'src/account/repository/account.repository';

@Module({
  controllers: [GamesController],
  providers: [
    GamesService,
    PrismaService,
    AccountService,
    AccountRepository,
    GamesRepository,
    GameEventsGateway,
  ],
})
export class GamesModule {}
