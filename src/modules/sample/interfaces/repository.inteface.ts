import { CreateSampleDto } from '../dto/create-sample.dto';
import { UpdateSampleDto } from '../dto/update-sample.dto';
import { SampleEntity } from '../entities/sample.entity';

export interface ISampleRepository {
  findAll(): Promise<SampleEntity[]>;
  findOne(id: number): Promise<SampleEntity | null>;
  create(data: CreateSampleDto): Promise<SampleEntity>;
  update(id: number, data: UpdateSampleDto): Promise<SampleEntity>;
  remove(id: number): Promise<SampleEntity>;
}
