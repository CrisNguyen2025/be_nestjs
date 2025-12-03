import { Controller, Delete, Param } from '@nestjs/common';
import { SampleService } from '../services/sample.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Sample')
@Controller('sample')
export class DeleteSampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Remove sample by id' })
  remove(@Param('id') id: string) {
    return this.sampleService.remove(+id);
  }
}
