import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email to check' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class CheckEmailResponseDto {
  @ApiProperty({
    example: 'Email exists',
    description: 'Message about email status',
  })
  message: string;

  @ApiProperty({ example: 1, description: '1 = exists, 0 = available' })
  value: number;
}
