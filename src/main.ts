import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
const compression = require('compression');
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './config/swagger.config';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Auto-seed if empty
  try {
    const prisma = new PrismaClient();
    const count = await prisma.fatwa.count();
    if (count === 0) {
      console.log('Database is empty. Auto-injecting Fatawa...');
      execSync('node dist/prisma/seed.js', { stdio: 'inherit' });
      execSync('node dist/prisma/import-real-fatawa.js', { stdio: 'inherit' });
      console.log('Fatawa injected successfully.');
    }
  } catch (e) {
    console.log('Skipping auto-seed due to error:', e);
  }

  // Logger
  app.useLogger(app.get(Logger));

  // Security & Optimization
  app.use(helmet());
  app.use(compression());
  app.enableCors();

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger Docs available at: http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
