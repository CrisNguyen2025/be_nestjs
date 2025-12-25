import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { IResponse } from 'src/common/dto/response.dto';
import { SessionHelper } from 'src/common/helpers/session.helper';
import { TokenHelper } from 'src/common/helpers/token.helper';
import { CreateUserDto } from '../dto/create-user';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailService } from './email.service';
import { TokenManagementService } from './token-management.service';

type User = any;
type Tokens = { access_token: string; refresh_token: string };
@Injectable()
export class AuthenticationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenManagementService,
    private readonly emailService: EmailService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.authRepo.findByEmail(email);

    if (!user) {
      // Security: Always return success to prevent enumeration
      return {
        message: 'If this email exists, a new password has been sent to it.',
      };
    }

    // 1️⃣ Generate random password (10 chars)
    const newPassword = Math.random().toString(36).slice(-10);

    // 2️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3️⃣ Update password in DB
    await this.authRepo.updatePassword(user.id.toString(), hashedPassword);

    // 4️⃣ Send Email (SendGrid)
    const emailSent = await this.emailService.sendNewPassword(
      email,
      newPassword,
    );

    if (!emailSent) {
      console.log('----------------------------------------------------');
      console.log(
        `⚠️ [EMAIL FAILED] New Password for ${email}: ${newPassword}`,
      );
      console.log('----------------------------------------------------');
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
        message: 'User not found',
        field: 'email',
        key: 'user_not_found',
      });
    }

    if (!user.password) {
      throw new BadRequestException('Account created with social login');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new BadRequestException({
        message: 'Invalid credentials',
        key: 'invalid_credentials',
      });
    }

    const { password, ...safeUser } = user;

    // 1️⃣ Generate tokens
    const { access_token, refresh_token, jti } = TokenHelper.generateTokens(
      this.jwtService,
      user.id,
      user.email,
    );

    // 2️⃣ Store hashed refresh token in Redis
    await SessionHelper.addSession(
      this.redisClient,
      user.id.toString(),
      jti,
      refresh_token,
      7 * 24 * 60 * 60,
    );

    // Enforce max 2 sessions
    await SessionHelper.enforceSessionLimit(
      this.redisClient,
      user.id.toString(),
      2,
    );

    // 3️⃣ Return tokens
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
  ): Promise<Tokens & { message: string; key?: string }> {
    const existing = await this.authRepo.findByEmail(data.email);

    if (existing)
      throw new BadRequestException({
        message: 'Email already used',
        field: 'email',
        key: 'email_taken',
      });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await this.authRepo.createUser({
      email: data.email,
      password: hashedPassword,
    } as CreateUserDto);

    //token
    const { access_token, refresh_token, jti } = TokenHelper.generateTokens(
      this.jwtService,
      newUser.id,
      newUser.email,
    );

    return {
      message: 'User registered successfully',
      key: 'REGISTER_SUCCESS',
      access_token,
      refresh_token,
    };
  }

  async loginWithProvider(
    idToken: string,
    profile: any,
  ): Promise<Tokens & { user: User }> {
    // TODO: verify idToken, fetch/create user from profile
    let user = await this.authRepo.findByEmail(profile.email);
    if (!user) {
      user = await this.authRepo.createUser({
        email: profile.email,

        password: '', // social login, no password
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
      // Token không hợp lệ vẫn có thể coi là "logged out"
      return { message: 'Refresh token not found or already invalidated' };
    }

    const jti = payload.jti;
    if (!jti) {
      return { message: 'Refresh token not found or already invalidated' };
    }

    const key = `refresh:${userId}:${jti}`;
    const deleted = await this.redisClient.del(key);

    if (!deleted) {
      return { message: 'Refresh token not found or already invalidated' };
    }

    return { message: 'Logged out successfully' };
  }

  async forceLogout(userId: string): Promise<{ message: string }> {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.redisClient.keys(pattern);

    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }

    return { message: 'Logged out from all devices successfully' };
  }
}
