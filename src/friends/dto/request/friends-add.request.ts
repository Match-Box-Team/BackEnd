
import { IsNotEmpty } from "class-validator";

// 예시
export class FriendsAddRequest {
    @IsNotEmpty()
    user_id: "UUID";
}