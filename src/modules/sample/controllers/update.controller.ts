import { Controller, Patch, Param, Body } from '@nestjs/common';
import { SampleService } from '../services/sample.service';
import { UpdateSampleDto } from '../dto/update-sample.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Sample')
@Controller('sample')
export class UpdateSampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sample by id' })
  update(@Param('id') id: string, @Body() updateSampleDto: UpdateSampleDto) {
    return this.sampleService.update(+id, updateSampleDto);
  }
}
