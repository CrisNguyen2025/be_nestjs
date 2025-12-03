import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { validationPipeRules } from './config/validation-pipe.config';
import { swaggerConfiguration } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Validation input
  app.useGlobalPipes(validationPipeRules());
  // 2.Normalize ouput error
  app.useGlobalFilters(new AllExceptionsFilter());
  // 3.Document with Swagger
  swaggerConfiguration(app, 'api');

  // 4.🔥CORS enabled
  app.enableCors({
    origin: ['*'], // Allow all
    credentials: true, // Allow cookies
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  //5.Listen app
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
