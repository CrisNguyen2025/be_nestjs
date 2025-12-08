import { ChangePasswordDto } from '../dto/change-pass.dto';
import { CreateUserDto } from '../dto/create-user';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

// Giả định User và Tokens type
type User = any;
type Tokens = { access_token: string; refresh_token: string };

// DB layer
export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  createUser(data: CreateUserDto): Promise<User>;
  findById(userId: string): Promise<User | null>;
  update(userId: string, data: any): Promise<User>;
}

// Business logic
export interface IAuthService {
  // Authentication & Registration
  loginWithCredentials(
    data: LoginDto,
  ): Promise<Tokens & { user: Omit<User, 'password'> }>;
  registerWithCredentials(
    data: RegisterDto,
  ): Promise<Tokens & { message: string }>;
  loginWithProvider(
    idToken: string,
    profile: any,
  ): Promise<Tokens & { user: User }>;

  // Token & User Management
  logout(userId: string, refresh_token: string): Promise<{ message: string }>;
  refreshToken(userId: string, refresh_token: string): Promise<Tokens>;
  getMe(user: { userId: string; email: string }): Promise<User>;
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }>;

  // Utilities
  checkEmail(email: string): Promise<{ message: string; value: number }>;
}
