import { IsNotEmpty } from 'class-validator';

// 예시
export class FriendsAddDto {
  @IsNotEmpty()
  user_id: 'UUID';
}
