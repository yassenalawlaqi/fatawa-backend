import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Fatawa Search Engine API')
    .setDescription('The official API documentation for the Fatawa Search Engine.')
    .setVersion('1.0')
    .addTag('Search')
    .addTag('Fatawa')
    .addTag('Scholars')
    .addTag('Categories')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Swagger UI available at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
