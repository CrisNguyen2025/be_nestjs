import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token mới',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token mới',
  })
  refresh_token: string;

  @ApiProperty({
    example: 3600,
    description: 'Thời gian hết hạn của access token (giây)',
  })
  expires_in: number;
}
