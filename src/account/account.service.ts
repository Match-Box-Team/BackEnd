import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifySuccessMsgDto } from './dto/verify-success-msg.dto';

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

  async sendVerificationEmail(userId: string, userEmail: string): Promise<void> {
    // 랜덤한 토큰 생성
    const code = Math.random().toString(36).substring(2, 15);
    console.log(userEmail, code);

    // 생성된 토큰과 함께 이메일 보내기
    await this.mailService.sendMail({
      to: userEmail,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        code,
      },
    });

    this.map.set(userId, code);
  }

  async verifyCode(userId: string, inputCode: string): Promise<VerifySuccessMsgDto> {
    const storedCode = this.map.get(userId);
    if (storedCode === null) {
      throw new NotFoundException('Token not found');
    }

    if (inputCode === storedCode) {
      this.map.delete(userId);
      console.log({ success: true, message: 'Verification succeeded' });
      return { success: true, message: 'Verification succeeded' };
    } else {
      console.log({ success: false, message: 'Token mismatch' });
      return { success: false, message: 'Token mismatch' };
    }
  }
}
