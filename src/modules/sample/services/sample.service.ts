import { Injectable } from '@nestjs/common';
import { CreateSampleDto } from '../dto/create-sample.dto';
import { UpdateSampleDto } from '../dto/update-sample.dto';
import { SampleRepository } from '../repositories/sample.repository';

@Injectable()
export class SampleService {
  constructor(private readonly sampleRepository: SampleRepository) {}

  create(createSampleDto: CreateSampleDto) {
    return this.sampleRepository.create(createSampleDto);
  }

  findAll() {
    return this.sampleRepository.findAll();
  }

  findOne(id: number) {
    return this.sampleRepository.findOne(id);
  }

  update(id: number, updateSampleDto: UpdateSampleDto) {
    return this.sampleRepository.update(id, updateSampleDto);
  }

  remove(id: number) {
    return this.sampleRepository.remove(id);
  }
}
