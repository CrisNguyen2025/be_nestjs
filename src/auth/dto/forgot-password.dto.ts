import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If this email exists, a new password has been sent to it.',
    description: 'Response message',
  })
  message: string;
}
