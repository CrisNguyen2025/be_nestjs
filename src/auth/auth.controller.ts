import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-pass.dto';
import { CreateUserDto } from './dto/create-user';
import { LoginDto } from './dto/login.dto';

import { IResponse } from 'src/common/dto/response.dto';
import { CheckEmailDto, CheckEmailResponseDto } from './dto/check-email.dto';
import { ForceLogoutDto } from './dto/force-logout.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto, TokenResponseDto } from './dto/refresh-token.dto';
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
        access_token: 'ACCESS_TOKEN',
        refresh_token: 'REFRESH_TOKEN',
        message: 'User created successfully',
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
  async logout(@Body() dto: LogoutDto, @Req() req: any) {
    const userId = req.user.userId;
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
  async getMe(@Req() req: any) {
    const userId = req.user.userId;
    return this.tokenService.getMe({ userId });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<IResponse<{ message: string }>> {
    const userId = req.user.userId;
    const result = await this.tokenService.changePassword(userId, dto);
    return { success: true, data: result };
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
