import { Role } from '@prisma/client';
import { IResponse } from 'src/common/dto/response.dto';
import { ChangePasswordDto } from '../dto/change-pass.dto';
import { CreateUserDto } from '../dto/create-user';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

export interface User {
  id: number;
  email: string;
  password?: string;
  role: Role;
  emailVerified: boolean;
  emailVerifiedAt?: Date | null;
  emailVerifyTokenHash?: string | null;
  emailVerifyCodeHash?: string | null;
  emailVerifyExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null>;
  createUser(data: CreateUserDto): Promise<User>;
  findById(userId: string): Promise<User | null>;
  findPublicById(userId: string): Promise<User | null>;
  findByIdWithPassword(userId: string): Promise<User | null>;
  update(userId: string, data: any): Promise<User>;
}

export interface IAuthService {
  loginWithCredentials(
    data: LoginDto,
  ): Promise<IResponse<{ user: Omit<User, 'password'>; tokens: Tokens }>>;
  registerWithCredentials(
    data: RegisterDto,
  ): Promise<{ message: string; key?: string }>;
  loginWithProvider(
    idToken: string,
    profile: any,
  ): Promise<Tokens & { user: User }>;

  forceLogout(userId: string): Promise<{ message: string }>;
  logout(userId: string, refresh_token: string): Promise<{ message: string }>;
  refreshToken(userId: string, refresh_token: string): Promise<Tokens>;
  getMe(user: { userId: string; email: string }): Promise<User>;
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }>;

  forgotPassword(email: string): Promise<{ message: string }>;
  requestEmailVerification(data: {
    email: string;
  }): Promise<{ message: string }>;
  confirmEmail(data: {
    token?: string;
    email?: string;
    code?: string;
  }): Promise<{ message: string }>;

  checkEmail(email: string): Promise<{ message: string; value: number }>;
}
