import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded by frontend
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'], // Allow external images
          scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for some inline scripts if necessary, tighten if possible
          styleSrc: ["'self'", "'unsafe-inline'"], // Common for CSS-in-JS
        },
      },
    }),
  );

  // Global Validation Pipe - Critical for security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // Gzip Compression
  app.use(compression());

  // Strict CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // Frontend local
      'http://localhost:3001', // Frontend/Admin local alternate
      process.env.FRONTEND_URL, // Production URL
    ].filter(Boolean),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
