import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaService } from 'prisma/prisma.service';
import { AccountRepository } from './repository/account.repository';

@Module({
  controllers: [AccountController],
  providers: [AccountService, PrismaService, AccountRepository],
})
export class AccountModule {}
