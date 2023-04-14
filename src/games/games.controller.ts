import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameHistoryDto, gameIdDto, gameWatchIdDto } from './dto/games.dto';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get('get')
  async get() {
    return this.gamesService.get();
  }

  // 게임샵 페이지 - 게임 목록 조회
  @Get()
  async getGames() {
    const userId = '5f7ddd7f-6082-4579-a0a5-8dc5bbb22f4c';
    return this.gamesService.getGames(userId);
  }

  // 게임샵 페이지 - 게임 구매
  @Post(':gameId/buy')
  async buyGame(@Param() gameId: gameIdDto) {
    const userId = '5f7ddd7f-6082-4579-a0a5-8dc5bbb22f4c';
    return this.gamesService.buyGame(userId, gameId.gameId);
  }

  // 관전 목록 페이지 - 게임 관전 목록 조회
  @Get(':gameId')
  async getGameWatches(@Param() gameId: gameIdDto) {
    return this.gamesService.getGameWatches(gameId.gameId);
  }

  // 게임 종료
  @Post(':gameWatchId')
  async createGameHistory(
    @Param() gameWatchId: gameWatchIdDto,
    @Body() gameHistoryDto: GameHistoryDto,
  ) {
    return this.gamesService.createGameHistory(
      gameWatchId.gameWatchId,
      gameHistoryDto,
    );
  }
}
