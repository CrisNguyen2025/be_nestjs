import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';

export class TokenHelper {
  static REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days

  static hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  static generateTokens(jwtService: JwtService, userId: number, email: string) {
    const jti = randomUUID();

    const access_token = jwtService.sign(
      { sub: userId, email },
      { expiresIn: '15m' },
    );

    const refresh_token = jwtService.sign(
      { sub: userId, email, jti },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    return { access_token, refresh_token, jti };
  }

  static async storeRefreshToken(
    redis: any,
    userId: string,
    jti: string,
    refresh_token: string,
  ) {
    const hashed = this.hashToken(refresh_token);

    await redis.set(`refresh:${userId}:${jti}`, hashed, 'EX', this.REFRESH_TTL);
  }
}
