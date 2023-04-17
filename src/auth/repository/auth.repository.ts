import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OAuthUserInfoDto } from '../dto';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateUser(profile: OAuthUserInfoDto): Promise<void> {
    try {
      await this.prisma.user.upsert({
        where: {
          email: profile.email,
        },
        update: {
          email: profile.email,
          phoneNumber: profile.phoneNumber,
          status: 'online',
        },
        create: {
          email: profile.email,
          image: profile.image,
          intraId: profile.intraId,
          phoneNumber: profile.phoneNumber,
          nickname: profile.intraId,
          status: 'online',
        },
      });
    } catch (error) {
      throw new ConflictException('로그인 실패');
    }
  }
}
