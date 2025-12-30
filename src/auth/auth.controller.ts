import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-pass.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { CreateUserDto } from './dto/create-user';
import { LoginDto } from './dto/login.dto';

import { IResponse } from 'src/common/dto/response.dto';
import { CheckEmailDto, CheckEmailResponseDto } from './dto/check-email.dto';
import { ForceLogoutDto } from './dto/force-logout.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
} from './dto/forgot-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto, TokenResponseDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AuthenticationService } from './services/authen.service';
import { TokenManagementService } from './services/token-management.service';
import { UtilitiesService } from './services/utilities.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenService: TokenManagementService,
    private readonly utilService: UtilitiesService,
  ) {}

  // -------- Authentication --------
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        message: 'User registered successfully. Please verify your email.',
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerWithCredentials(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    schema: {
      example: {
        access_token: 'ACCESS_TOKEN',
        refresh_token: 'REFRESH_TOKEN',
        user: { id: 1, email: 'user@example.com', role: 'USER' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() data: LoginDto) {
    return this.authService.loginWithCredentials(data);
  }

  // @Post('login/social')
  // @ApiOperation({ summary: 'Login via social provider' })
  // async loginWithProvider(@Body() body: { idToken: string; profile: any }) {
  //   return this.authService.loginWithProvider(body.idToken, body.profile);
  // }

  // -------- Token & User Management --------
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: LogoutDto, @CurrentUser('userId') userId: string) {
    return this.authService.logout(userId, dto.refresh_token);
  }

  @Post('force-logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Force logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices successfully',
  })
  async forceLogout(@Body() dto: ForceLogoutDto) {
    return this.authService.forceLogout(dto.userId);
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh JWT token',
    description: 'Lấy access token mới bằng refresh token cũ',
  })
  @ApiResponse({
    status: 200,
    description: 'Token được refresh thành công',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token không hợp lệ',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Refresh token không hợp lệ',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.tokenService.refreshToken(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user info' })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.tokenService.getMe({ userId });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<IResponse<{ message: string }>> {
    const result = await this.tokenService.changePassword(userId, dto);
    return { success: true, data: result };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset (auto-generated new password)',
  })
  @ApiResponse({
    status: 200,
    description: 'New password sent successfully (simulated)',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Send email verification' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.requestEmailVerification(dto);
  }

  @Post('confirm-email')
  @ApiOperation({ summary: 'Confirm email verification' })
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.authService.confirmEmail(dto);
  }

  @Get('confirm-email')
  @ApiOperation({ summary: 'Confirm email verification via link' })
  async confirmEmailFromLink(@Query() dto: ConfirmEmailDto) {
    return this.authService.confirmEmail(dto);
  }

  // -------- Utilities --------
  @Post('check-email')
  @ApiOperation({ summary: 'Check if email exists' })
  @ApiResponse({ status: 200, type: CheckEmailResponseDto })
  async checkEmail(
    @Body() dto: CheckEmailDto,
  ): Promise<IResponse<CheckEmailResponseDto>> {
    return this.utilService.checkEmail(dto.email);
  }
}
