import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SampleModule } from './modules/sample/sample.module';

@Module({
  imports: [SampleModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
