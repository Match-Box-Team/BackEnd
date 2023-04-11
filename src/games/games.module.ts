import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PrismaService } from 'prisma/prisma.service';
import { GamesRepository } from './repository/games.repository';

@Module({
  controllers: [GamesController],
  providers: [GamesService, PrismaService, GamesRepository],
})
export class GamesModule {}
