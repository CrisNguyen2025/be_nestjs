import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForceLogoutDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
