import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserGame } from '@prisma/client';
import { AccountRepository } from './repository/account.repository';
import { MailerService } from '@nestjs-modules/mailer';
import { UpdateUserDto } from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(
    private mailService: MailerService,
    private repository: AccountRepository,
  ) {}

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

  async sendVerificationEmail(userId: string): Promise<void> {
    const userEmail = await this.repository.getUserEmail(userId);
    if (userEmail === null) {
      throw new NotFoundException('Not found user email');
    }
    const code = Math.random().toString(36).substring(2, 15);

    await this.mailService.sendMail({
      to: userEmail.email,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        code,
      },
    });
    this.map.set(userId, code);
  }

  async verifyTimeOut(userId: string) {
    this.map.delete(userId);
  }

  async verifyCode(userId: string, inputCode: string) {
    const storedCode = this.map.get(userId);
    if (storedCode === null) {
      throw new NotFoundException('User not has code');
    }

    if (inputCode === storedCode) {
      this.map.delete(userId);
      return { success: true, message: 'Verification succeeded' };
    } else {
      return { success: false, message: 'Token mismatch' };
    }
  }
}
