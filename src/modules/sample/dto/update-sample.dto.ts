import { PartialType } from '@nestjs/mapped-types';
import { CreateSampleDto } from './create-sample.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSampleDto extends PartialType(CreateSampleDto) {
  @ApiPropertyOptional({ description: `Sample's name`, example: 'Product B' })
  name?: string;

  @ApiPropertyOptional({ description: `Sample's price`, example: 20 })
  price?: number;
}
