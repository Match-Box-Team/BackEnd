import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelCreateDto, ChannelInviteDto, ChannelPasswordDto } from './dto/channels.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get('')
  async getPublicList() {
    return await this.channelsService.getPublicList();
  }

  @Get('/my')
  async getMyChannelList() {
    return await this.channelsService.getMyChannelList();
  }

  @Post('')
  async createChannel(@Body() dto: ChannelCreateDto) {
    await this.channelsService.createChannel(dto);
  }

  @Post('/:channelId/join')
  async joinChannel(@Param('channelId') channelId: string, @Body() dto: ChannelPasswordDto) {
    await this.channelsService.joinChannel(channelId, dto);
  }

  @Get('/:channelId')
  async getChatLog(@Param('channelId') channelId: string) {
    return await this.channelsService.getChatLog(channelId);
  }

  @Get('/:channelId/invite')
  async searchUserForInvite(@Param('channelId') channelId: string, @Query('nickname') nickname: string) {
    return await this.channelsService.searchUserForInvite(channelId, nickname);
  }

  @Post('/:channelId/invite')
  async inviteUser(@Param('channelId') channelId: string, @Body() dto: ChannelInviteDto) {
    await this.channelsService.inviteUser(channelId, dto);
  }

  @Patch('/:channelId')
  async changeChannelPassword(@Param('channelId') channelId: string, @Body() dto: ChannelPasswordDto) {
    await this.channelsService.changeChannelPassword(channelId, dto);
  }
}