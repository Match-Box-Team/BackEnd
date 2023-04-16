import { Injectable } from '@nestjs/common';
import { User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AccountService {
  constructor(
    private mailService: MailerService,
    private repository: AccountRepository,
  ) {}

  /**
   * 쿼리 작성(구현)은 repository 파일에서 하고, service에서 사용
   */

  async getUsers(): Promise<User[]> {
    return this.repository.getUsers();
  }

  async getUser(userId: string): Promise<User> {
    return this.repository.getUser(userId);
  }

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.repository.updateUserProfile({
      where: { userId: userId },
      data: {
        nickname: updateUserDto.nickname,
        image: updateUserDto.image,
      },
    });
  }

  async updateUserState(userId: string, status: string): Promise<User> {
    return this.repository.updateUserState(userId, status);
  }

  async getUserGame(userId: string, gameId: string): Promise<UserGame> {
    return this.repository.getUserGame(userId, gameId);
  }

  /*
   ** 이메일 인증
   */

  // Map<email, code>
  private map = new Map<string, string>();

  async sendVerificationEmail(userEmail: string) {
    // 랜덤한 토큰 생성
    const token = Math.random().toString(36).substring(2, 15);
    console.log(userEmail, token);

    // 생성된 토큰과 함께 이메일 보내기
    await this.mailService.sendMail({
      to: userEmail,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        token,
      },
    });

    // await this.userService.saveVerificationToken(userEmail, token);
  }
}
