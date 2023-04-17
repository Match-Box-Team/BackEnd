import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repository/auth.repository';
import { PrismaService } from 'prisma/prisma.service';
import { JwtUtil } from './jwt/jwt.util';
// import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import * as path from 'path';
import { AccountService } from 'src/account/account.service';
import { AccountRepository } from 'src/account/repository/account.repository';

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
        dir: path.join(process.cwd(), 'src/auth/templates'),
        adapter: new EjsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PrismaService,
    JwtUtil,
    AccountService,
    AccountRepository,
  ],
})
export class AuthModule {}
