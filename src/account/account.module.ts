import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaService } from 'prisma/prisma.service';
import { AccountRepository } from './repository/account.repository';
import { AccountEventsGateway } from './events/account.gateway';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import * as path from 'path';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      },
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>',
      },
      template: {
        dir: path.join(process.cwd(), 'src/account/templates'),
        adapter: new EjsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
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
