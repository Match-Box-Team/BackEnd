import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PrismaService } from 'prisma/prisma.service';
import { GamesRepository } from './repository/games.repository';
import { GameEventsGateway } from './events/game.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [GamesController],
  providers: [
    GamesService,
    PrismaService,
    GamesRepository,
    GameEventsGateway,
    JwtService,
  ],
})
export class GamesModule {}
