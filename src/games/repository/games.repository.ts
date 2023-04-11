import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GamesRepository {
  constructor(private prisma: PrismaService) {}

  // 쿼리 작성
}
