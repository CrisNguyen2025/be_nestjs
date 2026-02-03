import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import Redis from 'ioredis';
import { IResponse } from 'src/common/dto/response.dto';
import { SessionHelper } from 'src/common/helpers/session.helper';
import { TokenHelper } from 'src/common/helpers/token.helper';
import { ConfirmEmailDto } from '../dto/confirm-email.dto';
import { CreateUserDto } from '../dto/create-user';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { Tokens, User } from '../interfaces/auth.inteface';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailService } from './email.service';
import { TokenManagementService } from './token-management.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenManagementService,
    private readonly emailService: EmailService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  private readonly logger = new Logger(AuthenticationService.name);

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.authRepo.findByEmail(email);

    if (!user) {
      // Security: Always return success to prevent enumeration
      return {
        message: 'If this email exists, a new password has been sent to it.',
      };
    }

    const newPassword = Math.random().toString(36).slice(-10);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.authRepo.updatePassword(user.id.toString(), hashedPassword);

    const emailSent = await this.emailService.sendNewPassword(
      email,
      newPassword,
    );

    if (!emailSent) {
      this.logger.error(
        `⚠️ [EMAIL FAILED] New Password for ${email}: ${newPassword}`,
      );
    }

    return {
      message: 'If this email exists, a new password has been sent to it.',
    };
  }

  async loginWithCredentials(
    data: LoginDto,
  ): Promise<IResponse<{ user: Omit<User, 'password'>; tokens: Tokens }>> {
    const user = await this.authRepo.findByEmail(data.email);

    if (!user) {
      throw new BadRequestException({
        message: 'Invalid credentials',
        key: 'invalid_credentials',
      });
    }

    if (!user.password) {
      throw new BadRequestException({
        key: 'invalid_credentials',
      });
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new BadRequestException({
        message: 'Invalid credentials',
        key: 'invalid_credentials',
      });
    }

    if (!user.emailVerified) {
      throw new BadRequestException({
        message: 'Email not verified. Please request verification.',
        key: 'email_not_verified',
      });
    }

    const { password, ...safeUser } = user;

    const { access_token, refresh_token, jti } = TokenHelper.generateTokens(
      this.jwtService,
      user.id,
      user.email,
    );

    await SessionHelper.addSession(
      this.redisClient,
      user.id.toString(),
      jti,
      refresh_token,
      TokenHelper.REFRESH_TTL,
    );

    await SessionHelper.enforceSessionLimit(
      this.redisClient,
      user.id.toString(),
      2,
    );

    return {
      success: true,
      data: {
        user: safeUser,
        tokens: { access_token, refresh_token },
      },
    };
  }

  async registerWithCredentials(
    data: RegisterDto,
  ): Promise<{ message: string; key?: string }> {
    const existing = await this.authRepo.findByEmail(data.email);

    if (existing)
      throw new BadRequestException({
        message: 'Email already used',
        field: 'email',
        key: 'email_taken',
      });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.authRepo.createUser({
      email: data.email,
      password: hashedPassword,
    } as CreateUserDto);

    return {
      message: 'User registered successfully. Please verify your email.',
      key: 'REGISTER_SUCCESS',
    };
  }

  async requestEmailVerification(
    data: VerifyEmailDto,
  ): Promise<{ message: string }> {
    const user = await this.authRepo.findByEmail(data.email);

    if (!user) {
      return {
        message: 'If this email exists, a verification email was sent.',
      };
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    await this.issueEmailVerification(user);
    return { message: 'Verification email sent' };
  }

  async confirmEmail(dto: ConfirmEmailDto): Promise<{ message: string }> {
    if (dto.token) {
      const tokenHash = TokenHelper.hashToken(dto.token);
      const user =
        await this.authRepo.findByEmailVerificationTokenHash(tokenHash);

      if (!user) {
        throw new BadRequestException({
          message: 'Invalid verification token',
          key: 'invalid_token',
        });
      }

      return this.finalizeEmailVerification(user);
    }

    if (!dto.email || !dto.code) {
      throw new BadRequestException({
        message: 'Email and code are required',
        key: 'missing_email_or_code',
      });
    }

    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException({
        message: 'Invalid email or code',
        key: 'invalid_email_or_code',
      });
    }

    const codeHash = TokenHelper.hashToken(dto.code);
    if (!user.emailVerifyCodeHash || user.emailVerifyCodeHash !== codeHash) {
      throw new BadRequestException({
        message: 'Invalid verification code',
        key: 'invalid_code',
      });
    }

    return this.finalizeEmailVerification(user);
  }

  private async finalizeEmailVerification(user: User) {
    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    if (!user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
      throw new BadRequestException({
        message: 'Verification code has expired',
        key: 'verification_expired',
      });
    }

    await this.authRepo.update(user.id.toString(), {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifyTokenHash: null,
      emailVerifyCodeHash: null,
      emailVerifyExpiresAt: null,
    });

    return { message: 'Email verified successfully' };
  }

  private async issueEmailVerification(user: User) {
    if (user.emailVerified) {
      return;
    }

    const token = randomUUID();
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.authRepo.update(user.id.toString(), {
      emailVerifyTokenHash: TokenHelper.hashToken(token),
      emailVerifyCodeHash: TokenHelper.hashToken(code),
      emailVerifyExpiresAt: expiresAt,
    });

    const apiUrl =
      process.env.API_URL || process.env.APP_URL || 'https://app.com';
    const confirmLink = `${apiUrl}/auth/confirm-email?token=${token}`;

    const emailSent = await this.emailService.sendEmailVerification(
      user.email,
      confirmLink,
      code,
      token,
    );

    if (!emailSent) {
      this.logger.error(
        `⚠️ [EMAIL FAILED] Verify ${user.email}: token=${token} code=${code}`,
      );
    }
  }

  async loginWithProvider(
    idToken: string,
    profile: any,
  ): Promise<Tokens & { user: User }> {
    let user = await this.authRepo.findByEmail(profile.email);
    if (!user) {
      user = await this.authRepo.createUser({
        email: profile.email,
        password: '',
      } as CreateUserDto);
    }

    return {
      user,
      access_token: 'ACCESS_TOKEN',
      refresh_token: 'REFRESH_TOKEN',
    };
  }

  async logout(
    userId: string,
    refreshToken: string,
  ): Promise<{ message: string }> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (err) {
      return { message: 'Refresh token not found or already invalidated' };
    }

    const jti = payload.jti;
    if (!jti) {
      return { message: 'Refresh token not found or already invalidated' };
    }

    const key = `refresh:${userId}:${jti}`;
    const stored = await this.redisClient.get(key);

    if (!stored || stored !== TokenHelper.hashToken(refreshToken)) {
      return { message: 'Refresh token not found or already invalidated' };
    }

    const multi = this.redisClient.multi();
    multi.del(key);
    multi.zrem(`user:sessions:${userId}`, jti);
    multi.set(`bl:access:${jti}`, '1', 'EX', TokenHelper.ACCESS_TTL);
    await multi.exec();

    return { message: 'Logged out successfully' };
  }

  async forceLogout(userId: string): Promise<{ message: string }> {
    await SessionHelper.forceLogoutAll(this.redisClient, userId);

    return { message: 'Logged out from all devices successfully' };
  }
}
