import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetMeDto {
  @ApiProperty({
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;
}
