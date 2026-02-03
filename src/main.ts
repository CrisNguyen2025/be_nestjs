import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerConfiguration } from './config/swagger.config';
import { validationPipeRules } from './config/validation-pipe.config';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { RedisIoAdapter } from './gateways/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Validation input
  app.useGlobalPipes(validationPipeRules());
  // 2.Normalize ouput error
  app.useGlobalFilters(new AllExceptionsFilter());
  // 3.Document with Swagger
  swaggerConfiguration(app, 'api');

  // 4.🔥CORS enabled
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // 5. Redis Adapter for WebSocket Scaling
  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  //6.Listen app
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
