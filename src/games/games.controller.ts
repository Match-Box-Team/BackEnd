import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { GameHistoryDto, gameIdDto, gameWatchIdDto } from './dto/games.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Request } from 'express';
import { GameId, GameType, GameWatchesType } from './repository/game.type';
import { GameHistory, GameWatch } from '@prisma/client';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  // 게임샵 페이지 - 게임 목록 조회
  @Get()
  @UseGuards(AuthGuard)
  async getGames(@Req() req: Request): Promise<GameType[]> {
    const userId = req['id']['id'];
    return await this.gamesService.getGamesByUserId(userId);
  }

  // 게임샵 페이지 - 게임 구매
  @Post(':gameId/buy')
  @UseGuards(AuthGuard)
  async buyGame(
    @Req() req: Request,
    @Param('gameId', ParseUUIDPipe) gameId: string,
  ): Promise<GameId> {
    const userId = req['id']['id'];
    return await this.gamesService.buyGame(userId, gameId);
  }

  // 관전 목록 페이지 - 게임 관전 목록 조회
  @Get(':gameId')
  @UseGuards(AuthGuard)
  async getGameWatches(
    @Param('gameId', ParseUUIDPipe) gameId: string,
  ): Promise<GameWatchesType> {
    return await this.gamesService.getGameWatches(gameId);
  }

  // 게임 종료
  @Post(':gameWatchId')
  @UseGuards(AuthGuard)
  async createGameHistory(
    @Param('gameWatchId', ParseUUIDPipe) gameWatchId: string,
    @Body() gameHistoryDto: GameHistoryDto,
  ): Promise<GameHistory> {
    return await this.gamesService.createGameHistory(
      gameWatchId,
      gameHistoryDto,
    );
  }

  @Get('gameWatch/:gameWatchId')
  @UseGuards(AuthGuard)
  async getGameWatchByGameWatchId(
    @Param('gameWatchId', ParseUUIDPipe) gameWatchId: string,
  ): Promise<GameWatch> {
    return await this.gamesService.getGameWatchByGameWatchId(gameWatchId);
  }
}
