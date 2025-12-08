import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @ApiProperty({
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
