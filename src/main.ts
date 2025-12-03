import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Document
  const config = new DocumentBuilder()
    .setTitle('Nestjs core Api')
    .setDescription('The example API description')
    .setVersion('1.0')
    .addTag('---SWAGGER---')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // 🔥 CORS enabled
  app.enableCors({
    origin: ['*'], // Allow all
    credentials: true, // Allow cookies
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
