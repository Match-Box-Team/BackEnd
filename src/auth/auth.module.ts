import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repository/auth.repository';
import { PrismaService } from 'prisma/prisma.service';
import { JwtUtil } from './jwt/jwt.util';
// import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, PrismaService, JwtUtil],
})
export class AuthModule {}
