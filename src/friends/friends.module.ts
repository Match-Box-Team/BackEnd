import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './repository/friends.repository';
import { PrismaService } from 'prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [AuthModule],
  controllers: [FriendsController],
  providers: [FriendsRepository, FriendsService, PrismaService, JwtService],
})
export class FriendsModule {}
