import { Injectable } from '@nestjs/common';
import { GamesRepository } from './repository/games.repository';

@Injectable()
export class GamesService {
  constructor(private repository: GamesRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */
}
