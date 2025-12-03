import { Controller, Get, Param } from '@nestjs/common';
import { SampleService } from '../services/sample.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Sample')
@Controller('sample')
export class ReadSampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Get()
  @ApiOperation({ summary: 'List all samples' })
  findAll() {
    return this.sampleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'List detail sample by id' })
  findOne(@Param('id') id: string) {
    return this.sampleService.findOne(+id);
  }
}
