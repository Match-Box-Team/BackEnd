import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaService } from 'prisma/prisma.service';
import { AccountRepository } from './repository/account.repository';
import { AccountEventsGateway } from './events/account.gateway';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from 'src/games/games.service';
import { GamesRepository } from 'src/games/repository/games.repository';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'assets/images'),
    }),
  ],
  controllers: [AccountController],
  providers: [
    AccountService,
    PrismaService,
    AccountRepository,
    AccountEventsGateway,
    JwtService,
    GamesRepository,
    GamesService,
  ],
  exports: [AccountService],
})
export class AccountModule {}
