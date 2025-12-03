import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerConfiguration(
  app: INestApplication,
  path: string = 'api',
): void {
  const config = new DocumentBuilder()
    .setTitle('Nestjs core Api')
    .setDescription('The example API description')
    .setVersion('1.0')
    .addTag('---SWAGGER---')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document);
}
