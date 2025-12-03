import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSampleDto } from '../dto/create-sample.dto';
import { UpdateSampleDto } from '../dto/update-sample.dto';
import { ISampleRepository } from '../interfaces/repository.inteface';

@Injectable()
export class SampleRepository implements ISampleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSampleDto) {
    return this.prisma.sample.create({ data });
  }

  async findAll() {
    return this.prisma.sample.findMany();
  }

  async findOne(id: number) {
    return this.prisma.sample.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateSampleDto) {
    return this.prisma.sample.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.sample.delete({ where: { id } });
  }

  async sssssss() {
    return this.prisma.sample.deleteMany();
  }
}
