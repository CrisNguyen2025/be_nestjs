import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GatewaysModule } from './gateways/gateways.module';
import { SampleModule } from './modules/sample/sample.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    RedisModule,
    AuthModule,
    SampleModule,
    GatewaysModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
