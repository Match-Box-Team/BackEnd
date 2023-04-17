import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChannelCreateDto {
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  userId: string;
}

export class DmDto {
  @IsString()
  @IsNotEmpty()
  buddyId: string;
}