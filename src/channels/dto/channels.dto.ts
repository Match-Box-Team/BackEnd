import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChannelCreateDto {
  @IsString()
  channelName: string;
  
  @IsString()
  password: string;

  @IsBoolean()
  isPublic: boolean;
}

export class ChannelPasswordDto {
  @IsString()
  password: string;
}

export class ChannelInviteDto {
  @IsString()
  userId: string;
}