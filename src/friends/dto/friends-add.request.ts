import { IsNotEmpty } from 'class-validator';

export class FriendsAddDto {
  @IsNotEmpty()
  userId: string;
}
