import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FriendsRepository {
    constructor(private prisma: PrismaService) {}

    /* 쿼리 작성
    async findFriendById(friendId: number) {
        return await this.prisma.friends.findUnique({
            where: {
                id: friendId,
            }
        })
    }
    */
}