import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { TokenHelper } from 'src/common/helpers/token.helper';
import { ChangePasswordDto } from '../dto/change-pass.dto';
import { RefreshTokenDto, TokenResponseDto } from '../dto/refresh-token.dto';
import { User } from '../interfaces/auth.inteface';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class TokenManagementService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async refreshToken(data: RefreshTokenDto): Promise<TokenResponseDto> {
    const { refreshToken } = data;

    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub?.toString();
    const jti = payload.jti;

    if (!userId || !jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const key = `refresh:${userId}:${jti}`;
    const hashed = TokenHelper.hashToken(refreshToken);
    const stored = await this.redisClient.get(key);

    if (!stored || stored !== hashed) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepo.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const {
      access_token,
      refresh_token: newRefreshToken,
      jti: newJti,
    } = TokenHelper.generateTokens(this.jwtService, user.id, user.email);

    const multi = this.redisClient.multi();
    multi.del(key);
    multi.set(
      `refresh:${user.id.toString()}:${newJti}`,
      TokenHelper.hashToken(newRefreshToken),
      'EX',
      TokenHelper.REFRESH_TTL,
    );
    await multi.exec();

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
    const user = await this.authRepo.findByIdWithPassword(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new BadRequestException({
        message: 'Current password is incorrect',
        key: 'invalid_current_password',
      });

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.authRepo.updatePassword(userId, hashed);

    return { message: 'Password changed successfully' };
  }
}
