import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { TokenHelper } from 'src/common/helpers/token.helper';
import { ChangePasswordDto } from '../dto/change-pass.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthRepository } from '../repositories/auth.repository';

import { TokenResponseDto } from '../dto/refresh-token.dto';

type User = any;

@Injectable()
export class TokenManagementService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async refreshToken(data: RefreshTokenDto): Promise<TokenResponseDto> {
    const { refreshToken } = data;
    console.log(
      '🚀 ~ TokenManagementService ~ refreshToken ~ refreshToken:',
      refreshToken,
    );

    let payload: any;

    // 1️⃣ Verify JWT
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (err) {
      console.log('JWT verify error:', err.message);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub?.toString();
    const jti = payload.jti;

    if (!userId || !jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2️⃣ Check token in Redis
    const key = `refresh:${userId}:${jti}`;
    const hashed = TokenHelper.hashToken(refreshToken);
    const stored = await this.redisClient.get(key);

    if (!stored || stored !== hashed) {
      console.log('Redis token mismatch or not found');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 3️⃣ Fetch user
    const user = await this.authRepo.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    // 4️⃣ Generate new tokens
    const {
      access_token,
      refresh_token: newRefreshToken,
      jti: newJti,
    } = TokenHelper.generateTokens(this.jwtService, user.id, user.email);

    // 5️⃣ Atomic delete old + store new token
    const multi = this.redisClient.multi();
    multi.del(key); // remove old
    multi.set(
      `refresh:${user.id.toString()}:${newJti}`,
      TokenHelper.hashToken(newRefreshToken),
      'EX',
      TokenHelper.REFRESH_TTL,
    );
    await multi.exec();

    // 6️⃣ Return new tokens
    return {
      access_token,
      refresh_token: newRefreshToken,
      expires_in: 900, // 15 minutes
    };
  }

  async getMe(user: { userId: string }): Promise<User> {
    const foundUser = await this.authRepo.findById(user.userId);
    if (!foundUser) throw new UnauthorizedException('User not found');
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
