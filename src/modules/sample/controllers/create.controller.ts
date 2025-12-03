import { Controller, Post, Body } from '@nestjs/common';
import { SampleService } from '../services/sample.service';
import { CreateSampleDto } from '../dto/create-sample.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SampleEntity } from '../entities/sample.entity';

@ApiTags('Sample')
@Controller('sample')
export class CreateSampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Post()
  @ApiOperation({ summary: 'Create new sample' })
  @ApiResponse({
    status: 201,
    description: 'Sample created',
    type: SampleEntity,
  })
  create(@Body() createSampleDto: CreateSampleDto) {
    return this.sampleService.create(createSampleDto);
  }
}
