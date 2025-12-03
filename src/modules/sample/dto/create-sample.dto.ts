import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateSampleDto {
  @ApiProperty({ description: `Sample's name`, example: 'Product A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: `Sample's price`, example: 10.5 })
  @IsNumber()
  @Min(0)
  price: number;
}
