import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({ example: 'password456' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword: string;

  @ApiProperty({ example: 'password456', required: false })
  @IsOptional()
  confirmNewPassword?: string;
}
