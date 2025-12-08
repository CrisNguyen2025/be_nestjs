import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { TokenHelper } from 'src/common/helpers/token.helper';
import { CreateUserDto } from '../dto/create-user';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthRepository } from '../repositories/auth.repository';

type User = any;
type Tokens = { access_token: string; refresh_token: string };
@Injectable()
export class AuthenticationService {
  constructor(
    private jwtService: JwtService,
    private readonly authRepo: AuthRepository,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  async loginWithCredentials(
    data: LoginDto,
  ): Promise<Tokens & { user: Omit<User, 'password'> }> {
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

    // Generate tokens
    const { access_token, refresh_token } = TokenHelper.generateTokens(
      this.jwtService,
      user.id,
      user.email,
    );

    // Save refresh token to Redis
    const key = `refresh:${user.id}:${refresh_token}`;
    await this.redisClient.set(key, 'valid', 'EX', 60 * 60 * 24 * 7); // 7 days

    return {
      user: safeUser,
      access_token,
      refresh_token,
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

  async logout(data: LogoutDto): Promise<{ message: string }> {
    const { userId, refresh_token } = data;
    const key = `refresh:${userId}:${refresh_token}`;

    const deleted = await this.redisClient.del(key);

    if (!deleted) {
      return { message: 'Refresh token not found or already invalidated' };
    }

    return { message: 'Logged out successfully' };
  }
}
