import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaService } from 'prisma/prisma.service';
import { AccountRepository } from './repository/account.repository';
import { AccountEventsGateway } from './events/account.gateway';

@Module({
  controllers: [AccountController],
  providers: [
    AccountService,
    PrismaService,
    AccountRepository,
    AccountEventsGateway,
  ],
  exports: [AccountService],
})
export class AccountModule {}
