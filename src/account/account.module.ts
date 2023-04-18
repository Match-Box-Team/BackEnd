import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaService } from 'prisma/prisma.service';
import { AccountRepository } from './repository/account.repository';
import { AccountEventsGateway } from './events/account.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AccountController],
  providers: [
    AccountService,
    PrismaService,
    AccountRepository,
    AccountEventsGateway,
    JwtService,
  ],
  exports: [AccountService],
})
export class AccountModule {}
