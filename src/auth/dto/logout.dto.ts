import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
