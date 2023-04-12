import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FriendsModule } from './friends/friends.module';
import { GamesModule } from './games/games.module';
import { ChannelsModule } from './channels/channels.module';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    FriendsModule,
    GamesModule,
    ChannelsModule,
    AccountModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
