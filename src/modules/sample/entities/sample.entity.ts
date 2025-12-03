import { ApiProperty } from '@nestjs/swagger';

export class SampleEntity {
  @ApiProperty({
    example: 1,
    description: 'Unique Id',
  })
  id: number;

  @ApiProperty({
    example: 'Product A',
    description: 'Name of the product',
  })
  name: string;

  @ApiProperty({
    example: 10.5,
    description: 'Price of the product - default',
  })
  price: number;
}
