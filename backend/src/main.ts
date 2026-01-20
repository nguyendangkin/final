import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded by frontend
  }));

  // Gzip Compression
  app.use(compression());

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
