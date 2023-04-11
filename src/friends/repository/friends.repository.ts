import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FriendsRepository {
  constructor(private prisma: PrismaService) {}

  /* 쿼리 작성 */
}
