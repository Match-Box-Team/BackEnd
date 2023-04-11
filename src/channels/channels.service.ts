import { Injectable } from '@nestjs/common';
import { ChannelsRepository } from './repository/channels.repository';

@Injectable()
export class ChannelsService {
  constructor(private repository: ChannelsRepository) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */
}
