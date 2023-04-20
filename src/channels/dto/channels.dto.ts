import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class ChannelCreateDto {
  @IsString()
  @IsNotEmpty()
  channelName: string;

  @IsString()
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  isPublic: boolean;
}

export class ChannelPasswordDto {
  @IsString()
  password: string;
}

export class ChannelInviteDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

export class DmDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  buddyId: string;
}
