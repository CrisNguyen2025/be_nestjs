import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-pass.dto';
import { CreateUserDto } from './dto/create-user';
import { LoginDto } from './dto/login.dto';

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

  @Get('me/:userId')
  @ApiOperation({ summary: 'Get current user info' })
  async getMe(
    @Param('userId') userId: string,
    @Body() body: { email: string },
  ) {
    return this.tokenService.getMe({ userId, email: body.email });
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Body() body: { userId: string; dto: ChangePasswordDto },
  ) {
    return this.tokenService.changePassword(body.userId, body.dto);
  }

  // -------- Utilities --------
  @Post('check-email')
  @ApiOperation({ summary: 'Check if email exists' })
  async checkEmail(@Body('email') email: string) {
    return this.utilService.checkEmail(email);
  }
}
