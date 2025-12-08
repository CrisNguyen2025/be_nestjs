import { Injectable } from '@nestjs/common';
import { ChangePasswordDto } from '../dto/change-pass.dto';
import { AuthRepository } from '../repositories/auth.repository';

type User = any;
type Tokens = { access_token: string; refresh_token: string };

@Injectable()
export class TokenManagementService {
  constructor(private readonly authRepo: AuthRepository) {}

  async refreshToken(userId: string, refreshToken: string): Promise<Tokens> {
    // TODO: validate refresh token
    return {
      access_token: 'NEW_ACCESS_TOKEN',
      refresh_token: 'NEW_REFRESH_TOKEN',
    };
  }

  async getMe(user: { userId: string; email: string }): Promise<User> {
    const foundUser = await this.authRepo.findById(user.userId);
    if (!foundUser) throw new Error('User not found');
    return foundUser;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new Error('User not found');
    // TODO: verify old password & hash new password
    await this.authRepo.update(userId, { password: dto.newPassword });
    return { message: 'Password changed successfully' };
  }
}
