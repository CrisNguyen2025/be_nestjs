import { Module } from '@nestjs/common';
import { SampleService } from './services/sample.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSampleController } from './controllers/create.controller';
import { ReadSampleController } from './controllers/read.controller';
import { UpdateSampleController } from './controllers/update.controller';
import { DeleteSampleController } from './controllers/delete.controller';
import { SampleRepository } from './repositories/sample.repository';

@Module({
  controllers: [
    CreateSampleController,
    ReadSampleController,
    UpdateSampleController,
    DeleteSampleController,
  ],
  providers: [SampleService, PrismaService, SampleRepository],
})
export class SampleModule {}
