import { Controller, Get, Param, Post } from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get('')
  async getPublicList() {
    return await this.channelsService.getPublicList();
  }

  @Get('/:channelId')
  async getChatLog(@Param('channelId') channelId: string) {
    return await this.channelsService.getChatLog(channelId);
  }
}
